# String patterns

String patterns are ordinary Zod validation, independent of how a field is edited. Reuse a schema in an input, a reusable field definition, or a composed input. Formulate validates the field's complete canonical string through the same form resolver, including on submission when its editor is unmounted.

```ts
import { z } from "zod";
import { defineField, defineForm, field } from "@formulate/react";

const slugSchema = z.string().regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Use lowercase letters or digits separated by single hyphens.",
);
const Slug = defineField({
  primitive: "text",
  schema: slugSchema.max(40, "Use at most forty characters."),
  defaultValue: "",
  label: "Slug",
  component: "input",
});
const Article = defineForm({ slug: field(Slug) });
```

The empty default is a valid editing representation but fails this required slug format until the user enters a value. Presence, length, and format remain explicit schema choices. For an optional empty string, use `z.union([z.literal(""), slugSchema])` rather than `.optional()`, which accepts `undefined`.

## Patterns supplied as strings

Use JavaScript's `RegExp` constructor when the pattern is stored as a string. Compile it once with the declaration, and pass flags explicitly:

```ts
const source = String.raw`^CUS-[A-Z]{2}-\d{4}$`;
const customerReferenceSchema = z.string().regex(
  new RegExp(source),
  "Use a reference such as CUS-AU-0042.",
);

const skuSchema = z.string().regex(
  new RegExp("^SKU-[a-z0-9]{4,12}$", "i"),
  "Use SKU- followed by four to twelve letters or digits.",
);
```

`String.raw` preserves the backslash in `\d`; an ordinary quoted JavaScript string needs `"\\d"`. A source string contains the pattern itself, without `/.../` delimiters or appended flags. Malformed regex source or flags throw when `new RegExp(...)` runs, so applications that accept configurable patterns should handle that configuration error before rendering the form.

Matching follows the supplied JavaScript regex: use `^` and `$` for whole-string formats; an unanchored pattern can match a substring. The `i` flag ignores letter case during matching and preserves the actual value. The `m` flag changes anchors to match line boundaries, so omit it when requiring a single whole-string match. Validation does not need scanning flags such as `g` or `y`.

## Validate a composed scalar

With the local `composedInput` control registered, attach the same schema to the field declaration:

```ts
// defineForm comes from your local createFormulate control map.
const Customer = defineForm({
  region: { schema: z.string(), defaultValue: "AU", component: "input" },
  reference: {
    schema: customerReferenceSchema,
    defaultValue: "CUS-AU-",
    label: "Customer reference",
    component: "composedInput",
    composition: {
      segments: [
        { literal: "CUS-" },
        { binding: "region" },
        { literal: "-" },
        { input: true },
      ],
    },
  },
});
```

The editable text `0042` produces `CUS-AU-0042`; validation sees that entire value. A changed region also affects the same schema check. The rule belongs on `schema`, rather than an HTML `pattern` on the editable segment: a segment input contains only `0042`. Formulate forms use `noValidate`, so browser constraint attributes do not replace the Zod rule.

Patterns accept or reject a value. They do not mask keystrokes, remove characters, select a control, create segments, or silently normalise input. Composition's bound-value transformations remain a separate operation. A deliberate Zod `.transform(...)` changes parsed submission output using the existing schema contract; it does not rewrite the text held in form state.

The [reusable example schemas](../../../examples/react/src/declarations/string-patterns.ts) show slug, customer-reference, and SKU policies. They are application-owned examples rather than built-in domain restrictions.
