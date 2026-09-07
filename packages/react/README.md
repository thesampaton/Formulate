# @formulate/react

Experimental React 19 primitives. Private workspace package; `pnpm build` emits ESM and TypeScript declarations into `dist`. The package exports a client boundary and does not depend on Next.js or any CSS framework.

```tsx
import { Field, Form, useFormulate } from "@formulate/react";
import { z } from "zod";

const schema = z.object({ email: z.email() });

export function ContactForm() {
  const form = useFormulate(schema, { defaultValues: { email: "" } });
  return (
    <Form form={form} onSubmit={(values) => console.info(values.email)}>
      <Field
        control={form.control}
        name="email"
        label="Email"
        component="input"
        componentProps={{ type: "email" }}
      />
      <button type="submit" disabled={form.formState.isSubmitting}>Send</button>
    </Form>
  );
}
```

## Current API

| Export | Responsibility |
| --- | --- |
| `useFormulate(schema, options)` | Typed RHF runtime with a Zod resolver, `onBlur` validation by default, and `shouldUnregister: false`. Options otherwise follow RHF. Supply editing defaults for every field, including initially hidden ones. |
| `Form` | Accepts `form`, `onSubmit`, and optional `onInvalid`; provides RHF context and a native form. Validates before calling the handler, blocks overlapping attempts, and shows a generic retryable error if the handler throws. `submissionErrorMessage` overrides that message. Standard form attributes are supported. |
| `Field` | Accepts typed `control`, `name`, `label`, optional `description`, and either `component`/`componentProps` or connected children. Connects value, change, blur, ref, label, description, and errors. `className`/`style` apply to the outer field. Optional `id` overrides the control ID. |
| `createFormulate({ components })` | Returns a Field configured with an application-owned component map. Call once at module scope. Keys, component props, and editing value compatibility are checked by TypeScript. Configuration contains UI, not values or validation rules. |
| `InputControl`, `NumberControl`, `CheckboxControl` | Connected native controls for string, number, and boolean editing values. The default Field maps them to `input`, `number`, and `checkbox`. Usable as children too. |
| `defineFieldControl<Value>()`, `useFieldControl<Value>()` | Adapter-author tools: declare the accepted editing type and read the enclosing Field's binding. No second controller registration. |
| `Section` | Named semantic group with `title`, optional `description`, children, and section attributes. Can nest; adds no value object. Group requirements/completion are not implemented. |
| `Page` | Named presentation with logical `id`, `title`, and `active` (default `true`). Inactive children unmount. Adds no form, route, navigation policy, or completion state. |

`useFormulate` returns RHF's API, so ordinary `useWatch`, `setValue`, `setError`, and `getValues` remain available. Rules belong to the form schema; putting them only on mounted controls cannot validate an unmounted page. Parsed submission output can differ from editing values; parsing does not overwrite those values. `isSubmitSuccessful` describes an RHF action attempt, not domain completion or acknowledged persistence.

## Configure once, select by name

The [example scaffold](../../examples/react/src/formulate.ts) exports one configured Field. There is no provider to configure for every form and no switch statement to extend.

```tsx
import { createFormulate, defaultComponents } from "@formulate/react";
import { LocalInputControl } from "./local-input-control";

export const { Field } = createFormulate({
  components: { ...defaultComponents, input: LocalInputControl },
});
```

Then use `component="input"` and `componentProps={{ ... }}` at each field. Map entries are connected React controls; they are not shadcn installation addresses or a form schema. Replacing an entry replaces that control's defaults and supported props. There is no implicit deep merge. Use `defaultComponents` explicitly when extending the built-in map.

## Compose when needed

```tsx
<Field control={form.control} name="email" label="Email">
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

Mapped controls reject mismatched field value types, unknown keys, unsupported props, and missing required props at compile time. TypeScript cannot infer a wrapped child's value contract through arbitrary JSX; that composition path is the adapter author's responsibility. Built-in controls report incompatible runtime values, and controls used outside a Field throw an actionable error. This is not validation of a remotely supplied UI schema.

Built-in number controls convert empty text to `NaN`, which Zod rejects. An input needing richer intermediate text should keep a string editing contract and parse explicitly. Built-in control props cannot override the managed binding, change/blur handlers, or accessible associations. Put interaction customizations inside a local adapter. No shadcn registry installer or compound-control adapter ships yet.

## Styling and focus

The example scaffold uses Tailwind CSS 4 through the Vite plugin. Its [local controls](../../examples/react/src/controls.tsx) apply utility defaults and use `tailwind-merge` so caller classes override conflicting defaults. The Formulate runtime has no Tailwind dependency; a local shadcn component can use its own class-merging helper at the same boundary.

```tsx
<Field
  control={form.control}
  name="email"
  label="Email"
  component="input"
  className="sm:col-span-2"
  componentProps={{ type: "email", className: "h-11 rounded-lg" }}
/>

<Field control={form.control} name="email" label="Email">
  <InputControl type="email" className="h-11 rounded-lg" />
</Field>
```

These are alternative presentations. `className` on Field targets the whole label/control/error wrapper. `componentProps.className` targets the mapped control; a wrapped control receives `className` directly. Form, Section, and Page also accept standard wrapper classes. Styling never overrides the managed binding or accessibility attributes. Native inline `style` remains available for values that genuinely need to be calculated.

The example's theme defines semantic tokens such as `border-input`, `bg-background`, `text-foreground`, and `outline-ring`. Existing scaffold CSS sits in `@layer base` and `@layer components`, below Tailwind utilities. Keep class names statically discoverable in application source; adding classes from an external package or remote configuration may require explicit Tailwind source registration. The core package contains no utility strings to scan.

There is no package stylesheet. Style the wrappers with normal props and the `data-formulate` markers (`form`, `field`, `label`, `description`, `error`, `submission-error`, `section`, `page`). Fields expose `data-invalid`; pages expose `data-page`. Error UI uses `role="alert"`. Defaults currently use h2 for Page and h3 for Section; richer heading/slot customization remains open.

Hidden fields stay applicable. Hosts must reveal/navigate before requesting focus in `onInvalid`; see [advanced options](../../examples/react/src/advanced-options.tsx). The default simple form uses RHF's normal error focus. Keep one form runtime mounted while changing pages.

See the [implementation anchor](../../docs/05-06-rendering-and-workflow.md) for intentional limits and the next iterations.
