# Composed scalar values

A composed field mixes authored text with literals and read-only sources. It registers one string at one field path. That canonical string is the value in React Hook Form, the input to the schema, and the submitted value unless the schema explicitly transforms its output.

```tsx
import { z } from "zod";
import { defineForm } from "@/lib/formulate-config";

const Customer = defineForm({
  region: {
    schema: z.string(), defaultValue: "AU", label: "Region", component: "input",
  },
  reference: {
    schema: z.string().regex(/^CUS-[A-Z]{2}-\d{4}$/, "Enter a four-digit sequence."),
    defaultValue: "CUS-AU-0042", label: "Reference", component: "composedInput",
    composition: {
      segments: [
        { literal: "CUS-" }, { binding: "region" },
        { literal: "-" }, { input: true, placeholder: "0042" },
      ],
    },
  },
});
```

The reference editor shows `CUS-`, the current region, `-`, and a text input containing `0042`. Changing the region to `NZ` gives `{ region: "NZ", reference: "CUS-NZ-0042" }`. There is no sequence or segment state in the payload.

Use the ordinary `Customer.useForm`, `Customer.Form` and `Customer.Field` helpers. `useChoiceForm` installs the same composition behavior alongside dependent choices. `composition` also works on reusable `defineField` declarations; changing construction rules means deriving a new definition, like changing its schema.

## Segment sources

| Segment | Meaning |
| --- | --- |
| `{ literal: "@company.com" }` | Fixed text, included verbatim. |
| `{ input: true, label?: string, placeholder?: string }` | Editable text within this scalar. Labels distinguish multiple inputs. |
| `{ binding: "organization.slug" }` | Read a path in the current definition's editing values. |
| `{ context: "organization.slug" }` | Read a path in the runtime's external `compositionContext`. |
| `{ binding: "region", transform: value => String(value).toUpperCase() }` | Transform a source into text before joining. Context sources accept the same option. |

Literal, binding, and context segments are inherently read-only. Optional `readonly: true` makes that explicit; `readonly: false` is not accepted. Strings, finite numbers, and booleans convert to text. Missing/null sources produce an empty segment. Objects require an explicit transform. Transforms receive `unknown`, must return strings, and should be pure and synchronous.

Context never becomes a submitted member. Pass `compositionContext: { organization: { slug: currentOrganization.slug } }` to the form hook and replace that object when external state changes.

Field bindings read schema **input** values, before schema output transforms. They are relative to their declaring section: two uses of the same section each read their own sibling fields. A form declaration can bind nested paths such as `organization.slug`. There is no implicit lookup in an enclosing section; use context for external sources or declare the composition in the owning scope.

## Canonical state and lifecycle

Composition belongs to the form runtime, so source changes recompute values even when their editors are hidden, unmounted, or never rendered. Composed fields can feed other composed fields; the runtime orders dependencies and rejects cycles. Source changes preserve authored pieces and revalidate affected final values. They never write back to source fields.

Supply a complete canonical default, or `""` to start with all editable pieces empty. Initialization composes defaults before RHF records its clean baseline. An empty email editor therefore has the canonical string `"@company.com"`; use `z.email()` or an appropriate whole-string rule, since `z.string().min(1)` alone would accept that suffix.

`setValue`, `setValues`, and `reset` use the same canonical representation. Reset restores authored defaults with the current context and establishes a canonical dirty-state baseline. Programmatic source updates reconcile before those setters return; ordinary input events synchronize through the form subscription. Form submit and schema validation flush pending composition before checking final values.

A single input is recovered by removing its known prefix and suffix. Load external canonical values with matching bound/context sources. If an external string lacks a known affix, unmatched text is preserved as authored content and current affixes are applied; composition does not silently discard it. Use an explicit `parse` when imported data needs a different reconstruction rule. Validation determines whether the result is acceptable.

For a schema-first host or an explicitly mapped section, pass its bound descriptors into the same runtime:

```tsx
const naming = Naming.bind<HostValues>({
  id: "customer",
  bindings: { region: "customerRegion", reference: "customerReference" },
});
const form = useFormulate({
  schema: hostSchema,
  defaultValues: hostDefaults,
  compositions: naming.compositions,
});
// <Naming.Bind control={form.control} binding={naming} />
```

Both target and source paths are remapped. Normal nested section declarations install these descriptors automatically. Definitions and `bindSection` expose `compositions`; `bindStringCompositions` remaps descriptor lists for custom hosts. Create definitions/bindings outside render or memoize them. A raw RHF runtime does not install construction semantics by rendering a composed control alone.

## Multiple editable parts

One editable piece needs no parser. More than one requires an explicit inverse because separators may occur in user text. The parser returns editable strings in input order, and receives resolved segments as its second argument when it needs current affixes.

```tsx
composition: {
  segments: [
    { literal: "SKU-" }, { input: true, label: "Style" },
    { literal: "-" }, { input: true, label: "Size" },
  ],
  parse(value) {
    const remainder = value.slice(4);
    const separator = remainder.indexOf("-");
    return separator < 0
      ? [remainder, ""]
      : [remainder.slice(0, separator), remainder.slice(separator + 1)];
  },
}
```

Pair this example with a schema excluding hyphens from accepted styles. Parsers must reconstruct accepted persisted values without losing information. Temporary invalid edits retain their partition, allowing validation feedback without moving text between inputs. Remounting within the same runtime retains that partition; loading a scalar into a new runtime uses the parser. `""` always initializes every editable piece to empty. Zero editable pieces are supported for fully generated values.

## Local shadcn control

`@formulate/shadcn-bindings` installs `ComposedInputControl` and maps it to `composedInput`. One input with prefixes/suffixes uses `InputGroupInput` and `InputGroupAddon`, following [shadcn's Input Group composition](https://ui.shadcn.com/docs/components/base/input-group). Bound values are visually distinct, and fixed segments are text.

Arbitrary interleaving uses a small custom arrangement of the same Input Group parts in segment order. It supplies one logical blur, accessible labels for editable pieces, and correction focus on the first input. Fully generated values have a focusable read-only display. Disabled state comes from the normal field binding. One hidden input carries the complete scalar for native `FormData`; fragment inputs have no submitted names.

Custom controls use `useComposedFieldBinding()`. It extends the existing binding with resolved `segments` and `onInputChange(segmentIndex, text)`. There is no extra field registration. The default HTML map remains input/number/checkbox; register your own composed control through `createFormulate` when not using the supplied shadcn map.

See the [example declaration](../../../examples/react/src/declarations/composed-values.ts) and [composition](../../../examples/react/src/compositions/composed-values.tsx) for fixed email domains, URLs, resource names, transformed customer references, and a multi-input SKU. [String patterns](string-patterns.md) remain a separate schema capability and work with ordinary inputs too.
