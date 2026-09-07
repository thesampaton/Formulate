# Parts 5–6 — Rendering and Workflow: Implementation Anchor

**Status: first executable slice, September 2026. API names and packaging remain experimental.**

Pair changes to this document with changes to the package, a scenario, and evidence. We will answer rendering and workflow questions incrementally rather than specify both engines up front.

## This iteration

- [Package](../packages/react/README.md): `Form`, `Field`, `Section`, `Page`, and `useFormulate`.
- [Simple form](../examples/react/src/simple-form.tsx): two direct fields, Zod validation, accessible errors, submission, and retry.
- [Advanced options](../examples/react/src/advanced-options.tsx): the smallest behavioural step beyond the simple form. A boolean discloses a Section; Settings → Review exercises Page. These are the optional additions explicitly described in [the scenario](03-scenarios/advanced-options.md).
- [Interaction tests](../tests/scenarios.test.tsx) and [primitive integration test](../tests/primitives.test.tsx): runnable evidence via `pnpm check`.

React 19 + TypeScript, RHF + Zod, Vite and Tailwind CSS 4 for the example app, and local connected HTML controls. The runtime package emits ESM and declarations without a Tailwind dependency. No router or framework-specific integration is needed for this slice. The private workspace package is a starting distribution boundary, not a final decision about which UI files should be installed through a registry.

## Decisions demonstrated in code

| Decision | Implementation and consequence |
| --- | --- |
| One authority for editing values. | [useFormulate](../packages/react/src/use-formulate.ts) creates RHF with a Zod resolver. There is no parallel value store. React state in the example holds location, focus requests, and the last accepted demo payload. |
| Requirements survive editor unmounting. | Validation is declared in a form-boundary schema. `shouldUnregister: false` retains values; the resolver can check them without mounted controls. Retention alone would not keep control-local validation alive. |
| A component map and JSX share one rendering contract. | [createFormulate](../packages/react/src/create-formulate.tsx) returns a Field that selects connected controls by key. Field can also wrap connected children. Both consume the same context from [FieldRoot](../packages/react/src/field.tsx). JSX supplies order; there is no component-type switch or child-tree scanner. |
| Accessibility belongs to the field/control integration. | Field supplies a unique control ID, label, help/error associations, invalid state, and RHF ref/events. The renderer must attach them to the actual control or trigger. |
| Layout does not bind data. | Section, Page, and CSS wrappers introduce no object paths. An integration test nests sections around `contact.email` and confirms submission contains only the explicitly bound object. |
| Visibility does not change applicability. | Advanced options remain required and included when hidden. An invalid hidden field causes the example to reveal its Section, render the Settings page, then focus the editor in an effect after commit. |
| A review is a reader. | The Review page uses `useWatch` and a definition list. It does not render Field, register another editor, or copy values into a second form. |
| The host owns navigation and execution. | Page accepts `active`. The advanced example handles Settings → Review → Save, Back, and correction. Form awaits the application callback and prevents overlapping attempts. The examples use local no-op handlers. |
| Submission parsing is a boundary. | Zod's accepted output is passed to the handler; editing values are not overwritten by transforms. The advanced example explicitly maps the payload to exclude its UI toggle. |

These implement a small part of the [mental model](03-mental-model.md), [layout](03-layout-and-presentation.md), and [state reference](03-state-and-completion.md). Section and Page are currently named presentations, not the full runtime entities proposed in [Part 4](04-entity-shapes.md). They have no membership graph or scoped completion yet.

## Part 5 — Rendering questions

| Question | Current answer / next decision |
| --- | --- |
| Render arbitrary schemas? | **Open.** Zod validates the value shape; JSX declares presentation. There is no arbitrary JSON Schema renderer or Zod introspection. Next, test a small typed field-definition map against the same controls. A future portable format should resolve allowed renderer keys through a catalogue and diagnose unknown keys; avoid a giant switch or pretending a value schema fully describes UI. |
| Custom components? | **Map and composition implemented.** `createFormulate({ components })` configures named controls. `component`/`componentProps` select one; alternatively Field wraps a connected child. Adapter authors use `defineFieldControl<Value>()` and `useFieldControl<Value>()` once to connect their UI. Mapped props and editing types are checked; arbitrary JSX child contracts cannot be inferred. Text, number, and boolean adapters ship. Structured values and compound pickers need a concrete pressure test. |
| shadcn registry components? | **Integration boundary only.** Adapt an installed local component once, then map it or compose it inside Field. Installation addresses are not runtime renderer identities. Actual source registry items, dependencies, variants, and an accessible compound-control example remain open under [Part 4 distribution](04-registry-distribution.md). |
| Layout? | **Basic support.** Ordered JSX and wrapper classes, including Tailwind responsive grids. Field `className` controls placement; `componentProps.className` styles a mapped control; connected children accept classes directly. Example control defaults merge with caller classes using `tailwind-merge`. Scaffold CSS lives in layers below utilities. No layout DSL. Additional styling slots, heading levels, and portal-specific contracts remain open. |
| Nested groups? | **Presentation supported.** Sections can contain sections, without implicit data nesting. Reusable binding scopes, independent local references, cross-page logical sections, and aggregate requirements remain open. |
| Repeatable arrays? | **Deferred.** First pressure test should use RHF field arrays, distinguish stable item identity from index paths, and cover insert/remove/reorder/error focus before introducing a repeat abstraction. |
| Review pages? | **Example implemented.** Read current values without registering more fields. A reusable review renderer, redaction, editable correction links, and acknowledgement of a particular snapshot remain open. |

## Part 6 — Workflow questions

| Question | Current answer / next decision |
| --- | --- |
| Multi-step forms | **Example only.** Local page state, guarded forward action, free Back, retained values, review, and final revalidation. Settings contains every editable requirement, so whole-form validation is sufficient here. Scoped navigation requirements and routes/tabs are not implemented. |
| Branching workflows | **Deferred.** Need explicit available destinations, a fallback when the current page disappears, and retention/applicability policies. Use a scenario before choosing graph syntax. |
| Conditional visibility | **Example implemented.** `useWatch` + conditional JSX, with explicit correction behaviour. No generic reveal/focus coordinator yet. |
| Conditional validation | **Deferred.** Current numeric rules always apply. Zod can express conditions, but a shared applicability/retention/payload policy has not been designed or tested. |
| Derived values | **Deferred.** Review reads values and submission maps payloads; neither is a dependency engine. Next meaningful test is delivery-from-billing in [customer onboarding](03-scenarios/customer-onboarding.md), including correction provenance. |
| Async data | **Deferred.** No option loader or dependency scheduler. Must address cancellation, stale results, selected-value resolution, and pending vs failed required checks. |
| Autosave | **Deferred.** No timers or persistence. Need an application capability and an acknowledged snapshot baseline that preserves newer edits. |
| Draft recovery | **Deferred.** No localStorage. Need versioning, sensitive-field policy, migration, and revalidation on restore. |
| Progress tracking | **Deferred.** “Step 1 of 2” indicates location only. It is not “1 of 2 complete.” We do not expose complete/incomplete for sections or pages until requirements and freshness are modelled. |
| Submission pipelines | **Minimal path implemented.** Validate → parse → application mapping if needed → await handler. Prevent overlapping attempts; a thrown handler yields generic form feedback and retained values for retry. Attempt identifiers, server field-error reconciliation, cancellation, scoped saves, and durable orchestration remain open. |

## Scenario evidence and limitations

| Acceptance case | Evidence |
| --- | --- |
| Simple form needs no Pages, Sections, registry entries, library definitions, mapper, or duplicate presentation lists. | Two inline Field elements and a native submit button in the simple example. |
| Each rule has one authority. | Zod schemas own validation; controls add no competing RHF rules. Browser validation is disabled on Form so the same submission path handles all errors. Native numeric hints mirror the domain limits for input behaviour. |
| Field labels, errors, and focus work. | Test associates the email error, verifies first-error focus, corrects values, and submits. |
| Independent form uses remain independent. | Two mounted simple forms have different control IDs and independent values. |
| Hidden invalid settings are still applicable. | Test edits retries to 11, hides the section, and submits. The section reappears and the invalid input receives focus. |
| Pages preserve values, review adds no editor. | Tests visit Review, return to Settings, retain edits, and confirm there are no input controls mounted during review. |
| Blank numeric text does not silently become zero. | The example maps an empty number input to NaN; validation rejects it and correction focuses the input. |
| Keyboard follows the same guard. | Enter on Settings validates and opens Review; saving requires a subsequent action. |
| Failure permits retry. | A rejected handler shows form feedback, preserves entered values, and releases the pending guard. Duplicate in-flight submits call the handler once. |
| Off-screen schema and output parsing survive presentation changes. | Integration test submits an invalid unmounted page, then checks a valid transformed nested payload without changing the editing value. |

**The simple-form authoring budget is not fully solved.** The current implementation names keys in the schema, defaults, and Field bindings. There are no duplicate rules or extra instance IDs, but this is more authored binding repetition than the scenario's “one value key per field” target. We are exposing this gap instead of freezing a definition DSL prematurely. The next authoring experiment should eliminate this repetition while retaining form-boundary validation and direct React composition.

Other deliberate limits: no requirement graph, stable logical references separate from RHF paths, reusable definition helpers, section/page completion, cross-field scheduling, or renderer schema. Do not infer these from the existence of primitive components. Current numeric editing supports ordinary finite numbers and blank input; richer intermediate strings need a different editing contract. All examples start fresh on reload or when switched. Review success displays the last accepted payload, not a claim that subsequent edits are saved.

Initial verification covered TypeScript, seven interaction tests, both builds, the built package's ESM imports, and a browser walkthrough of hidden-error correction, review, and submission. The map/composition iteration adds an eighth interaction test for a replaced custom input and a wrapped custom input, including blur validation, error focus, and independent values. Compile-time checks reject unknown keys, wrong editing types, unsupported or missing props, binding overrides, and combining map selection with children. This is not yet a cross-browser or assistive-technology audit.

## Field authoring decision

The ordinary field API now selects `component="input"` with typed `componentProps`. The [example scaffold](../examples/react/src/formulate.ts) owns the map; swapping an entry changes all mapped uses. The [advanced example](../examples/react/src/advanced-options.tsx) also wraps a NumberControl directly to demonstrate the composition path. Both preserve labels, error associations, focus, and the shared RHF value authority.

The map holds connected controls, not arbitrary visual components. Native inputs, checkbox controls, and pickers have different value/event/ref contracts, so each local UI needs an explicit adapter once. Field does not guess those contracts by cloning children. A wrapped child opts into that specific UI rather than a map override. Full Field definitions with defaults, rules, metadata, and reusable bindings remain separate open work; a control map does not resolve the single-key authoring budget.

Tailwind support lives at this presentation boundary. The [local controls](../examples/react/src/controls.tsx) apply semantic theme classes and merge caller overrides. The sign-in fields demonstrate overriding default height through `componentProps.className`; advanced options demonstrates responsive wrapper layout and direct classes on a wrapped NumberControl. These are native controls with local styling; actual shadcn installation and compound adapters remain open. Setup follows the [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite), with conflict resolution supplied by [tailwind-merge](https://github.com/dcastil/tailwind-merge).

## Next iterations, one at a time

1. **Improve authoring against the simple-form budget.** Prototype a local reusable Email and typed field definition that share the current rendering contract. Compare schema/default/binding repetition, inferred types, custom props, and moving fields across wrappers. Keep the existing JSX example as the baseline.
2. **Extract only the coordination demonstrated here.** Decide whether correction destinations and page action scopes justify a hook. Add a third editing page only when needed to prove scoped validation; do not build a workflow graph to navigate two pages.
3. **Add customer onboarding as the next scenario.** Reuse Address twice with explicit bindings, independent country/postcode dependencies, and review readers. This should drive group requirements, local references, and conditional policies.
4. **Choose the next pressure test together.** Arrays, async choices, or draft recovery; update the appropriate row above and add evidence before expanding scope.

For each iteration: identify one scenario invariant, make the smallest code change, add a meaningful interaction check, and update this anchor's status and remaining decisions. The [Part 4 helpers](04-library-authoring.md) remain proposals until that process supports them.

Implementation references: [RHF Controller contract](https://github.com/react-hook-form/react-hook-form/blob/master/src/useController.ts) and [Vite setup requirements](https://vite.dev/guide/). The checked-in lockfile records the versions exercised by this prototype.
