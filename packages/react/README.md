# @formulate/react

Experimental React 19.2+ primitives (React 19.x). Private workspace package; `pnpm build` emits ESM and TypeScript declarations into `dist`. The package exports a client boundary and does not depend on Next.js or any CSS framework.

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

## Reusable layouts

`Form`, `Page` and `Section` accept `layout={SomeLayout}`, where `SomeLayout` is a stable React component accepting children. It arranges the body; page/section headings and descriptions, and form submission errors, remain outside it. The same component can be reused directly as a wrapper. Layouts add no form state or field paths.

```tsx
const Contact = defineForm({ name: Name, email: Email }, { layout: Stack });

function ContactForm() {
  const form = Contact.useForm();
  return <Contact.Form form={form} onSubmit={saveContact}>
    <Contact.Fields />
    <button type="submit">Save</button>
  </Contact.Form>;
}
```

`Definition.Form` uses the definition's default layout. Plain `Form` does not infer defaults from its runtime. `defineSection` also accepts a default layout; each Section/Bind use may replace it. Omission uses the default, and `layout={null}` removes it. Parent layouts do not implicitly propagate into child sections or pages. `Definition.Fields` still renders without a wrapper.

Custom section `presentation` components receive `{ title, layout }`. Forward the layout to `Section` or `<LayoutBody layout={layout}>`; explicit section children replace the full presentation and are wrapped in the selected layout. Define layout components at module scope to keep component identity stable during edits.

The [local Stack/Row](../../examples/react/src/components/formulate/layouts.tsx) and [Name group](../../examples/react/src/declarations/name.tsx) use shadcn FieldGroup and FieldSet. They can be installed through the [source registry](../../docs/registry-development.md). Row arranges sibling fields; a field's `orientation` arranges its own label and control. `createFormulate({ components, fieldPresentation })` lets local UI own field markup while the runtime supplies the binding and accessible IDs. Its optional per-field `presentation` override accepts the same `FieldPresentationProps` contract.

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
| `defineForm(members, options?)` | Derives schema, defaults, `useForm`, choice-aware `useChoiceForm`, Form, Field, Fields, Section, local watch/choice/trigger hooks, fieldPaths, bindSection, and bindChoices. A bound section use carries its renderer, validation root, ordered correction paths and focus helpers into workflow composition. |
| `defineSection(members, options?)` | The same recursive member model, with a default title and optional presentation component. Local helpers, including `useChoice(name)`, inherit the section use; Bind supports explicit typed member maps, and `bind({ id, bindings })` shares one mapped use with presentation and dependent behavior. No separate form runtime. |
| `defineChoice(config)` | Declares a typed local dependency input, request key, service selector, selection policy and feedback. Attach it as a field declaration’s `choices`. |
| `useChoiceForm({ schema, defaultValues, getChoiceBindings })` | Lower-level adapter for dynamic/repeated choice bindings. Returns the RHF form directly, augmented with `choices` and `getValidationRevision`, just like `Definition.useChoiceForm`. |
| `SectionPathMap<Members, Values>` | Maps local members to host paths with compatible reading and writing types. Inferred by Bind; usable with satisfies for extracted mappings. |
| `FormScope<Values>` | An `errorPaths` list of action-gating error paths plus optional ordered `focusPaths` editor paths. Bound section uses satisfy this contract; it does not execute a separate schema or imply completion. |
| `Form` | Accepts `form`, final `onSubmit`, optional `onInvalid`, and optional `scopedAction` with `id`, `onValid`, and either `errorPaths` or `scope`. Provides RHF/action/choice context and a native form. Checks the action scope or validates/parses the whole final submission, blocks overlapping attempts, and shows generic retryable feedback for a thrown check/handler. Choice-aware forms install their evidence revision automatically; `actionErrorMessage` overrides thrown-action feedback. |
| `useFormNavigation({ form, initialPage, destinations })` | Returns `page`, `revision`, `goToPage`, `goToField`, and `goToFirstError`. Each destination maps one editor path or an ordered scope to a host-owned page and optional synchronous reveal callback. Focus follows the committed render; the host defines allowed destinations and actions. |
| `useFormActionStatus()` | Reads `{ isPending }` from the enclosing Form, covering scoped checks and final submission through the awaited callback. Use for pending labels and disabled action UI. |
| `Field` | Accepts optional `control`, `name`, `label`, optional `description`, and either `component`/`componentProps` or connected children. Connects value, change, blur, ref, label, description, and errors. `className`/`style` apply to the outer field. Optional `id` overrides the control ID. |
| `createFormulate({ components, fieldPresentation? })` | Returns Field, defineForm, and defineSection configured with an application-owned component map. Call once at module scope. Keys, component props, and editing value compatibility are checked by TypeScript. Configuration contains UI, not values or validation rules. |
| `InputControl`, `NumberControl`, `CheckboxControl` | Connected native controls for string, number, and boolean editing values. The default Field maps them to `input`, `number`, and `checkbox`. Usable as children too. |
| `defineFieldControl<Value>()`, `useFieldBinding<Value>()` | Adapter-author tools: declare the accepted editing type and read the enclosing Field's binding. No second controller registration. |
| `Section` | Named semantic group with `title`, optional `description`, children, and section attributes. Can nest; adds no value object. Group requirements/completion are not implemented. |
| `Page` | Named presentation with logical `pageId` (rendered as `data-page`), `title`, and `active` (default `true`). Optional native `id` is a separate DOM identifier. Activity preserves inactive children’s React state and DOM while pausing their effects. Adds no form, route, navigation policy, or completion state. |

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

These are alternative presentations. Member keys are local identifiers; declare a section member to introduce a nested object binding. The schema-first API remains available for arbitrary RHF paths and other compositions. Generated `.schema` and `.defaultValues` remain available for inspection. This is not JSON Schema auto-rendering or the full Part 4 definition/reference model.

### Reuse and form-level rules

Extract a declaration as ordinary configuration. Preserve the component literal with `as const`, and check extracted control props with `satisfies InputControlProps` (or your adapter's props type). See the [shared Email](../../examples/react/src/declarations/email.ts), reused in sign-in and confirmation. Spread overrides into a new declaration; each use's key supplies its own binding and values.

Cross-field rules can customize the generated schema at module scope while retaining the bound hook:

```tsx
const Confirmation = defineForm({
  email: Email,
  confirmEmail: { ...Email, label: "Confirm email" },
}, {
  schema: (schema) => schema.refine(
    (values) => values.email === values.confirmEmail,
    { path: ["confirmEmail"], message: "Email addresses must match." },
  ),
});
const form = Confirmation.useForm();
```

The schema option must preserve the complete declared editing shape. It can refine or transform the accepted output; useForm and submission infer that output while Field and defaults keep their editing types. Requirements remain in the boundary schema when editors unmount. The [email-confirmation example](../../examples/react/src/email-confirmation.tsx) uses this schema option and its bound hook. External refinement still works via `useFormulate({ schema, defaultValues })`, but does not modify the original definition's hook.

For nested bindings, use section declarations below or compose a Zod object with schema-first defaults and typed `Field control={form.control} name="contact.email"`. A plain Section presentation wrapper adds no paths. Declaring a section member explicitly creates its object binding. Neither path introduces another value store.

Defaults describe editing values, before parsing. A schema that accepts strings and produces numbers needs a string default and a string-capable control. The built-in input does not accept `undefined`; use an empty string editing contract or an adapter that explicitly supports absence. Defaults are checked for TypeScript compatibility at authoring time and validated by the resolver at runtime; an incomplete form may intentionally start invalid.

Static prefills override only the supplied fields, preserving the other declared defaults:

```tsx
const form = Contact.useForm({
  defaultValues: { email: "person@example.com" },
});
```

This is a shallow merge by field: a supplied structured object or array replaces that field's value as a whole. Explicit empty strings, false, zero, null, and undefined are overrides, not requests to fall back. The merged values establish the initial/reset baseline, without mutating the definition. They are not reapplied on rerender or editor remount; use RHF's `reset` or reactive `values` option for intentional later updates. This same merge applies to `useFormulate(Contact, options)`. Schema-first defaults and async default-value loaders retain RHF's replacement semantics; async loaders should return the complete desired record and editors should wait until loading finishes.

Form uses React `useTransition` for pending state through the awaited check and callback. It keeps an `onSubmit` handler because successful native form Actions reset uncontrolled inputs; draft reset remains explicit through RHF. `useActionState` would introduce a second result state and serialize choice requests, so it is not used. Freshness checks still guard callbacks after changed values, navigation or evidence. See the [primitive decisions](../../docs/generalisation.md#existing-capabilities-and-demonstrated-gaps).

The [example SubmitButton](../../examples/react/src/components/formulate/form-actions.tsx) reads `useFormActionStatus()` from context, sets `type="submit"`, disables itself while checking or submitting, and accepts a `pendingLabel`. It is shared application UI, not a new package primitive. Native buttons and local shadcn buttons remain supported. RHF's `isSubmitting` does not cover scoped navigation through `trigger`; `isSubmitSuccessful` and submission counts are not navigation/completion indicators.

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
  scopedAction={navigation.page === "review" ? undefined : {
    id: navigation.revision,
    errorPaths: navigation.page === "settings"
      ? ["showAdvanced", "retries", "timeoutSeconds"]
      : ["endpoint"],
    onValid: () => {
      if (navigation.page === "settings") navigation.goToField("endpoint");
      else navigation.goToPage("review");
    },
  }}
  onInvalid={(errors) => {
    if (!navigation.goToFirstError(errors)) {
      form.setError("root.submit", { message: "Review the form errors before continuing." });
    }
  }}
  onSubmit={saveConfiguration}
>
  {/* Page.active follows navigation.page; use a native submit button for Next and Save. */}
</Form>
```

The [complete example](../../examples/react/src/advanced-options.tsx) includes all pages, mapped review edit links, and focus on the review summary. `goToPage(page, focusAfterCommit?)` permits an optional post-commit focus callback, such as focusing a heading ref. `goToField(name)` reveals and focuses a mapped editor without validating, so the host can use it for Back or edit links. Page names and field paths are checked by TypeScript. `initialPage` only initializes the hook; later location changes use its methods.

Destinations are in correction priority order and can use an explicit RHF editor path or a `FormScope`. A scope destination checks `focusPaths` in order, falling back to `errorPaths`, while the host still supplies the page and reveal policy. The same scope can gate Continue, drive a completion calculation, and render through a bound section without another list of internal paths. `goToFirstError(errors)` searches in destination order, then focus-path order, and returns false when no destination matches. This allows form-level fallback feedback; `goToField` likewise returns false for an unmapped path. A true result means navigation and focus were requested, not that the control has mounted or focus has succeeded. The navigation helper itself does not edit values, clear errors, or run validation; a host reveal callback can update values such as a disclosure checkbox. A section-root error can gate its action without pretending the object path is focusable; it falls through to host feedback unless a concrete editor also has an error. Separate group-error targets, unavailable-page fallback, portals, and async/suspended revelation remain open. The reveal callback must arrange for the control to mount in the same committed update; there is no polling or async readiness protocol.

`Form.scopedAction.errorPaths` or `Form.scopedAction.scope.errorPaths` gates **error paths**, not an independently executed schema. RHF's resolver still runs against the full form. An object path includes descendant errors; a bound section supplies its declared leaf paths so correction can focus the actual editor. Only errors within the requested scope are sent to Form's `onInvalid`. An empty scope calls `onValid` without a validation run. Cross-field rules follow the schema's execution semantics; assign their error path to a scope when they should gate that action. A form-level rule outside the scope still runs at final submission. For Zod form-level feedback, leave the issue path empty; RHF reserves `root` for application errors and clears that namespace during submission.

The scoped action's `onValid` receives **no payload**: passing one scope does not establish a valid full parsed result. Omitting `scopedAction` restores full validation and parsed `onSubmit` output. Rendering Review never submits automatically or marks the form complete.

Form suppresses validation callbacks after a value change/reset, a changed action ID/scope, a different runtime, or unmounting. `navigation.revision` changes even when returning to the same page; using it as the action ID prevents an old check from moving that new visit. If external policy changes the meaning of an action without changing its fields, change its ID as well. Use `shouldFocusError: false` with `goToFirstError` to avoid independent RHF focus after obsolete validation.

For requirements backed by external evidence, pass `getValidationRevision={() => evidence.getSnapshot().revision}` to Form. A form returned by `Definition.useChoiceForm` or the lower-level `useChoiceForm` already installs its choice-evidence getter, so no prop is needed unless the application must combine it with other evidence. The synchronous getter must read the live source and return a stable string or number that changes whenever evidence becomes obsolete, including a new request for the same input. Form captures it before checking and compares it before invoking scoped or final success/error callbacks. An obsolete attempt is cancelled; the user can retry against current evidence. Omit this prop for forms whose validation depends only on their editing values.

This is cancellation of navigation/correction callbacks, **not** cancellation of the resolver or an already-started application callback. A resolver can still finish and update RHF errors. Form prevents overlapping attempts and releases pending UI when the operation settles; it does not clear newer errors or restore an old snapshot. Validators, remote requests, and async callbacks still need application-owned cancellation/reconciliation if required. Rules, values, and validation errors remain in RHF/Zod, and the helper exposes no page completion or workflow graph.

## Reusable sections and subsections

[Address](../../examples/react/src/declarations/address.tsx) is now a `defineSection` declaration. Each field supplies its schema, default, label, and control once. Its presentation uses local names and hooks:

```tsx
function AddressFields({ title, layout }: SectionPresentationProps) {
  const country = Address.useWatch("countryCode");
  const trigger = Address.useTrigger();
  return <Section title={title} layout={layout}>
    <Address.Field name="street" />
    <Address.Field name="countryCode"
      componentProps={{ onValueChange: () => { void trigger("postcode"); } }} />
    <Address.Field name="postcode"
      description={country === "US" ? "5 digits" : "4 digits"} />
  </Section>;
}
```

Import `SectionPresentationProps` from Formulate for the presentation's props. The section's options accept `presentation: AddressFields`, a default `title`, and a `schema` customization callback. Without a custom renderer, the use renders a Section shell and its members in declaration order. Its title defaults to the definition title or the declared member name. Pass children to a particular use to supply another arrangement. Presentation components and definitions belong at module scope; passing presentation as a component preserves React hook semantics.

The host declares each use once:

```tsx
const Customer = defineForm({ billingAddress: Address, deliveryAddress: Address });
const billing = Customer.bindSection("billingAddress");
const delivery = Customer.bindSection("deliveryAddress");
// Inside the Form created with Customer.useForm():
<billing.Section title="Billing address" />
<delivery.Section title="Delivery address" />
```

`bindSection(name)` is cached by the form definition, so its `Section` component is stable even when requested during render. Its `errorPaths` contains the section object path for action gating, while `focusPaths` contains its declared leaf editors in order. `resolveFieldPath(localName)`, `resolveChoiceId(localName)` and `focusFirstField(form)` resolve the same use for correction, review links and dependent presentation. The host still chooses pages and action destinations:

```tsx
const employment = EmployeeOnboarding.bindSection("employment");
const navigation = useFormNavigation({
  form, initialPage: "setup",
  destinations: [{ scope: employment, page: "setup" }],
});

<EmployeeOnboarding.Form form={form}
  scopedAction={{ id: navigation.revision, scope: employment, onValid: openEquipment }}
  onInvalid={navigation.goToFirstError} onSubmit={requestOnboarding}>
  <employment.Section><EmploymentSetup pageId="setup" active /></employment.Section>
</EmployeeOnboarding.Form>
```

A section can contain more sections with the identical contract:

```tsx
const Details = defineSection({ address: Address });
const Registration = defineForm({ details: Details });
// Custom placement; the address fields bind at details.address.*:
<Registration.Section name="details">
  <Details.Section name="address" title="Address" />
</Registration.Section>
```

`Section` uses the same contract at every nesting level. Child binding composes recursively, without registering an additional writable object. Field accepts local field keys; Section accepts local section keys. Watch/trigger hooks resolve local editing paths in the matching definition's nearest use. Section members require that use and inherit its control; their Field/Fields helpers do not accept control overrides. Root definition fields still support explicit control overrides. Definition hooks must run below Form and, for sections, below the matching section use. The component that creates Form can continue using RHF hooks with its explicit form.control.

For unusual host shapes, `Address.Bind` accepts one typed `control` and a `SectionPathMap` map at the boundary:

```tsx
const bindings = {
  street: "shippingStreet", countryCode: "country", postcode: "postalCode",
} satisfies SectionPathMap<AddressValues, HostValues>;
<Address.Bind control={form.control} bindings={bindings} title="Delivery" />
```

When rendering, choice behavior, or workflow coordination also needs that map, capture it once with a stable logical ID and pass the resulting use to Bind:

```tsx
const resource = Resource.bind<InfrastructureValues>({
  id: resourceId,
  bindings: { name: `resources.${index}.name`, machineSize: `resources.${index}.machineSize` },
});
const choices = resource.bindChoices({ values, services });

<Resource.Bind control={form.control} binding={resource} />
```

Compatibility is checked in both directions because editors read and write. A string editor cannot bind to a boolean, an optional string contract, or a narrower literal contract. Nested section members can map to compatible host objects; their descendants resolve relative to that mapping. Bind changes binding only: validation must be composed into the host schema. `useTrigger` requires the enclosing Form to own that control. `fieldPaths` supplies unbound declared leaf paths; bound uses expose action `errorPaths` and ordered `focusPaths` paths. Neither form definitions nor bound sections infer page membership.

The [customer boundary](../../examples/react/src/declarations/customer.ts) uses a discriminated union in its schema option to suspend manual delivery requirements while retaining its string editing shape. It then constructs validated delivery from billing or the manual source and excludes the toggle. The host uses Customer.useForm and its typed fields/sections throughout. Review and edit links select the active source; no effect copies billing into the manual draft.

Local event handlers refresh named error paths; the resolver still evaluates the whole schema. Programmatic/off-screen edits need an explicit trigger for immediate error refresh. Automatic dependency scheduling, section completion, server field-error reconciliation, and a general applicability API remain open.

Inactive `Page` and tab editors use React Activity. Keep `useFormulate` / `Definition.useChoiceForm` / the lower-level `useChoiceForm` and validation in a surviving host outside hidden Activity boundaries: hidden effects and subscriptions disconnect. Activity preserves presentation state; it does not execute offscreen dependency validation. Removing an editor conditionally is also supported while the form survives. The local Radix Select adapter ignores empty notifications from its native form bridge during effect reconnection; clear its controlled value through RHF `setValue` or `reset`.

## Dependent choices

Use `defineChoice` at module scope to give a field its dependency and membership rule. Its input reads the containing section's editing values, and its service selector reads host-supplied services/context. Each field can use a different loader, input and option type. A host's required services are inferred recursively through its sections.

```tsx
const regions = defineChoice({
  getInput: (target: { accountId: string }) => target.accountId || null,
  getRequestKey: (input: string) => input,
  getLoader: (services: { listRegions: ChoiceLoader }) => services.listRegions,
  validateSelection: (selection: string, options: readonly Choice[]) =>
    options.some((option) => option.value === selection) ? undefined : "Choose an available region.",
  messages: { missing: "Choose an account.", pending: "Checking regions…", failed: "Unable to load regions. Retry." },
});
const Target = defineSection({
  accountId: { schema: z.string(), defaultValue: "", label: "Account", component: "input" },
  regionId: { schema: z.string(), defaultValue: "", label: "Region", component: "input", choices: regions },
});
const Deployment = defineForm({ primary: Target, recovery: Target });

function useDeployment(listRegions: ChoiceLoader) {
  return Deployment.useChoiceForm({ services: { listRegions } });
}
```

Import `defineChoice`, `defineForm`, `defineSection`, `Choice` and `ChoiceLoader` from `@formulate/react`; `z` is from Zod. The example uses native inputs to keep the control contract separate; [Cloud Deployment](../../examples/react/src/declarations/cloud-deployment.ts) uses the local select adapter. `Deployment.useChoiceForm` merges static prefills like `Deployment.useForm`, shallow-stabilizes an inline services object, and binds the complete definition independently of mounted editors.

`bindChoices` traverses definitions independently of mounted editors. Under `primary`, the rule reads `primary.accountId` and checks `primary.regionId` without a host selector declaring that relationship. Moving or reusing the section carries both connections. For repeated or remapped uses, prefer `Section.bind({ id, bindings })`, then pass the descriptor as `binding` to `Section.Bind` and call `binding.bindChoices({ values, services })`. The host supplies a stable item ID, never an array index. `binding.resolveChoiceId(localName)` resolves each view ID (for example `resource-123.machineSize`); IDs must be unique within the form. A changed mapped path preserves surviving evidence and refreshes both old and new error paths. The lower-level `bindChoices({ id, values, bindings, services })` remains available.

Reusable presentation reads its local view without rebuilding a host ID or importing the rule:

```tsx
function TargetFields() {
  const request = Target.useChoice("regionId");
  return <>
    <Target.Field name="accountId" />
    <Target.Field name="regionId" componentProps={{ options: request?.options ?? [] }} />
    <p role="status">{request?.validationMessage ?? "Ready"}</p>
    {request?.status === "failed" ? <button type="button" onClick={request.retry}>Retry</button> : null}
  </>;
}
```

`useChoice(name)` resolves the nearest declared or explicitly bound section use and returns a typed `{ status, options, validationMessage, revision, retry }` snapshot. It must run below the matching Section/Bind and a choice-aware Form. Default `Fields` rendering still cannot assume that every application control accepts an `options` prop or choose the application's feedback/retry UI.

For dynamic or repeated bindings, the lower-level hook returns the same augmented form directly:

```tsx
const getChoiceBindings = useCallback((values: InfrastructureValues) =>
  values.resources.flatMap((resource, index) =>
    bindResource(resource.resourceId, index).bindChoices({
      values,
      services: { accountId, regionId: values.regionId, listMachineSizes },
    }),
  ), [accountId, listMachineSizes]);

const form = useChoiceForm({
  schema: infrastructureSchema,
  defaultValues,
  getChoiceBindings,
});
const { choices, getValidationRevision } = form;
```

This fragment uses the [Infrastructure example's declarations](../../examples/react/src/declarations/infrastructure.ts) inside a component or hook. Import `useCallback` from React and `useChoiceForm` from Formulate. The returned form can go directly into `<Form form={form}>`; choice evidence is installed automatically. Each `BoundChoice` carries a stable `choiceId`, a current `fieldPath`, and a `requestKey`. Moving an item changes its field path without changing its identity or equivalent request.

The lower-level `choices.get(choiceId, rule)` remains available for coordinators outside a definition use. The rule argument checks the identity of the requested view; a missing or mismatched use returns `undefined`. Views are render snapshots; read again on the next render. The runtime subscribes to evidence changes; use RHF `useWatch` for live selected values.

The choice-aware form installs its live form-wide evidence revision in `Form`, invalidating pending actions on retries, service replacement, removal and restoration, even when values or results match a previous attempt. Pass an explicit `getValidationRevision` only to combine choice evidence with another application lifetime. Each attempt’s AbortSignal rejects obsolete success and failure even if a service ignores cancellation; there is no separate generation counter. Replacing one loader cancels only uses of that loader. Selected values are never cleared or copied by the choice runtime; the declaration decides whether a retained value is acceptable.

The resolver captures choice dependencies and selections from **editing input**, parses the schema once, then checks current evidence. It preserves schema issues and adds membership issues at editing paths. Output can rename/remove fields or change their types; it never feeds parsed output back into the dependency selector or overwrites RHF values. Services load outside validation; pending evidence blocks immediately with the declaration's message. `validateSelection` is synchronous and returns a message or `undefined`.

Current restrictions and ownership:

- Opt in with `Definition.useChoiceForm({ services })`. Plain `Definition.useForm()` / `useFormulate()` apply the schema only; choice metadata does not start services implicitly. Use the exported lower-level `useChoiceForm` when dynamic repeated uses must compute their own bindings.
- Keep definitions and loaders stable. The definition hook shallow-stabilizes unchanged top-level service entries; the lower-level hook still requires a stable `getChoiceBindings` callback. Supply complete editing defaults for every dependency the callback reads. Validate external drafts before `reset`.
- `null` input means no request and uses `messages.missing` as the blocking requirement. Empty strings, zero and false can otherwise be valid inputs. `getRequestKey(input)` must encode every dependency relevant to the result; equal keys assert interchangeable input. Keys are per use, not a shared cache.
- `choices.clearRequests()` aborts requests and discards options without clearing selections or immediately reloading. Use it immediately before `form.reset(restoredValues)` to start fresh requests even for an identical draft. Ordinary editor unmounts retain evidence; omitting a binding from `getChoiceBindings` removes it. No deduplication, caching, debounce or dependency graph is provided.
- Local selections and dependency types are checked at declaration time; binding and service types are checked at use time. Custom option types need compatible application controls. Arrays, applicability and cross-section context remain explicit host composition.
- Async schema checks can still finish and write RHF errors after an obsolete action, as described above. Form's revision guard suppresses action callbacks, not arbitrary resolver work.

`Choice`, `ChoiceLoader<Input = string, Option = Choice>`, `ChoiceSnapshot`, `ChoiceView`, `ChoiceRule`, `BoundChoice`, `ChoiceController` and `ChoiceFormRuntime` are exported types. Request and store constructors remain private package modules. The same implementation ships in `@formulate/core` through the source registry; no separate choice registry item or npm dependency is needed. See the [generalisation result](../../docs/generalisation.md) for measured authoring costs and remaining gaps.

## Configure once, select by name

The [example scaffold](../../examples/react/src/lib/formulate-config.ts) exports configured Field, defineForm, and defineSection helpers. There is no provider to configure for every form and no switch statement to extend.

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

`defineFieldControl` declares the adapter's editing contract for map type checking; it does not wrap the component or create state. `useFieldBinding` supplies name, value, value-based `onChange`, `onBlur`, focus ref, ID, disabled state, and accessible attributes. Adapter authors must honour the declared contract. A checkbox maps to `checked` and boolean changes; a picker may map to `onValueChange` and a trigger ref. No per-field render callback is needed.

Definitions and fields with an explicit typed control reject mismatched editing value types. All mapped fields check unknown keys, unsupported props, and missing required props at compile time. TypeScript cannot infer a wrapped child's value contract through arbitrary JSX; that composition path is the adapter author's responsibility. Built-in controls report incompatible runtime values, and controls used outside a Field throw an actionable error. This is not validation of a remotely supplied UI schema.

Built-in number controls convert empty text to `NaN`, which Zod rejects. An input needing richer intermediate text should keep a string editing contract and parse explicitly. Built-in control props cannot override the managed binding, change/blur handlers, or accessible associations. Put interaction customizations inside a local adapter. The example app provides registry-installed shadcn controls and a compound Select adapter; see [registry development](../../docs/registry-development.md).

## Styling and focus

The example scaffold uses Tailwind CSS 4 through the Vite plugin. Its [local controls](../../examples/react/src/components/formulate/controls.tsx) bind registry-installed shadcn exports; those UI components own styling and class merging. Adapter props derive from the installed exports. The Formulate runtime has no Tailwind dependency; a local shadcn component can use its own class-merging helper at the same boundary.

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

## Complex-workflow experiments

The [three acceptance exercises](../../docs/05-06-rendering-and-workflow.md#complex-workflow-evidence) now run in the example app: a shared EmploymentSetup page in two forms, branching deployment with dependent asynchronous choices, and repeated Resource sections with application-owned draft storage. They share the existing action/navigation machinery and Form's evidence-freshness boundary. Dependent-choice declarations and coordination now use the package API described above. Workflow destinations and application recovery policies remain local. RHF remains the editing-value authority; applications supply services, persistence and execution. The anchor records tested guarantees, remaining wiring and course corrections.

## Source organisation

`src/index.ts` is the public entry point. Internal modules import each other directly.

| Folder | Responsibility |
| --- | --- |
| `form/` | Form runtime, submission status and navigation. |
| `fields/` | Field rendering, control bindings and field context. |
| `definitions/` | Definition factories, configured controls and section binding scopes. |
| `choices/` | Dependent-choice declarations, requests, evidence store and form integration. |
| `presentation/` | Page, Section and layout shells. |

The core registry installs the same folder structure beneath `@/lib/formulate`. Consumers continue importing the public entry point.
