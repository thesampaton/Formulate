# Parts 5–6 — Rendering and Workflow: Implementation Anchor

**Status: executable definitions and scoped navigation, September 2026. API names and packaging remain experimental.**

Pair changes to this document with changes to the package, a scenario, and evidence. We will answer rendering and workflow questions incrementally rather than specify both engines up front.

## This iteration

- [Package](../packages/react/README.md): `Form`, `Field`, `Section`, `Page`, `useFormulate`, `defineForm`, `useFormNavigation`, and `useFormActionStatus`.
- [Simple form](../examples/react/src/simple-form.tsx): two direct fields, Zod validation, accessible errors, submission, and retry.
- [Advanced options](../examples/react/src/advanced-options.tsx): a boolean discloses a Section; Settings → Destination → Review now proves scoped navigation across two editing pages. Request URL starts empty, so Settings can pass while the form remains invalid. See [the scenario](03-scenarios/advanced-options.md).
- [Email confirmation](../examples/react/src/email-confirmation.tsx): pressure-tests reusable Email configuration, a cross-field requirement, and explicit nested bindings against the schema-first baseline. See [scenario invariants](03-scenarios/simple-form.md#definition-helper-pressure-test).
- [Interaction tests](../tests/scenarios.test.tsx) and [primitive integration test](../tests/primitives.test.tsx): runnable evidence via `pnpm check`.

React 19 + TypeScript, RHF + Zod, Vite and Tailwind CSS 4 for the example app, and local connected HTML controls. The runtime package emits ESM and declarations without a Tailwind dependency. No router or framework-specific integration is needed for this slice. The private workspace package is a starting distribution boundary, not a final decision about which UI files should be installed through a registry.

## Decisions demonstrated in code

| Decision | Implementation and consequence |
| --- | --- |
| One authority for editing values. | [useFormulate](../packages/react/src/use-formulate.ts) creates RHF with a Zod resolver. There is no parallel value store. The navigation hook holds location and focus requests; the example holds the last accepted demo payload. |
| Field runtime connections default to context. | Field reads the enclosing Form's RHF context. Optional `control` explicitly chooses a runtime, including outside Form. It is a state connection, not a UI component type. Definition-bound fields preserve name/value typing without passing control. |
| A declaration can supply schema, default, and presentation. | [defineForm](../packages/react/src/define-form.tsx) derives one Zod object schema, RHF defaults, a typed Field, and ordered Fields from a flat declaration map. Definitions are created at module scope; no live state is stored in them. |
| Requirements survive editor unmounting. | Validation is declared in a form-boundary schema. `shouldUnregister: false` retains values; the resolver can check them without mounted controls. Retention alone would not keep control-local validation alive. |
| A component map and JSX share one rendering contract. | [createFormulate](../packages/react/src/create-formulate.tsx) returns a Field that selects connected controls by key. Field can also wrap connected children. Both consume the same context from [FieldRoot](../packages/react/src/field.tsx). JSX supplies order; there is no component-type switch or child-tree scanner. |
| Accessibility belongs to the field/control integration. | Field supplies a unique control ID, label, help/error associations, invalid state, and RHF ref/events. The renderer must attach them to the actual control or trigger. |
| Layout does not bind data. | Section, Page, and CSS wrappers introduce no object paths. An integration test nests sections around `contact.email` and confirms submission contains only the explicitly bound object. |
| Visibility does not change applicability. | Advanced options remain required and included when hidden. An invalid hidden field causes the example to reveal its Section, render the Settings page, then focus the editor in an effect after commit. |
| A review is a reader. | The Review page uses `useWatch` and a definition list. It does not render Field, register another editor, or copy values into a second form. |
| The host owns navigation and execution. | Page accepts `active`. The advanced example chooses Settings → Destination → Review → Save, Back, and correction. Form checks the declared navigation scope or the whole final submission, awaits callbacks, and prevents overlapping attempts. The examples use local no-op handlers. |
| Submission parsing is a boundary. | Zod's accepted output is passed to the handler; editing values are not overwritten by transforms. The advanced example explicitly maps the payload to exclude its UI toggle. |

These implement a small part of the [mental model](03-mental-model.md), [layout](03-layout-and-presentation.md), and [state reference](03-state-and-completion.md). Section and Page are currently named presentations, not the full runtime entities proposed in [Part 4](04-entity-shapes.md). They have no membership graph or scoped completion yet.

## Part 5 — Rendering questions

| Question | Current answer / next decision |
| --- | --- |
| Render arbitrary schemas? | **Typed local declarations implemented; arbitrary schemas remain open.** `defineForm` combines field schemas, defaults, and presentation; its Fields component renders declaration order through the existing control catalogue. It supports flat identifier bindings, not arbitrary JSON Schema or Zod introspection. A future portable format needs runtime validation and capability resolution. |
| Custom components? | **Map and composition implemented.** `createFormulate({ components })` configures named controls. `component`/`componentProps` select one; alternatively Field wraps a connected child. Adapter authors use `defineFieldControl<Value>()` and `useFieldControl<Value>()` once to connect their UI. Mapped props and editing types are checked; arbitrary JSX child contracts cannot be inferred. Text, number, and boolean adapters ship. Structured values and compound pickers need a concrete pressure test. |
| shadcn registry components? | **Integration boundary only.** Adapt an installed local component once, then map it or compose it inside Field. Installation addresses are not runtime renderer identities. Actual source registry items, dependencies, variants, and an accessible compound-control example remain open under [Part 4 distribution](04-registry-distribution.md). |
| Layout? | **Basic support.** Ordered JSX and wrapper classes, including Tailwind responsive grids. Field `className` controls placement; `componentProps.className` styles a mapped control; connected children accept classes directly. Example control defaults merge with caller classes using `tailwind-merge`. Scaffold CSS lives in layers below utilities. No layout DSL. Additional styling slots, heading levels, and portal-specific contracts remain open. |
| Nested groups? | **Presentation supported.** Sections can contain sections, without implicit data nesting. Reusable binding scopes, independent local references, cross-page logical sections, and aggregate requirements remain open. |
| Repeatable arrays? | **Deferred.** First pressure test should use RHF field arrays, distinguish stable item identity from index paths, and cover insert/remove/reorder/error focus before introducing a repeat abstraction. |
| Review pages? | **Example implemented.** Read current values without registering more fields; edit links use mapped correction destinations. A reusable review renderer, redaction, and acknowledgement of a particular snapshot remain open. |

## Part 6 — Workflow questions

| Question | Current answer / next decision |
| --- | --- |
| Multi-step forms | **Scoped field-path navigation implemented.** Form accepts an optional navigation action; Next/Enter checks only its named error paths before calling onValid without a payload. Final onSubmit validates/parses the whole form. useFormNavigation coordinates location, disclosure, and focus. Scope membership is explicit, not inferred from JSX. Requirement graphs, completion, routes, and tabs remain open. |
| Branching workflows | **Deferred.** Need explicit available destinations, a fallback when the current page disappears, and retention/applicability policies. Use a scenario before choosing graph syntax. |
| Conditional visibility | **Synchronous correction implemented.** `useWatch` + conditional JSX, with ordered field destinations in useFormNavigation. Reveal runs before the page/focus commit. Suspended editors, async reveal, portals, and disappearing destinations remain open. |
| Conditional validation | **Deferred.** Current numeric rules always apply. Zod can express conditions, but a shared applicability/retention/payload policy has not been designed or tested. |
| Derived values | **Deferred.** Review reads values and submission maps payloads; neither is a dependency engine. Next meaningful test is delivery-from-billing in [customer onboarding](03-scenarios/customer-onboarding.md), including correction provenance. |
| Async data | **Deferred.** No option loader or dependency scheduler. Must address cancellation, stale results, selected-value resolution, and pending vs failed required checks. |
| Autosave | **Deferred.** No timers or persistence. Need an application capability and an acknowledged snapshot baseline that preserves newer edits. |
| Draft recovery | **Deferred.** No localStorage. Need versioning, sensitive-field policy, migration, and revalidation on restore. |
| Progress tracking | **Deferred.** “Step 1 of 3” indicates location only. It is not “1 of 3 complete.” We do not expose complete/incomplete for sections or pages until requirements and freshness are modelled. |
| Submission pipelines | **Minimal path implemented.** Validate → parse → application mapping if needed → await handler. Prevent overlapping attempts; a thrown handler yields generic form feedback and retained values for retry. Validation callbacks are suppressed after edits, resets, action/scope changes, or unmounting. Aborting underlying validation/network work, application attempt identifiers, server field-error reconciliation, scoped saves, and durable orchestration remain open. |

## Scenario evidence and limitations

| Acceptance case | Evidence |
| --- | --- |
| Simple form needs no Pages, Sections, registry entries, extracted field library, mapper, or duplicate presentation lists. | One local form declaration and a native submit button. SignIn.Fields renders declaration order without repeating names. The schema-first JSX path remains available without a definition helper. |
| Each rule has one authority. | Zod schemas own validation; controls add no competing RHF rules. Browser validation is disabled on Form so the same submission path handles all errors. Native numeric hints mirror the domain limits for input behaviour. |
| Field labels, errors, and focus work. | Test associates the email error, verifies first-error focus, corrects values, and submits. |
| Independent form uses remain independent. | Two mounted simple forms have different control IDs and independent values. |
| Hidden invalid settings are still applicable. | Test edits retries to 11, hides the section, and submits. The section reappears and the invalid input receives focus. |
| Pages preserve values, review adds no editor. | Tests visit Review, return to Settings, retain edits, and confirm there are no input controls mounted during review. |
| Blank numeric text does not silently become zero. | The example maps an empty number input to NaN; validation rejects it and correction focuses the input. |
| Keyboard follows the same guard. | Enter on each editing page checks its scope and advances one page. Only a subsequent action on Review can save. |
| Failure permits retry. | A rejected handler shows form feedback, preserves entered values, and releases the pending guard. Duplicate in-flight submits call the handler once. |
| Off-screen schema and output parsing survive presentation changes. | Integration test submits an invalid unmounted page, then checks a valid transformed nested payload without changing the editing value. |

**The single-key experiment is now executable.** Sign-in declares `email` and `password` once each, colocating their schema, editing default, and presentation. `SignIn.useForm()` derives validation/defaults; `<SignIn.Fields />` derives presentation order. Custom placement uses `<RequestSettings.Field name="retries" />`, repeating only the reference at the placement site. This is fewer independently maintained keys, though the records are not necessarily fewer lines than JSX. It introduces an optional local form-definition helper, rather than meeting every part of the original zero-definition budget through inline JSX alone. The schema-first API remains the baseline alternative.

Other deliberate limits: no requirement graph, stable logical references separate from RHF paths, section/page/field library helpers, section/page completion, cross-field scheduling, or portable renderer schema. The first defineForm helper supports flat field keys, not the complete entity shapes proposed in Part 4. Use the schema-first path for nested bindings and cross-field requirements. Current numeric editing supports ordinary finite numbers and blank input; richer intermediate strings need a different editing contract. All examples start fresh on reload or when switched. Review success displays the last accepted payload, not a claim that subsequent edits are saved.

Initial verification covered TypeScript, seven interaction tests, both builds, the built package's ESM imports, and a browser walkthrough of hidden-error correction, review, and submission. The map/composition iteration adds an eighth interaction test for a replaced custom input and a wrapped custom input, including blur validation, error focus, and independent values. Compile-time checks reject unknown keys, wrong editing types, unsupported or missing props, binding overrides, and combining map selection with children. This is not yet a cross-browser or assistive-technology audit.

The definition/context iteration adds three interaction tests (eleven total): default context, explicit runtime overrides and standalone fields; generated editing defaults and transformed output with stable control identity; and actionable errors for missing context or unsupported keys. Existing scenario tests now exercise the definition-backed examples, including independent form instances, unmounted validation, hidden correction, and retry. Additional compile-time cases cover definition names without control, declaration defaults against editing types, required component props, and rejecting controls that cannot handle every possible editing value.

## Field authoring decision

The ordinary field API now selects `component="input"` with typed `componentProps`. The [example scaffold](../examples/react/src/formulate.ts) owns the map; swapping an entry changes all mapped uses. The [advanced example](../examples/react/src/advanced-options.tsx) also wraps a NumberControl directly to demonstrate the composition path. Both preserve labels, error associations, focus, and the shared RHF value authority.

The map holds connected controls, not arbitrary visual components. Native inputs, checkbox controls, and pickers have different value/event/ref contracts, so each local UI needs an explicit adapter once. Field does not guess those contracts by cloning children. A wrapped child opts into that specific UI rather than a map override. `createFormulate` now also exposes defineForm using the same catalogue, so definition-backed and direct fields share the adapters.

Plain Field can omit control, but React context cannot statically infer a parent's generic value shape for a JSX child. Definition.Field binds the allowed names and control props at authoring time while selecting the live runtime from context. An explicit control still takes precedence. That override affects binding only; an enclosing Form submits its own runtime. Definition fields should be paired with their matching runtime. A full runtime definition-identity check remains open.

Definition.Field allows presentation overrides without changing rules or defaults: wrapper props and labels override their defaults, componentProps merge shallowly with declared props, and connected children replace the declared editor and its props. Changing a className replaces that declaration's class string; local adapters still merge it with their own base classes. Definitions do not mutate values during render or repeat default initialization on remount.

Tailwind support lives at this presentation boundary. The [local controls](../examples/react/src/controls.tsx) apply semantic theme classes and merge caller overrides. The sign-in fields demonstrate overriding default height through `componentProps.className`; advanced options demonstrates responsive wrapper layout and direct classes on a wrapped NumberControl. These are native controls with local styling; actual shadcn installation and compound adapters remain open. Setup follows the [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite), with conflict resolution supplied by [tailwind-merge](https://github.com/dcastil/tailwind-merge).

## Next iterations, one at a time

### Ergonomics review

| Friction | Decision |
| --- | --- |
| Importing a hook and passing a definition it could already know. | Implemented `Definition.useForm(options?)` as a typed convenience over useFormulate. It creates the same RHF runtime and leaves the schema-first path available. |
| Prefilling one field discarded every other declared default. | Static definition prefills now merge by top-level field. Empty strings, false, and zero remain explicit overrides. Structured field values are replaced atomically; there is no implicit deep merge. Async loaders retain RHF's complete-record behaviour. |
| Every submit button repeated pending/disabled/label logic. | Extracted a small [local SubmitButton](../examples/react/src/submit-button.tsx). Submission coordination remains in Form; this is evidence for later action UI, not another core primitive. |
| Three subscriptions repeated the same control configuration. | The advanced example uses one typed name-array useWatch call. No extra watcher abstraction is needed. |
| Definition records still require label, editing default, and component. | Keep these explicit. Inferring a renderer or initial value from Zod can hide important choices, especially optional values, transforms, or multiple valid presentations. |
| componentProps is verbose. | Keep the wrapper/control distinction: flattening the props would make className, style, IDs, and event ownership ambiguous. Shared UI defaults belong in the control catalogue. |
| Reveal/navigate/focus takes substantial application code. | Extracted useFormNavigation after testing two editing pages, explicit destinations, and cancellation of stale validation callbacks. The host still defines which actions and destinations are available. |
| A server rejection only has generic form feedback. | Consider an explicit application error-mapping hook with attempt ownership when submission contracts are expanded; do not add one solely to shorten this example. |

Verification now includes twelve interaction tests, with new coverage for partial prefills, falsy overrides, reset baselines, preservation of user edits across rerenders, and definition immutability. Type checks cover prefill names/editing types and parsed-output inference through the bound hook. Existing submission tests exercise the shared button's pending and retry behaviour. Package and example builds pass.

### Follow-up order

1. **Pressure-test the first definition helper — completed for this slice.** Email reuse, cross-field requirements, explicit nested bindings, typing, and runtime lifetime now have executable evidence; see the findings below. A bound schema-customization API remains a measured ergonomic gap, not an implemented capability.
2. **Extract only the coordination demonstrated here — completed for this slice.** useFormNavigation coordinates correction and Form.navigation gates explicit field-path scopes. Two editing pages plus Review prove this without a workflow graph; see the evidence and limits below.
3. **Add customer onboarding as the next scenario.** Reuse Address twice with explicit bindings, independent country/postcode dependencies, and review readers. This should drive group requirements, local references, and conditional policies.
4. **Choose the next pressure test together.** Arrays, async choices, or draft recovery; update the appropriate row above and add evidence before expanding scope.

For each iteration: identify one scenario invariant, make the smallest code change, add a meaningful interaction check, and update this anchor's status and remaining decisions. The [Part 4 helpers](04-library-authoring.md) remain proposals beyond the deliberately narrower defineForm helper implemented here.

### Definition-helper pressure test

The [third example](../examples/react/src/email-confirmation.tsx) compares a declaration-backed email confirmation with explicit `contact.email` / `contact.confirmEmail` bindings. Both use the same Zod requirement. The nested form wraps the refined object schema, which also prefixes the confirmation error path correctly. Switching modes deliberately creates a fresh runtime; rerendering either mode preserves its runtime and editors.

| Case | Evidence and decision |
| --- | --- |
| Reuse Email without sharing values. | [Email](../examples/react/src/email.ts) is ordinary configuration, used by sign-in and both confirmation bindings. Each placement supplies its own name. Tests verify independent values, unique IDs, and local presentation overrides without mutating the shared declaration. Keep plain configuration; no field-library primitive is needed yet. |
| Preserve typing after extraction. | An extracted object's string literals widen without contextual typing. `component: "input" as const` and `componentProps satisfies InputControlProps` preserve the adapter contract. Compile-time cases reject incompatible defaults, controls, and nested paths. This is real extraction friction that a future typed declaration helper could address. |
| Validate a relationship across fields. | Refine `EmailConfirmation.schema` once at module scope, then pass `{ schema, defaultValues }` to `useFormulate`. Generated Fields and individually placed Field retain their presentation and name typing. Tests cover mismatch feedback/focus, correction, and invalidation after changing the original email. |
| Validate without mounted editors. | A cross-field test begins with the confirmation editor never mounted, corrects it, unmounts it, then changes the original email. Submission rejects the new mismatch and retains the confirmation value. No rule depends on a mounted control. |
| Bind nested data explicitly. | The schema-first variant declares its object schema, editing defaults, and typed RHF paths. Section supplies presentation only. Tests assert the exact nested submission payload and the same correction behaviour as the flat form. Keep this baseline until repeated group composition supplies stronger evidence for a scope helper. |
| Preserve runtime lifetime. | Both example definitions/schemas live at module scope. Tests retain edited values and the same DOM control across rerenders, and isolate two simultaneous form uses. |

**Measured limit:** a refined schema does not update the original definition or its bound `useForm()` hook. The example explicitly selects the refined boundary through `useFormulate`; calling `EmailConfirmation.useForm()` would omit the equality rule. A future schema-customization API should preserve the bound hook, name typing, and parsed-output inference together. This slice exercises a refinement that preserves input/output shape; shape-changing form transforms with definition-bound controls remain unproven.

Submission rechecks the whole relationship. There is no dependency scheduler to eagerly refresh a sibling's error on every edit, and no generic hidden-error navigation in this pressure test. The existing advanced-options scenario remains the evidence for reveal/focus coordination.

Verification: `pnpm check` passes TypeScript, **16 interaction tests**, and both builds. The four new tests cover both authoring paths (including Strict Mode), unmounted cross-field requirements, and declaration reuse across runtimes. Existing sign-in tests also pass after extracting Email. A browser walkthrough verified mismatch feedback, correction, flat/nested payloads, and keyboard/pointer error focus for the nested form; the console was clear. No core runtime API was expanded; the package guide now documents the demonstrated composition boundary. The next coordination slice is recorded below.

### Correction destinations and scoped page actions

The [advanced example](../examples/react/src/advanced-options.tsx) now adds a Destination page with a required request URL. Settings can advance with valid numeric defaults while that URL is still empty. This is the smallest additional editing page that distinguishes a page action from whole-form submission. The demo payload now includes `configuration.endpoint`; `showAdvanced` remains UI-only.

| Decision | Runnable evidence |
| --- | --- |
| The host supplies correction destinations in priority order. | [useFormNavigation](../packages/react/src/use-form-navigation.ts) maps an error's explicit field path to a page and optional synchronous reveal. `correct(errors)` chooses the first mapped error; `goToField(name)` supports review edit links. Unmapped errors return false for host feedback, with no guessed field. |
| Navigation and focus commit in order. | `goTo` replaces any pending request. An effect focuses once after the destination editor mounts. Strict Mode tests cover reveal, nested paths, and a newer navigation replacing an earlier correction before commit. |
| Scope membership is explicit. | [Form.navigation](../packages/react/src/form.tsx) takes an action/visit ID, field paths, and onValid. It uses RHF trigger and forwards only scoped errors to onInvalid. Object paths can include descendant errors; correction still targets an editor path. No Page child scanning or requirement graph. |
| Next cannot claim full validity or parsed output. | onValid receives no values. Request URL is still invalid when Settings passes. Final onSubmit checks the whole schema, including unmounted fields and cross-page rules, and alone receives parsed output. A rule gates a scoped action only when its error path is in that action's scope. |
| Pending state covers both kinds of action. | useFormActionStatus reports checking/saving through Form context. The shared SubmitButton and review edit buttons use it. Synchronous guards block duplicate events before React updates the buttons; failures release the guard and retain values for retry. |
| Stale validation cannot choose a destination. | Form observes value changes while checking and invalidates an attempt when the action ID, scope, runtime, or mounted lifetime changes. Tests cover edits, reset, a same-page return, leaving for another page, unmount, stale failures, and cancellation before a final application handler starts. |
| Review stays a reader. | It reads the URL and numeric settings, and its edit links reuse the correction map. Tests retain values across pages and confirm no editor is mounted in Review. |

**Scope is an error-path filter, not a partial schema or a completion claim.** The Zod resolver still evaluates the full form. Cross-field refinements follow Zod's execution rules, including refinements skipped after incompatible input types; this helper does not schedule dependencies or create independently executable requirements. A form-wide rule may intentionally wait for final submission. The tests cover both a rule assigned to an earlier editor and an unmapped form-level issue with fallback feedback.

**Cancellation suppresses coordination, not the underlying work.** A pending resolver may still finish and update RHF errors. We do not abort it, restore an earlier error snapshot, or start overlapping checks. Pending UI releases when that operation settles. Callbacks already started, including application saves, remain application-owned. Set `shouldFocusError: false` when using the correction hook so RHF does not perform competing focus changes. Async revelation, unavailable-page fallback, and server error ownership require later scenarios.

Verification: `pnpm check` passes TypeScript, **28 interaction tests**, and both builds. Twelve new navigation tests exercise scope, final validation, correction, cancellation, pending state, and retry; existing advanced-options tests now cover the three-page flow. Compile-time checks reject unknown page/field names, invalid scopes, and navigation callbacks that expect a submission payload. Public navigation properties have JSDoc in emitted declarations. A browser walkthrough verified independent page guards, review edit links, hidden-error reveal/focus, retained values, and the final URL/numeric payload; no console warnings or errors appeared. **Next: customer onboarding**, reusing Address with explicit bindings and independent dependencies (follow-up 3).

Implementation references: [RHF Controller contract](https://github.com/react-hook-form/react-hook-form/blob/master/src/useController.ts) and [Vite setup requirements](https://vite.dev/guide/). The checked-in lockfile records the versions exercised by this prototype.
