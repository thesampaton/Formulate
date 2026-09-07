# @formulate/react

Experimental React 19 primitives. Private workspace package; `pnpm build` emits ESM and TypeScript declarations into `dist`. The package exports a client boundary and does not depend on Next.js or any CSS framework.

```tsx
import { defineForm, Form } from "@formulate/react";
import { z } from "zod";

const Contact = defineForm({
  email: {
    schema: z.email(),
    defaultValue: "",
    label: "Email",
    component: "input",
    componentProps: { type: "email" },
  },
});

export function ContactForm() {
  const form = Contact.useForm();
  return (
    <Form form={form} onSubmit={(values) => console.info(values.email)}>
      <Contact.Fields />
      <button type="submit" disabled={form.formState.isSubmitting}>Send</button>
    </Form>
  );
}
```

Each field key is declared once. `defineForm` builds the Zod object schema and RHF editing defaults from the declarations. `Fields` renders them in declaration order, with no wrapper or second binding list. The form-boundary schema validates all declared fields, including fields whose editors have never mounted.

For a custom layout, use `<Contact.Field name="email" />`. Its label, component, and control props come from the declaration; its RHF connection comes from the enclosing Form. Both components are created once when `defineForm` runs. Define forms at module scope and treat their configuration as immutable. Reusing a definition in multiple Form instances creates independent values and control IDs.

## Context and explicit control

`control` is RHF's runtime connection, not a choice of UI component. It defaults to the enclosing Form's context. This works for the ordinary Field too:

```tsx
<Field name="email" label="Email" component="input"
  componentProps={{ type: "email" }} />
```

React context does not carry parent generic types into JSX children. Plain Field without `control` still checks catalogue keys and component props, but cannot check a name against the parent form's value shape. `Contact.Field` retains those checks through its definition. Plain Field with explicit `control` also retains the previous inferred name/value checking.

Use `control={form.control}` for a standalone field, or to explicitly select another runtime. That override changes where the field reads and writes; it does not change which runtime an enclosing Form submits. Without either a Form context or explicit control, Field throws an actionable error. Definition fields should be used with the matching definition's runtime.

## Current API

| Export | Responsibility |
| --- | --- |
| `useFormulate(schemaOrDefinition, options?)` | Typed RHF runtime with a Zod resolver, `onBlur` validation by default, and `shouldUnregister: false`. Definitions supply editing defaults. The schema-first path still accepts RHF options, including explicit defaults. |
| `defineForm(fields)` | Derives `.schema`, `.defaultValues`, `.useForm(options?)`, typed `.Field`, and ordered `.Fields` from field declarations. Each declaration supplies its schema, editing default, label, and mapped control or connected children. |
| `Form` | Accepts `form`, `onSubmit`, and optional `onInvalid`; provides RHF context and a native form. Validates before calling the handler, blocks overlapping attempts, and shows a generic retryable error if the handler throws. `submissionErrorMessage` overrides that message. Standard form attributes are supported. |
| `Field` | Accepts optional `control`, `name`, `label`, optional `description`, and either `component`/`componentProps` or connected children. Connects value, change, blur, ref, label, description, and errors. `className`/`style` apply to the outer field. Optional `id` overrides the control ID. |
| `createFormulate({ components })` | Returns Field and defineForm configured with an application-owned component map. Call once at module scope. Keys, component props, and editing value compatibility are checked by TypeScript. Configuration contains UI, not values or validation rules. |
| `InputControl`, `NumberControl`, `CheckboxControl` | Connected native controls for string, number, and boolean editing values. The default Field maps them to `input`, `number`, and `checkbox`. Usable as children too. |
| `defineFieldControl<Value>()`, `useFieldControl<Value>()` | Adapter-author tools: declare the accepted editing type and read the enclosing Field's binding. No second controller registration. |
| `Section` | Named semantic group with `title`, optional `description`, children, and section attributes. Can nest; adds no value object. Group requirements/completion are not implemented. |
| `Page` | Named presentation with logical `id`, `title`, and `active` (default `true`). Inactive children unmount. Adds no form, route, navigation policy, or completion state. |

`Contact.useForm()` is a typed convenience for `useFormulate(Contact)` and creates an independent runtime on each mounted use. Both return RHF's API, so ordinary `useWatch`, `setValue`, `setError`, and `getValues` remain available. Call the hook at the top level of a React component or custom hook. Rules belong to the form schema; putting them only on mounted controls cannot validate an unmounted page. Parsed submission output can differ from editing values; parsing does not overwrite those values. `isSubmitSuccessful` describes an RHF action attempt, not domain completion or acknowledged persistence.

## Definition customization and current limits

`Contact.Field` accepts normal wrapper props, label/description overrides, and partial `componentProps` for its declared control. Control props shallowly override declaration defaults: setting `className` replaces that declaration's class string; the local control still merges it with its own base classes. Supplying connected children replaces the declared presentation and its control props, while preserving the schema and editing value. Do not combine child composition with `componentProps`.

```tsx
<Contact.Field name="email" className="sm:col-span-2"
  componentProps={{ className: "h-11 rounded-lg" }} />

<Contact.Field name="email">
  <InputControl type="email" className="h-11 rounded-lg" />
</Contact.Field>
```

These are alternative presentations. The definition helper currently accepts flat identifier keys. Use the existing schema-first API for nested RHF paths, cross-field rules, and other compositions not covered by this helper. Generated `.schema` and `.defaultValues` remain available for inspection. This is not JSON Schema auto-rendering or the full Part 4 definition/reference model.

Defaults describe editing values, before parsing. A schema that accepts strings and produces numbers needs a string default and a string-capable control. The built-in input does not accept `undefined`; use an empty string editing contract or an adapter that explicitly supports absence. Defaults are checked for TypeScript compatibility at authoring time and validated by the resolver at runtime; an incomplete form may intentionally start invalid.

Static prefills override only the supplied fields, preserving the other declared defaults:

```tsx
const form = Contact.useForm({
  defaultValues: { email: "person@example.com" },
});
```

This is a shallow merge by field: a supplied structured object or array replaces that field's value as a whole. Explicit empty strings, false, zero, null, and undefined are overrides, not requests to fall back. The merged values establish the initial/reset baseline, without mutating the definition. They are not reapplied on rerender or editor remount; use RHF's `reset` or reactive `values` option for intentional later updates. This same merge applies to `useFormulate(Contact, options)`. Schema-first defaults and async default-value loaders retain RHF's replacement semantics; async loaders should return the complete desired record and editors should wait until loading finishes.

The [example SubmitButton](../../examples/react/src/submit-button.tsx) reads submission state from context, sets `type="submit"`, disables itself while pending, and accepts a `pendingLabel`. It is shared application UI, not a new package primitive. Native buttons and local shadcn buttons remain supported.

## Configure once, select by name

The [example scaffold](../../examples/react/src/formulate.ts) exports configured Field and defineForm helpers. There is no provider to configure for every form and no switch statement to extend.

```tsx
import { createFormulate, defaultComponents } from "@formulate/react";
import { LocalInputControl } from "./local-input-control";

export const { Field, defineForm } = createFormulate({
  components: { ...defaultComponents, input: LocalInputControl },
});
```

Then use `component="input"` and `componentProps={{ ... }}` at each field. Map entries are connected React controls; they are not shadcn installation addresses or a form schema. Replacing an entry replaces that control's defaults and supported props. There is no implicit deep merge. Use `defaultComponents` explicitly when extending the built-in map.

## Compose when needed

```tsx
<Field name="email" label="Email">
  <div className="input-row">
    <InputControl type="email" autoComplete="email" />
  </div>
</Field>
```

Children use the same context binding as mapped controls. Layout wrappers work normally. Supply one connected editor per Field; a compound adapter should place the label ID and focus ref on its primary control. Field does not clone elements or automatically bind a raw `<input>` child. A connected child deliberately chooses its UI and is unaffected by a map override.

## Adapt local UI once

A local shadcn Input can be connected like this:

```tsx
import { defineFieldControl, useFieldControl } from "@formulate/react";
import type { InputControlProps } from "@formulate/react";
import { Input } from "./ui/input";

export const LocalInputControl = defineFieldControl<string>()(
  function LocalInputControl(props: InputControlProps) {
    const field = useFieldControl<string>();
    return (
      <Input {...props} {...field}
        onChange={(event) => field.onChange(event.target.value)} />
    );
  },
);
```

`defineFieldControl` declares the adapter's editing contract for map type checking; it does not wrap the component or create state. `useFieldControl` supplies name, value, value-based `onChange`, `onBlur`, focus ref, ID, disabled state, and accessible attributes. Adapter authors must honour the declared contract. A checkbox maps to `checked` and boolean changes; a picker may map to `onValueChange` and a trigger ref. No per-field render callback is needed.

Definitions and fields with an explicit typed control reject mismatched editing value types. All mapped fields check unknown keys, unsupported props, and missing required props at compile time. TypeScript cannot infer a wrapped child's value contract through arbitrary JSX; that composition path is the adapter author's responsibility. Built-in controls report incompatible runtime values, and controls used outside a Field throw an actionable error. This is not validation of a remotely supplied UI schema.

Built-in number controls convert empty text to `NaN`, which Zod rejects. An input needing richer intermediate text should keep a string editing contract and parse explicitly. Built-in control props cannot override the managed binding, change/blur handlers, or accessible associations. Put interaction customizations inside a local adapter. No shadcn registry installer or compound-control adapter ships yet.

## Styling and focus

The example scaffold uses Tailwind CSS 4 through the Vite plugin. Its [local controls](../../examples/react/src/controls.tsx) apply utility defaults and use `tailwind-merge` so caller classes override conflicting defaults. The Formulate runtime has no Tailwind dependency; a local shadcn component can use its own class-merging helper at the same boundary.

```tsx
<Field
  name="email"
  label="Email"
  component="input"
  className="sm:col-span-2"
  componentProps={{ type: "email", className: "h-11 rounded-lg" }}
/>

<Field name="email" label="Email">
  <InputControl type="email" className="h-11 rounded-lg" />
</Field>
```

These are alternative presentations. `className` on Field targets the whole label/control/error wrapper. `componentProps.className` targets the mapped control; a wrapped control receives `className` directly. Form, Section, and Page also accept standard wrapper classes. Styling never overrides the managed binding or accessibility attributes. Native inline `style` remains available for values that genuinely need to be calculated.

The example's theme defines semantic tokens such as `border-input`, `bg-background`, `text-foreground`, and `outline-ring`. Existing scaffold CSS sits in `@layer base` and `@layer components`, below Tailwind utilities. Keep class names statically discoverable in application source; adding classes from an external package or remote configuration may require explicit Tailwind source registration. The core package contains no utility strings to scan.

There is no package stylesheet. Style the wrappers with normal props and the `data-formulate` markers (`form`, `field`, `label`, `description`, `error`, `submission-error`, `section`, `page`). Fields expose `data-invalid`; pages expose `data-page`. Error UI uses `role="alert"`. Defaults currently use h2 for Page and h3 for Section; richer heading/slot customization remains open.

Hidden fields stay applicable. Hosts must reveal/navigate before requesting focus in `onInvalid`; see [advanced options](../../examples/react/src/advanced-options.tsx). The default simple form uses RHF's normal error focus. Keep one form runtime mounted while changing pages.

See the [implementation anchor](../../docs/05-06-rendering-and-workflow.md) for intentional limits and the next iterations.
