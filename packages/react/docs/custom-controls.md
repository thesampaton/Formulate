# Custom controls

Formulate’s standard UI starts with your application’s shadcn components and the [local bindings](../../../examples/react/src/lib/formulate-config.ts) that connect them to form values, labels, and errors. Use this guide to customise those bindings or connect another control while retaining the form’s rules and behaviour.

## Connect an existing input

An adapter reads the enclosing field with `useFieldBinding`. Translate your component's events into values at this boundary:

```tsx
import { defineFieldControl, useFieldBinding } from "@formulate/react";
import type { InputControlProps } from "@formulate/react";
import { Input } from "./ui/input";

export const LocalInputControl = defineFieldControl<string>()(
  function LocalInputControl(props: InputControlProps) {
    const field = useFieldBinding<string>();
    return (
      <Input {...props} {...field}
        onChange={(event) => field.onChange(event.target.value)} />
    );
  },
);
```

This assumes your local `Input` accepts normal text-input props and forwards its `ref` to the input. For a component with different props, derive the adapter's props from that component and omit the properties owned by the binding: `ref`, `id`, `name`, value/default-value props, change/blur handlers, `disabled`, `aria-invalid`, and `aria-describedby`.

`defineFieldControl<string>()` declares the type of value the adapter edits. It leaves the component unchanged. `useFieldBinding<string>()` reads the existing connection; it does not register another controller or create another value store.

## Register the adapter once

Create a local configuration module. Extend `defaultComponents` when you want to keep the built-in controls:

```tsx
import { createFormulate, defaultComponents } from "@formulate/react";
import { LocalInputControl } from "./local-input-control";

export const { Field, field, defineForm, defineSection } = createFormulate({
  components: { ...defaultComponents, input: LocalInputControl },
});
```

Import these configured helpers wherever your application declares forms. Now `component: "input"` selects `LocalInputControl`. Call `createFormulate` once at module scope; no configuration provider is needed.

Map entries are connected components. Replacing an entry replaces its supported props and defaults. Configuration does not deep-merge controls or their props. Add another key, such as `select`, when the UI has a different contract.

For example, this form uses the configuration module above:

```tsx
import { defineForm } from "./formulate-config";
import { z } from "zod";

const Contact = defineForm({
  email: {
    schema: z.email(), defaultValue: "", label: "Email",
    component: "input", componentProps: { type: "email" },
  },
});

export function ContactForm() {
  const form = Contact.useForm();
  return <Contact.Form form={form} onSubmit={console.info}>
    <Contact.Fields />
    <button type="submit">Save</button>
  </Contact.Form>;
}
```

TypeScript checks component keys, required and supported props, and the editing value accepted by a declared field's control. Plain fields also check names and value types when given an explicit typed `control`.

## Preserve focus, events, and accessible labels

The binding provides these properties:

| Property | Connect it to |
| --- | --- |
| `value`, `onChange(value)` | The controlled value and a value-based change handler |
| `onBlur` | The editor's blur event, so blur validation and touched state work |
| `ref` | The focusable editor, or the primary trigger of a compound control |
| `id` | The same focusable element, so the field's label points to it |
| `name`, `disabled` | The corresponding component properties |
| `aria-invalid`, `aria-describedby` | The focusable element, to associate validation state and help/error text |

A checkbox maps `value` to `checked` and sends boolean changes. A select may use `onValueChange` instead of `onChange`, and put the ref and accessible attributes on its trigger. Keep one connected editor per `Field`.

The [example adapters](../../../examples/react/src/components/formulate/controls.tsx) show inputs, checkboxes, and a compound shadcn Select. That Select ignores empty notifications from its native form bridge while React Activity reconnects effects; use RHF's `setValue` or `reset` to deliberately clear it.

Put additional event behavior in the adapter, after updating the binding. Built-in control props intentionally exclude managed events, values, and accessibility attributes so a field declaration cannot disconnect its control.

## Compose a particular field

For a special arrangement, pass connected children instead of using the component map. This replaces `<Contact.Fields />` in the form above; import `InputControl` from `@formulate/react`:

```tsx
<Contact.Field name="email">
  <div className="input-row">
    <InputControl type="email" autoComplete="email" />
    <span aria-hidden="true">@</span>
  </div>
</Contact.Field>
```

The child gets the same binding through context. It explicitly selects `InputControl`, so changing the configured `input` map entry does not change this child. You can use `LocalInputControl` here instead.

Children replace the declared control and its `componentProps`, while keeping the field's schema and editing type. Do not also pass `componentProps`. A raw `<input>` child is not automatically connected: use an adapter that calls `useFieldBinding`.

TypeScript cannot check a connected child's value contract through arbitrary JSX wrappers. The adapter author must ensure it matches the field. Built-in controls report incompatible runtime values; any connected control used outside a `Field` throws an error.

## Choose an editing type

| Built-in key / export | Editing value | Empty value |
| --- | --- | --- |
| `input` / `InputControl` | `string` | `""` |
| `number` / `NumberControl` | `number` | `NaN`, which Zod rejects |
| `checkbox` / `CheckboxControl` | `boolean` | `false` |

The built-in text input supports `text`, `email`, `password`, `search`, `tel`, and `url` types. All built-in control props exclude properties managed by the binding.

For a number editor that must retain intermediate text, such as a trailing decimal point, use a string editing value and parse it in the schema. Submission output can differ from editing values; see [fields and sections](fields-and-sections.md#keep-editing-values-separate-from-submission-output).

## Style the control and its wrapper

Formulate has no stylesheet or CSS-framework dependency. Style your components normally. In a declared field, wrapper and control classes have separate targets:

```tsx
// Inside Contact.Form, in place of Contact.Fields:
<Contact.Field name="email"
  className="contact-email"
  componentProps={{ className: "email-input" }} />
```

`className` and `style` on `Field` target the whole label/control/error wrapper. `componentProps.className` targets the mapped control. For connected children, pass `className` directly to the child. Render-time control props shallowly override declaration defaults; your local UI component owns any merging with its own base classes.

`Form`, `Section`, and `Page` accept wrapper classes too. Layout components arrange sibling fields; `Field.orientation` describes the arrangement of one field's label and control. Supply the corresponding CSS or a presentation component that implements that arrangement.

Default markup exposes `data-formulate` values `form`, `field`, `label`, `description`, `error`, `submission-error`, `section`, and `page`. Fields also expose `data-invalid` and `data-orientation`; pages expose `data-page`. Error messages use `role="alert"`. Standalone Page headings default to `h2` and Section headings to `h3`; nested headings and explicit levels are described below.

When using Tailwind, keep classes discoverable in application source. Classes supplied by an external package may need explicit source registration; the Formulate core contains no Tailwind utility strings. The [example scaffold](../../../examples/react/src/lib/formulate-config.ts) uses locally owned shadcn components and their class-merging helper. See [registry development](../../../docs/registry-development.md) to install that source into an application.

## Replace field markup

Pass a stable component as `createFormulate({ components, fieldPresentation })` to replace the default field wrapper, label, description, and error markup. A particular field can override it with `presentation={YourFieldPresentation}`. Both use the exported `FieldPresentationProps` type.

That component receives `controlId`, `label`, `description` and `descriptionId`, `error` and `errorId`, `invalid`, `orientation`, children, and wrapper props. Render the label with `id={controlId + "-label"}` and `htmlFor={controlId}`, retain the supplied description/error IDs, render the connected children, and give error text `role="alert"`. The runtime still owns the control binding and its accessible associations.

The [example field presentation](../../../examples/react/src/components/formulate/field-presentation.tsx) demonstrates this with shadcn's Field components. Keep presentation components at module scope so edits do not remount controls.

## Structured values and compound pickers

An object, array, or nullable value can be one declared field. Keep its complete editing shape in the schema and `defaultValue`, and declare that shape with `defineFieldControl<Value>()`. Send complete replacement values through `onChange`; do not mutate the object/array. Prefer explicit empty values (`null`, `[]`, or an object with nullable members) over an undefined RHF value. A partial editor state can fail validation without being discarded. Schema transforms produce submission output without replacing editing values.

A structured field registers its **root editor path**. Issues below that path are invalid for the whole editor; the first nested message in resolver order appears in its field error. Scope/correction paths should target that registered root (for example `dates`), rather than an unregistered member (`dates.from`). One Field still has one primary RHF focus target. This does not create separate controllers for every object member.

Use `useCompoundFieldBinding<Value>()` for a trigger and popup editing one value:

```tsx
const field = useCompoundFieldBinding<{ from: Date | null; to: Date | null }>();
// The local adapter maps field.value/onChange to its Calendar or other editor.
return <Popover open={field.open} onOpenChange={field.onOpenChange}>
  <PopoverTrigger asChild>
    <Button type="button" {...field.triggerProps}>Choose dates</Button>
  </PopoverTrigger>
  <LocalContent container={field.portalContainer} {...field.contentProps}>
    {/* Connected picker and type="button" actions. */}
  </LocalContent>
</Popover>;
```

The trigger props carry the label target, RHF ref, disabled state, validation state and help/error descriptions. The content props carry the label association and logical blur boundary. Keep both sets intact. Closing a popup marks the field touched and invokes blur validation; opening or moving focus among its parts does not. Leaving an unopened trigger also invokes blur. The UI primitive owns popup roles, expanded/controls attributes, keyboard navigation, initial focus, Escape dismissal, outside dismissal, and focus restoration. Buttons within a popup must not accidentally submit the form. Individual interactive parts still need their own accessible names and disabled state. The example triggers combine the field label and visible value text with `aria-labelledby`, so the current selection is announced on focus.

The hook closes retained pickers as Activity disconnects their effects. It immediately hides/inerts a lingering portal surface and prevents focus restoration to an inactive or disabled trigger. Editing state remains in RHF. Do not force-mount a separate popup outside this lifecycle or discard the returned ref/close-focus handler.

The optional `@formulate/pickers` registry item installs [date-range and multi-select adapters](../../../examples/react/src/components/formulate/picker-controls.tsx), using the application's shadcn Calendar, Popover, Button, Checkbox and Label. It does not copy those UI components into Formulate's package or registry files. Add `DateRangeControl` / `MultiSelectControl` to the map passed to `createFormulate`; they are optional so forms using basic controls need not load a calendar. Their props expose `className` for the trigger, `contentClassName` for popup styling, and `placeholder`; the multi-select also requires `options`. The [example declaration](../../../examples/react/src/declarations/structured-editing.ts) shows nullable dates, array membership rules and date-only output.

### Portal destinations and themes

`FormulatePortalProvider` supplies a destination to supporting adapters via `useFormulatePortalContainer` (also returned by the compound hook). Put the destination **inside** the appropriate theme root and, for a modal form, its focus boundary:

```tsx
const [container, setContainer] = useState<HTMLDivElement | null>(null);
return <div className="dark">
  <FormulatePortalProvider container={container}>
    <YourForm />
    <div ref={setContainer} />
  </FormulatePortalProvider>
</div>;
```

Without a provider the picker uses shadcn's default document portal. A provided `null` means the target is mounting, so the adapter waits instead of briefly rendering outside the theme/modal. React context crosses portals, CSS inheritance follows the destination DOM, and HTML fieldset disabling does not cross a portal. Use RHF's form `disabled` option when disabling these portalled editors; the compound binding closes an open popup and disables its trigger.

The installed shadcn PopoverContent currently owns its Portal internally. The source-installed `PickerContent` shim delegates to it by default and uses Radix's Portal/Content with the same semantic theme tokens for an explicit container. No patch to the consumer's installed components is required. This shim targets the current Radix shadcn style; another backend needs its corresponding portal adapter. The existing Select adapter does not consume this provider.

### Styling slots and heading levels

`Field.classNames` targets `label`, `content`, `description`, and `error`. Both the plain presentation and supplied shadcn presentation honour these slots. Custom presentations should consume these class names and preserve the label ID `${controlId}-label`, `htmlFor`, description/error IDs, and alert semantics. Per-use `classNames` replaces the declared slot map; control props remain separate.

`Form`, `Page`, and `Section` accept `bodyClassName`, which adds a wrapper around their configured layout. Without it the existing layout markup is unchanged. `Page` and `Section` accept `classNames.heading`; Section also accepts `classNames.description`. These props pass through declared and bound section shells and into custom section presentations. A custom child composition still replaces the shell, as before.

`headingLevel` accepts 1–6. A standalone Page defaults to h2 and a standalone Section to h3; nested Page/Section headings increment their nearest container's level, capped at h6. An explicit level overrides that convention and establishes the level for descendants. Layout wrappers do not change it. Every container retains `aria-labelledby` pointing to its actual heading. Custom presentations using their own markup remain responsible for that hierarchy.

The examples use one `globals.css`: Tailwind and animation imports, `@theme inline` mappings, semantic CSS variables on `:root`/`.dark`, and base/scaffold layers. Form spacing and typography use Tailwind's default scales. Use the same CSS variables and Tailwind convention for the source-installed shadcn bindings; the core has no CSS or UI dependency. See shadcn's [Calendar](https://ui.shadcn.com/docs/components/radix/calendar) and [Popover](https://ui.shadcn.com/docs/components/radix/popover) for the underlying UI components.
