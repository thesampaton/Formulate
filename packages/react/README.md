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
| `Form` | Accepts `form`, final `onSubmit`, optional `onInvalid`, and optional `navigation: { id, fields, onValid }`. Provides RHF/action context and a native form. Checks the navigation scope or validates/parses the whole final submission, blocks overlapping attempts, and shows generic retryable feedback for a thrown check/handler. `submissionErrorMessage` overrides that message. |
| `useFormNavigation({ form, initialPage, destinations })` | Returns `page`, `revision`, `goTo`, `goToField`, and `correct`. Destinations map editor paths to pages and optional synchronous reveal callbacks. Focus follows the committed render; the host defines scopes and allowed actions. |
| `useFormActionStatus()` | Reads `{ isPending }` from the enclosing Form, covering scoped checks and final submission through the awaited callback. Use for pending labels and disabled action UI. |
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

### Reuse and form-level rules

Extract a declaration as ordinary configuration. Preserve the component literal with `as const`, and check extracted control props with `satisfies InputControlProps` (or your adapter's props type). See the [shared Email](../../examples/react/src/email.ts), reused in sign-in and confirmation. Spread overrides into a new declaration; each use's key supplies its own binding and values.

Cross-field rules can refine the generated schema at module scope:

```tsx
const Confirmation = defineForm({
  email: Email,
  confirmEmail: { ...Email, label: "Confirm email" },
});
const confirmationBoundary = {
  schema: Confirmation.schema.refine(
    (values) => values.email === values.confirmEmail,
    { path: ["confirmEmail"], message: "Email addresses must match." },
  ),
  defaultValues: Confirmation.defaultValues,
};
// In a React component:
const form = useFormulate(confirmationBoundary);
// Inside <Form form={form} ...>: <Confirmation.Fields />
```

The refined schema validates at the form boundary, even without mounted editors. This does **not** modify `Confirmation` or its bound `useForm()` hook: select `confirmationBoundary` explicitly to include the relationship. This example preserves the schema's input/output shape; it does not establish a contract for shape-changing form transforms with bound Fields. Submission checks the relationship again after either value changes; eager sibling-error updates would need explicit coordination.

For nested bindings, compose a Zod object and use schema-first defaults plus typed `Field control={form.control} name="contact.email"`. The [comparison example](../../examples/react/src/email-confirmation.tsx) demonstrates exact nested payloads and error paths. Sections add no paths, and neither variant introduces another value store. A bound schema-customization API and reusable binding scopes remain open.

Defaults describe editing values, before parsing. A schema that accepts strings and produces numbers needs a string default and a string-capable control. The built-in input does not accept `undefined`; use an empty string editing contract or an adapter that explicitly supports absence. Defaults are checked for TypeScript compatibility at authoring time and validated by the resolver at runtime; an incomplete form may intentionally start invalid.

Static prefills override only the supplied fields, preserving the other declared defaults:

```tsx
const form = Contact.useForm({
  defaultValues: { email: "person@example.com" },
});
```

This is a shallow merge by field: a supplied structured object or array replaces that field's value as a whole. Explicit empty strings, false, zero, null, and undefined are overrides, not requests to fall back. The merged values establish the initial/reset baseline, without mutating the definition. They are not reapplied on rerender or editor remount; use RHF's `reset` or reactive `values` option for intentional later updates. This same merge applies to `useFormulate(Contact, options)`. Schema-first defaults and async default-value loaders retain RHF's replacement semantics; async loaders should return the complete desired record and editors should wait until loading finishes.

The [example SubmitButton](../../examples/react/src/submit-button.tsx) reads `useFormActionStatus()` from context, sets `type="submit"`, disables itself while checking or submitting, and accepts a `pendingLabel`. It is shared application UI, not a new package primitive. Native buttons and local shadcn buttons remain supported. RHF's `isSubmitting` does not cover scoped navigation through `trigger`; `isSubmitSuccessful` and submission counts are not navigation/completion indicators.

## Scoped navigation and correction

Keep one form runtime mounted. Disable RHF's automatic error focus when the host coordinates reveal and page changes. For example, using the advanced example's definition:

```tsx
const form = RequestSettings.useForm({ shouldFocusError: false });
const navigation = useFormNavigation<Settings, "settings" | "destination" | "review">({
  form,
  initialPage: "settings",
  destinations: [
    { name: "retries", page: "settings", reveal: () => form.setValue("showAdvanced", true) },
    { name: "timeoutSeconds", page: "settings", reveal: () => form.setValue("showAdvanced", true) },
    { name: "showAdvanced", page: "settings" },
    { name: "endpoint", page: "destination" },
  ],
});

<Form form={form}
  navigation={navigation.page === "review" ? undefined : {
    id: navigation.revision,
    fields: navigation.page === "settings"
      ? ["showAdvanced", "retries", "timeoutSeconds"]
      : ["endpoint"],
    onValid: () => {
      if (navigation.page === "settings") navigation.goToField("endpoint");
      else navigation.goTo("review");
    },
  }}
  onInvalid={(errors) => {
    if (!navigation.correct(errors)) {
      form.setError("root.submit", { message: "Review the form errors before continuing." });
    }
  }}
  onSubmit={saveConfiguration}
>
  {/* Page.active follows navigation.page; use a native submit button for Next and Save. */}
</Form>
```

The [complete example](../../examples/react/src/advanced-options.tsx) includes all pages, mapped review edit links, and focus on the review summary. `goTo(page, focus?)` permits an optional post-commit focus callback, such as focusing a heading ref. `goToField(name)` reveals and focuses a mapped editor without validating, so the host can use it for Back or edit links. Both return behavior and available page names are typed. `initialPage` only initializes the hook; later location changes use its methods.

Destinations are in correction priority order and use explicit RHF editor paths, including nested paths. They are separate from validation scope. `correct(errors)` returns false when no destination matches, allowing form-level fallback feedback; `goToField` likewise returns false for an unmapped path. This slice maps an error and its editor to the same path. Separate group-error targets, unavailable-page fallback, portals, and async/suspended revelation remain open. The reveal callback must arrange for the control to mount in the same committed update; there is no polling or async readiness protocol.

`Form.navigation.fields` gates **error paths**, not an independently executed schema. RHF's resolver still runs against the full form. An object path includes descendant errors; use an explicit correction handler for object scopes or unmounted editors. Only errors within the requested scope are sent to navigation's `onInvalid`. An empty scope permits navigation immediately without a validation run. Cross-field rules follow the schema's execution semantics; assign their error path to a scope when they should gate that action. A form-level rule outside the scope still runs at final submission. For Zod form-level feedback, leave the issue path empty; RHF reserves `root` for application errors and clears that namespace during submission.

Navigation's `onValid` receives **no payload**: passing one scope does not establish a valid full parsed result. Omitting `navigation` restores full validation and parsed `onSubmit` output. Rendering Review never submits automatically or marks the form complete.

Form suppresses validation callbacks after a value change/reset, a changed navigation ID/scope, a different runtime, or unmounting. `navigation.revision` changes even when returning to the same page; using it as the action ID prevents an old check from moving that new visit. If external policy changes the meaning of an action without changing its fields, change its ID as well. Use `shouldFocusError: false` with the correction helper to avoid independent RHF focus after obsolete validation.

This is cancellation of navigation/correction callbacks, **not** cancellation of the resolver or an already-started application callback. A resolver can still finish and update RHF errors. Form prevents overlapping attempts and releases pending UI when the operation settles; it does not clear newer errors or restore an old snapshot. Validators, remote requests, and async callbacks still need application-owned cancellation/reconciliation if required. Rules, values, and validation errors remain in RHF/Zod, and the helper exposes no page completion or workflow graph.

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

Hidden fields stay applicable. The correction hook can reveal/navigate before focusing in `onInvalid`; see [advanced options](../../examples/react/src/advanced-options.tsx). The default simple form uses RHF's normal error focus. Keep one form runtime mounted while changing pages.

See the [implementation anchor](../../docs/05-06-rendering-and-workflow.md) for intentional limits and the next iterations.
