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

export const { Field, defineForm, defineSection } = createFormulate({
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

Default markup exposes `data-formulate` values `form`, `field`, `label`, `description`, `error`, `submission-error`, `section`, and `page`. Fields also expose `data-invalid` and `data-orientation`; pages expose `data-page`. Error messages use `role="alert"`. Page headings use `h2`, and Section headings use `h3`.

When using Tailwind, keep classes discoverable in application source. Classes supplied by an external package may need explicit source registration; the Formulate core contains no Tailwind utility strings. The [example scaffold](../../../examples/react/src/lib/formulate-config.ts) uses locally owned shadcn components and their class-merging helper. See [registry development](../../../docs/registry-development.md) to install that source into an application.

## Replace field markup

Pass a stable component as `createFormulate({ components, fieldPresentation })` to replace the default field wrapper, label, description, and error markup. A particular field can override it with `presentation={YourFieldPresentation}`. Both use the exported `FieldPresentationProps` type.

That component receives `controlId`, `label`, `description` and `descriptionId`, `error` and `errorId`, `invalid`, `orientation`, children, and wrapper props. Render the label with `htmlFor={controlId}`, retain the supplied description/error IDs, render the connected children, and give error text `role="alert"`. The runtime still owns the control binding and its accessible associations.

The [example field presentation](../../../examples/react/src/components/formulate/field-presentation.tsx) demonstrates this with shadcn's Field components. Keep presentation components at module scope so edits do not remount controls.
