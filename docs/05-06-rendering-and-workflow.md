# Parts 5–6 — Rendering and Workflow

**Current position, September 2026:** the bounded Parts 5–6 slice is implemented. The three complex-workflow examples behave as intended within their tested scope. Dependent choices carry local behavior; definition-owned forms install their choice runtime directly; and one bound section use supplies presentation, local choice views, its action-gating root, ordered correction paths and focus. The assessment did **not** justify a page API or general requirement/completion engine; broader capabilities remain deferred until a concrete workflow requires them.

This document records current support, remaining decisions and course corrections. API usage belongs in the [package guide](../packages/react/README.md); detailed acceptance sequences belong in the [scenarios](03-scenarios/README.md). The [product vision](01-product-vision.md) and [design principles](02-design-principles.md) remain the intended direction.

## Outcome and remaining boundaries

The [generalisation extraction](generalisation.md) and its authoring follow-ons are complete. Both choice examples use the package runtime and definition-owned local rules. Employment, Cloud targets and the profile pages use bound section scopes; repeated Resource uses share one stable ID/binding contract between behavior and rendering. Reusable target/resource presentation reads its choice view by local field name rather than reconstructing a host ID and rule lookup.

| Result | Decision and evidence | Remaining boundary |
| --- | --- | --- |
| **Bound section uses, local choices and correction: implemented.** | `bindSection(name)` returns a stable renderer, validation root and leaf correction order. `Section.bind({ id, bindings })` captures a repeated/remapped use. Both satisfy `FormScope`; navigation destinations accept a path or scope. `useChoice(name)` resolves the current use. Employment’s local adapter, Cloud’s prefix/choice-ID scans, profile prefix scans and Resource’s duplicated bind/view arguments are gone. | Hosts still assign scopes to pages, choose destinations/reveal fallback and compose validation into the form boundary. Custom presentation still decides how its control accepts options and how feedback/retry appear. |
| **Requirements and actions: bounded decision complete.** | `FormScope` deliberately names error paths rather than inventing another rule evaluator. Profile page presentation, Continue, correction and synchronous indicators share the same scopes and Zod schema. Cloud scopes share the same choice evidence used by final submission; the host retains Production applicability/fallback. Infrastructure retains application-owned plan readiness. | Completion for synchronous examples remains a host projection of the current schema. Async checking indicators, general applicability, page-local conditions and cross-page rules need another concrete use before a shared contract is added. |
| **Authoring comparison recorded.** | Across all 18 runtime/example modules touched by the Parts 5–6 follow-ons, the checked-in baseline has 1,159 physical lines and the current implementation has 1,378. Tests, docs and source-panel metadata are excluded. The gain is fewer independently maintained connections and typed local-name resolution, not fewer total lines. | Continue comparing complete changes with ordinary RHF/shadcn. Do not infer an overall productivity claim from relocation or path-count reduction. |

These are the recorded Parts 5–6 results after the bounded extraction. The deferred topics below are not additional commitments for this iteration. Updating a source panel or extracting another hook does not, by itself, close an authoring gap.

## Part 5 — Rendering

### Implemented foundation

| Area | Current contract | Evidence / reference |
| --- | --- | --- |
| Fields and custom controls | `Form` provides RHF context. `Field` selects a connected control from a typed map or wraps a connected child; an explicit `control` can select another runtime. Adapters attach value/change/blur/ref, labels, errors and focus to the actual control. | [Control integration](../packages/react/src/definitions/create-formulate.tsx), [integration tests](../tests/primitives.test.tsx). |
| Dependent choices | Field `choices` metadata owns local inputs, typed services and membership policy. `Definition.useChoiceForm({ services })` installs recursive bindings and Form freshness; the lower-level hook handles dynamic repeated bindings. `useChoice(name)` supplies the current local view to reusable presentation. | [Package API](../packages/react/README.md#dependent-choices), [runtime tests](../tests/choice-form.test.tsx). |
| Inactive pages | React Activity preserves editor state and DOM while pausing effects. The RHF runtime and choice loading/validation live outside page boundaries. The Select adapter handles native bridge reconnection without clearing retained selections. | [Lifecycle tests](../tests/primitives.test.tsx), [hidden dependency tests](../tests/choice-form.test.tsx), [control regression](../tests/shadcn-controls.test.tsx). |
| Local definitions | `defineForm` and `defineSection` combine field schemas, editing defaults and presentation, recursively. Definitions are created at module scope and own no live values. Schema customization can change parsed output while preserving editing types. | [Definitions](../packages/react/src/definitions/define-form.tsx), [package guide](../packages/react/README.md). |
| Section binding | `bindSection(name)` captures a declared use for rendering and workflow paths. `Section.bind({ id, bindings })` captures an explicit/repeated use for Bind, choices, scopes and local-name resolution. Local fields, subsections, watch and trigger helpers resolve within the mounted use; validation stays installed by the host. | [Definitions](../packages/react/src/definitions/define-form.tsx), [section tests](../tests/sections.test.tsx), [Employment reuse](../tests/employee-workflows.test.tsx). |
| Layout and presentation | Form, Page and Section accept replaceable layouts. Plain layout wrappers introduce no data paths. Definition presentation can be overridden per use without changing its rules or defaults. Wrapper props and control props remain distinct. | [Layout scenario](03-scenarios/responsive-layout.md), [building-block taxonomy](04-building-blocks.md). |
| Editable shadcn UI | Source-installed controls, layouts, actions and navigation use local shadcn components and theme classes. The runtime package has no Tailwind dependency. Registry generation and a separate consumer installation have been checked. | [Registry development](registry-development.md), [distribution boundaries](04-registry-distribution.md). |
| Reviews and repeated editors | Reviews read existing values without registering another editor. Repeated Resource sections use RHF `useFieldArray` and `Resource.Bind`; no repeat primitive was needed. | [Multi-page scenario](03-scenarios/multi-page-form.md), [Infrastructure](03-scenarios/infrastructure-provisioning.md). |

Small forms can use schema-first JSX or optional definitions without adopting pages or workflow configuration. `Fields` renders declared member order; custom JSX controls placement. There is no arbitrary schema introspection or scanning of rendered children to discover rules.

### Remaining rendering decisions

Dependent behavior now survives nested reuse and unmounted/replaced editors because binding and validation belong to the form runtime. Custom presentation reads its current local choice view, but Formulate does not automatically inject options or prescribe feedback/retry UI: the configured control contract does not promise a common options prop. The following capabilities remain unproven and are **deferred until a concrete use requires them**:

- Structured editing values and compound pickers, including their focus and accessibility obligations. Current adapters cover text, numbers, booleans and string choices.
- Additional styling slots, heading-level conventions and portal-specific integration.
- Reusable review rendering, including redaction and review of a particular snapshot.
- Portable/external definitions, runtime capability validation and rendering arbitrary schemas.

Public registry hosting, release compatibility and v0 consumer verification are separate distribution work. The current checks also do not constitute a cross-browser or assistive-technology audit.

## Part 6 — Workflow

### Implemented shared mechanics

| Area | Current contract | Evidence |
| --- | --- | --- |
| Scoped progression and final submission | `Form.navigation` supplies an action/visit ID, explicit fields or a shared `FormScope`, and `onValid`. Continue and Enter use that guard. Final submission validates the whole schema and supplies parsed output; parsing does not overwrite editing values. | [Form](../packages/react/src/form/form.tsx), [navigation tests](../tests/navigation.test.tsx). |
| Correction and focus | `useFormNavigation` maps an explicit field or ordered scope to host-owned pages and optional synchronous reveal callbacks. A newer navigation replaces pending focus; focus runs after the destination is revealed. Bound uses resolve local names and first focus without exposing their internal paths to hosts. | [Navigation hook](../packages/react/src/form/use-form-navigation.ts), [Employment tests](../tests/employee-workflows.test.tsx). |
| Pending actions and freshness | React transitions track pending checks/actions through their callbacks. Form prevents duplicates and suppresses obsolete callbacks. Value edits, reset, action/scope changes and unmounting invalidate pending checks. Choice-aware forms install their evidence revision automatically; other external evidence can still supply or combine an explicit getter. | [Action tests](../tests/navigation.test.tsx), [service-replacement test](../tests/choice-form.test.tsx). |

Two limits matter when using these mechanics:

1. **A page scope filters error paths.** The resolver still evaluates the full schema, subject to Zod's refinement rules. Passing a scope gives no full-form payload or independent completion result. Synchronous tab completion is calculated in application code.
2. **Cancellation suppresses callbacks.** A pending resolver can still finish and write RHF errors. Form does not abort that work or reconcile an application callback that has already started. The external revision getter must read a live source and change for each relevant evidence lifetime, even when the input returns to the same value. Use `shouldFocusError: false` when coordinating focus through navigation.

### Complex-workflow evidence

The original order was complete page reuse, then branching with async choices, then repeated sections and draft restoration. **All three bounded exercises now have behavioural evidence.** Dependent-choice coordination and bound-use scopes are package capabilities; workflow destinations and application policies remain local. Broader productivity acceptance is still partial.

| Exercise | What is demonstrated | What remains local or unresolved |
| --- | --- | --- |
| [Employment page in two hosts](03-scenarios/employee-onboarding.md#gate-1-complete-page-reuse) | Onboarding and internal transfer use the same EmploymentSetup page and bound Employment unit with different roots, layouts and onward destinations. Its scope drives Continue and correction without a page-specific adapter. Tests cover independent runtimes, off-screen validation, correction and exact output roots. | The host composes the schema and assigns the bound scope to a page/destination. Page-specific requirements beyond the section would need an explicit host-composed scope until another reusable contract is justified. [Tests](../tests/employee-workflows.test.tsx). |
| [Branching Cloud Deployment](03-scenarios/cloud-deployment-wizard.md#gate-2-branching-with-dependent-async-choices) | Primary and Recovery bound uses render their sections, supply local choice views and compose the Targets action/correction scope. The definition installs its runtime from services. Change Account while Regions load; reject obsolete responses; remove Production; return with retained values; handle retry and submit only applicable output. | DeploymentTarget owns its region dependency and membership policy; the host supplies services and branch fallback. Obsolete regions are retained but cannot pass current membership; inactive Production values leave validation and output. These remain explicit host/schema policies. [Tests](../tests/cloud-deployment.test.tsx). |
| [Repeated Infrastructure resources and drafts](03-scenarios/infrastructure-provisioning.md#gate-3-repeated-sections-and-draft-restoration) | Each Resource bound use carries its durable ID, current field map, Bind presentation, local choice view and correction path. Reorder/delete/insert preserve survivors; late responses cannot attach to replacements. Draft and plan freshness guarantees remain. | RHF supplies arrays/reset; the application supplies durable IDs, storage, compatibility and plan acceptance. Correction and binding resolve an ID to its current index because the array owns ordering. Restore refreshes choice evidence and invalidates plans, even for identical values. [Tests](../tests/infrastructure.test.tsx). |

Supporting examples establish cross-field schema rules, hidden-but-applicable settings, conditional Address validation, delivery derived from billing, and synchronous tab completion. Their detailed sequences remain in the [scenario catalogue](03-scenarios/README.md). They are not separate unfinished implementation tasks.

### Ownership and remaining workflow decisions

RHF owns editing values, array operations and reset. Zod schemas own validation. Formulate connects bound field scopes to actions and correction. Applications own services and durable execution; the host chooses destinations, applicability and branch policy. Reusable fields and sections carry local schema rules, dependencies, membership requirements and resolved use paths.

| Topic | Current disposition |
| --- | --- |
| General applicability, readiness and completion | **Bounded decision: keep host/schema-owned.** Current applicability changes the selected schema/output and available pages; current synchronous completion projects the same schema issues through shared scopes. External plan readiness stays with the application. Add no scheduler, graph language or `definePage` API until a reusable page condition or async completion consumer demonstrates a missing contract. |
| Logical references independent of paths | **Deferred broader contract.** Repeated resources already distinguish application IDs, RHF UI keys and current index paths. Cross-page logical references and general dependency diagnostics are not implemented. |
| Async reveal and route integration | **Deferred integration work.** Synchronous reveal and a host-owned unavailable-page fallback are demonstrated; router and suspended-editor coordination are not. |
| Server rejection and requests for further input | **Deferred handoff design.** Submission currently supports generic failure/retry. Mapping server errors to fields and assigning responses to the correct attempt still need a contract. |
| Autosave and draft migrations | **Application policy, with future integration questions.** Manual save/restore is demonstrated. The application chooses cadence, permitted snapshot fields, storage, migrations and conflict policy. These are not missing core persistence features. |
| Durable execution and agent consumers | **Later product work.** Applications own backend execution and must verify plans at execution time. General orchestration adapters, agent-facing context and human–agent reconciliation are not part of this bounded slice. |

## Course corrections retained

| Earlier assumption or observed problem | Current decision | When to revisit |
| --- | --- | --- |
| The original small-form budget assumed inline-only authoring. | **Accepted adjustment:** optional definitions colocate schemas, defaults and presentation. Schema-first composition stays available; defaults and control choices remain explicit. | A small form is forced to adopt workflow machinery, or a reusable unit requires duplicated declarations. |
| Complete page reuse might require a page-definition API first. | **Superseded in two stages:** ordinary React composition first proved EmploymentSetup reuse; the later bound-use contract then removed its local adapter. No `definePage` was added. | Page-local requirements beyond composed bound sections demonstrate a missing shared responsibility. |
| Shared choice helpers still required each host to reconstruct local dependency wiring, install a stable form binder and address views by host ID. | **Extracted:** definition choice integration now carries local input/membership rules, installs its runtime from services and supplies local views to presentation. Multiple loaders, generic choices, nested/repeated uses and transformed outputs are covered. Services, branches, drafts and plans remain application-owned. | A control-neutral options/feedback adapter or another concrete dependency shape demonstrates a missing shared responsibility. |
| The Employment page adapter and several hosts rebuilt section paths for rendering, guards, correction, completion or choice views. | **Extracted without a page API:** declared and explicit bound section uses expose one typed path/identity contract; `FormScope` connects it to actions and correction while page destinations stay application-owned. Profile and Cloud compose scopes where a page includes several units. | A reusable page adds obligations beyond its bound sections, or async completion needs a shared state contract rather than current action-time validation. |
| Passing behavior tests or shrinking host hooks was treated as sufficient authoring progress. | **Bounded improvement, remaining gaps explicit:** the [generalisation comparison](generalisation.md#authoring-comparison) and current 1,159 → 1,378 affected-module count show fewer independent path/identity connections alongside more total source. No overall speedup against manual RHF/shadcn has been measured. | Use the same complete accounting for later workflow experiments. |

Keep course corrections here when evidence changes the approach. Routine implementation history belongs in Git. New scenarios should follow a resolved acceptance decision or a documented change of scope, rather than compensate for an unresolved authoring problem.

## Verification and document maintenance

The last code verification passed `pnpm check`: **94 tests**, TypeScript, registry generation, and package/example builds. Tests include bound rendering/scopes, local choice views, automatic choice-evidence freshness, section-root gating with leaf correction, stale scoped/final checks, independent service replacement, Enter and duplicate previews, account changes during plans, retained branch values and draft restoration. Choice coverage checks nested reuse, moved error paths, structured inputs, numeric options and transformed output; type fixtures reject invalid dependencies, policies, services and bindings. Activity coverage checks local/DOM state retention, effect reconnection, hidden dependency changes and RHF reset; scoped/final Actions retain uncontrolled inputs. Earlier browser walkthroughs exercised page reuse, branch removal, and resource reorder/save/reload/restore.

The generated core registry item also compiled independently from its 19 delivered source files. The example build reports a non-blocking Vite chunk-size warning.

The [example code panels](../examples/react/src/example-code.ts) display whole source modules by responsibility, including shared helpers and their `@formulate/core` delivery. That keeps the authoring cost inspectable.

When implementation changes, update the affected status, evidence link and remaining decision in place. Keep one current verification summary. Label proposals and local experiments explicitly, and update the affected scenario if its guarantee or policy changes. Detailed API instructions and installation steps stay in their linked guides.
