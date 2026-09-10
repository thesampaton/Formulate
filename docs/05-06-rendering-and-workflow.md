# Parts 5–6 — Rendering and Workflow

**Current position, September 2026:** the rendering foundation and basic form actions are implemented. The three complex-workflow examples behave as intended within their tested scope. **The remaining gap is authoring:** reusable fields and sections do not yet carry enough dependent behaviour to avoid substantial host wiring.

This document records current support, remaining decisions and course corrections. API usage belongs in the [package guide](../packages/react/README.md); detailed acceptance sequences belong in the [scenarios](03-scenarios/README.md). The [product vision](01-product-vision.md) and [design principles](02-design-principles.md) remain the intended direction.

## What still needs doing

Complete the short [generalisation plan](generalisation.md) first: extract dependent-choice capabilities and migrate Cloud Deployment and Infrastructure. Then use that evidence to revisit the rendering/workflow questions below. The page-reuse, branching and draft-restoration demonstrations are already built.

| Priority | Work remaining | Acceptance criterion |
| --- | --- | --- |
| **In generalisation: carry dependent behaviour with the reusable unit.** | Establish how a choice field or section owns its dependency input, request lifetime and membership requirement. Today [useChoiceForm](../examples/react/src/hooks/use-choice-form.ts) shares the mechanics, but each host still supplies the field-path/dependency selector. | Reuse a dependent choice or section under another root or in repeated items by supplying its binding and service. Changing its local dependency or requirement changes the reusable unit once, without rebuilding its internal wiring in each host. |
| **After generalisation: revisit requirements and actions.** | Determine the smallest shared contract for current readiness, applicability and correction. Page guards currently filter schema-error paths; page completion and branch fallback remain example policies. A general requirement engine has not been justified. | Continue, Review, correction and submission use the same applicable requirements and current evidence. Layout changes, removed pages, retained values and delayed responses preserve the existing guarantees. Record which decisions stay with the host. |
| **Before accepting the authoring contract: compare the cost.** | Compare the same reuse and change operations with ordinary RHF/shadcn composition. Include all shared helpers, bindings, rules and coordination in the accounting. | Show fewer independently maintained connections and simpler changes, while preserving the existing behaviour tests and the small-form path. If the gain is insufficient, narrow or revise the contract. |

These are the remaining acceptance questions for Parts 5–6; the generalisation plan defines the immediate extraction scope. The deferred topics below are not additional commitments for this iteration. Updating a source panel or extracting another hook does not, by itself, close the authoring gap.

## Part 5 — Rendering

### Implemented foundation

| Area | Current contract | Evidence / reference |
| --- | --- | --- |
| Fields and custom controls | `Form` provides RHF context. `Field` selects a connected control from a typed map or wraps a connected child; an explicit `control` can select another runtime. Adapters attach value/change/blur/ref, labels, errors and focus to the actual control. | [Control integration](../packages/react/src/create-formulate.tsx), [integration tests](../tests/primitives.test.tsx). |
| Local definitions | `defineForm` and `defineSection` combine field schemas, editing defaults and presentation, recursively. Definitions are created at module scope and own no live values. Schema customization can change parsed output while preserving editing types. | [Definitions](../packages/react/src/define-form.tsx), [package guide](../packages/react/README.md). |
| Section binding | A declared `Parent.Section` binds that member once; local fields, subsections, watch and trigger helpers resolve within the use. `Bind` supports explicit typed maps, with validation installed by the host. | [Address declaration](../examples/react/src/declarations/address.tsx), [customer tests](../tests/customer-onboarding.test.tsx). |
| Layout and presentation | Form, Page and Section accept replaceable layouts. Plain layout wrappers introduce no data paths. Definition presentation can be overridden per use without changing its rules or defaults. Wrapper props and control props remain distinct. | [Layout scenario](03-scenarios/responsive-layout.md), [building-block taxonomy](04-building-blocks.md). |
| Editable shadcn UI | Source-installed controls, layouts, actions and navigation use local shadcn components and theme classes. The runtime package has no Tailwind dependency. Registry generation and a separate consumer installation have been checked. | [Registry development](registry-development.md), [distribution boundaries](04-registry-distribution.md). |
| Reviews and repeated editors | Reviews read existing values without registering another editor. Repeated Resource sections use RHF `useFieldArray` and `Resource.Bind`; no repeat primitive was needed. | [Multi-page scenario](03-scenarios/multi-page-form.md), [Infrastructure](03-scenarios/infrastructure-provisioning.md). |

Small forms can use schema-first JSX or optional definitions without adopting pages or workflow configuration. `Fields` renders declared member order; custom JSX controls placement. There is no arbitrary schema introspection or scanning of rendered children to discover rules.

### Remaining rendering decisions

The immediate rendering question is whether the same dependent behaviour survives reuse and replacement of its presentation; it belongs to the next acceptance step above. The following capabilities remain unproven and are **deferred until a concrete use requires them**:

- Structured editing values and compound pickers, including their focus and accessibility obligations. Current adapters cover text, numbers, booleans and string choices.
- Additional styling slots, heading-level conventions and portal-specific integration.
- Reusable review rendering, including redaction and review of a particular snapshot.
- Portable/external definitions, runtime capability validation and rendering arbitrary schemas.

Public registry hosting, release compatibility and v0 consumer verification are separate distribution work. The current checks also do not constitute a cross-browser or assistive-technology audit.

## Part 6 — Workflow

### Implemented shared mechanics

| Area | Current contract | Evidence |
| --- | --- | --- |
| Scoped progression and final submission | `Form.navigation` supplies an action/visit ID, field-path scope and `onValid` callback. Continue and Enter use that guard. Final submission validates the whole schema and supplies parsed output; parsing does not overwrite editing values. | [Form](../packages/react/src/form.tsx), [navigation tests](../tests/navigation.test.tsx). |
| Correction and focus | `useFormNavigation` maps explicit fields to pages and optional synchronous reveal callbacks. A newer navigation replaces pending focus; focus runs after the destination mounts. The host handles unmapped errors and unavailable destinations. | [Navigation hook](../packages/react/src/use-form-navigation.ts), [advanced-options scenario](03-scenarios/advanced-options.md). |
| Pending actions and freshness | Form prevents overlapping checks/actions and releases pending UI after success or failure. Value edits, reset, action/scope changes and unmounting invalidate pending checks. Optional `getValidationRevision` also invalidates callbacks when external evidence changes. | [Action tests](../tests/navigation.test.tsx), [service-replacement test](../tests/choice-form.test.tsx). |

Two limits matter when using these mechanics:

1. **A page scope filters error paths.** The resolver still evaluates the full schema, subject to Zod's refinement rules. Passing a scope gives no full-form payload or independent completion result. Synchronous tab completion is calculated in application code.
2. **Cancellation suppresses callbacks.** A pending resolver can still finish and write RHF errors. Form does not abort that work or reconcile an application callback that has already started. The external revision getter must read a live source and change for each relevant evidence lifetime, even when the input returns to the same value. Use `shouldFocusError: false` when coordinating focus through navigation.

### Complex-workflow evidence

The original order was complete page reuse, then branching with async choices, then repeated sections and draft restoration. **All three bounded exercises now have behavioural evidence.** Their local adapters and policies remain prototypes; authoring acceptance is still partial.

| Exercise | What is demonstrated | What remains local or unresolved |
| --- | --- | --- |
| [Employment page in two hosts](03-scenarios/employee-onboarding.md#gate-1-complete-page-reuse) | Onboarding and internal transfer use the same EmploymentSetup page, local requirements and guard with different roots, layouts and onward destinations. Tests cover independent runtimes, off-screen validation, correction and exact output roots. | A local binding adapter derives the page's scope and correction targets. The host composes the schema and chooses destinations. Page-specific requirements beyond the bound section have no shared contract. [Tests](../tests/employee-workflows.test.tsx). |
| [Branching Cloud Deployment](03-scenarios/cloud-deployment-wizard.md#gate-2-branching-with-dependent-async-choices) | Change Account while Regions load; reject obsolete responses; remove the current Production page through Environment; return with retained values; handle failure/retry and submit only applicable output. Request generations handle A → B → A and ignored abort. | The host declares dependency selectors and branch fallback. Obsolete regions are retained but cannot pass current membership; inactive Production values leave validation and output. These are explicit example policies. [Tests](../tests/cloud-deployment.test.tsx). |
| [Repeated Infrastructure resources and drafts](03-scenarios/infrastructure-provisioning.md#gate-3-repeated-sections-and-draft-restoration) | Reorder/delete/insert preserve surviving resources; late responses cannot attach to replacements. Incomplete drafts save and restore into a fresh runtime. Stale plans, late loads and incompatible drafts cannot authorize provisioning or overwrite newer work. | RHF supplies arrays/reset; the application supplies durable IDs, storage, compatibility and plan acceptance. Correction resolves an ID to its current index after mounting. Restore refreshes choice evidence and invalidates plans, even for identical values. [Tests](../tests/infrastructure.test.tsx). |

Supporting examples establish cross-field schema rules, hidden-but-applicable settings, conditional Address validation, delivery derived from billing, and synchronous tab completion. Their detailed sequences remain in the [scenario catalogue](03-scenarios/README.md). They are not separate unfinished implementation tasks.

### Ownership and remaining workflow decisions

RHF owns editing values, array operations and reset. Zod schemas own validation. Formulate connects validation to actions and correction. Applications own services and durable execution; the host chooses destinations and branch policy. The intended reusable unit should carry its local dependencies and requirements—that last boundary is where the authoring work remains.

| Topic | Current disposition |
| --- | --- |
| General applicability, readiness and completion | **Unresolved design boundary.** Derive the smallest needed contract from the existing examples. Do not assume it requires a scheduler, graph language or `definePage` API. |
| Logical references independent of paths | **Deferred broader contract.** Repeated resources already distinguish application IDs, RHF UI keys and current index paths. Cross-page logical references and general dependency diagnostics are not implemented. |
| Async reveal and route integration | **Deferred integration work.** Synchronous reveal and a host-owned unavailable-page fallback are demonstrated; router and suspended-editor coordination are not. |
| Server rejection and requests for further input | **Deferred handoff design.** Submission currently supports generic failure/retry. Mapping server errors to fields and assigning responses to the correct attempt still need a contract. |
| Autosave and draft migrations | **Application policy, with future integration questions.** Manual save/restore is demonstrated. The application chooses cadence, permitted snapshot fields, storage, migrations and conflict policy. These are not missing core persistence features. |
| Durable execution and agent consumers | **Later product work.** Applications own backend execution and must verify plans at execution time. General orchestration adapters, agent-facing context and human–agent reconciliation are not part of this bounded slice. |

## Course corrections retained

| Earlier assumption or observed problem | Current decision | When to revisit |
| --- | --- | --- |
| The original small-form budget assumed inline-only authoring. | **Accepted adjustment:** optional definitions colocate schemas, defaults and presentation. Schema-first composition stays available; defaults and control choices remain explicit. | A small form is forced to adopt workflow machinery, or a reusable unit requires duplicated declarations. |
| Complete page reuse might require a page-definition API first. | **Accepted for the bounded exercise:** ordinary React composition plus a checked local binding adapter reuses EmploymentSetup in both hosts. No `definePage` was added. | Repeated adapter plumbing or page-local requirements demonstrate a missing shared responsibility. |
| Each complex example rechecked schemas and managed coordination in a large local hook. | **Corrected:** shared [choice integration](../examples/react/src/hooks/use-choice-form.ts) connects request identity, dependencies and membership. Form's evidence revision replaces repeated callback parsing; Infrastructure reuses Form actions and navigation focus. Draft operations share their local pending/error boundary. | Reuse still requires hosts to reconstruct a unit's internal dependency wiring—the current next step. |
| Passing behaviour tests was being treated as sufficient progress on the authoring goal. | **Acceptance remains partial:** the two scenario hooks shrank from 230 to 164 lines, but shared helpers and the core change leave total implementation size roughly flat. There is no measured productivity win over manual RHF/shadcn yet. | Accept the authoring contract only after the reuse/change comparison above demonstrates the intended benefit. |

Keep course corrections here when evidence changes the approach. Routine implementation history belongs in Git. New scenarios should follow a resolved acceptance decision or a documented change of scope, rather than compensate for an unresolved authoring problem.

## Verification and document maintenance

The last code verification passed `pnpm check`: **85 tests**, TypeScript, registry generation, and package/example builds. Tests include stale scoped/final checks, service replacement, Enter and duplicate previews, account changes during plans, retained branch values and draft restoration. Earlier browser walkthroughs exercised page reuse, branch removal, and resource reorder/save/reload/restore.

The [example code panels](../examples/react/src/example-code.ts) display whole source modules by responsibility, including shared helpers. That keeps the authoring cost inspectable.

When implementation changes, update the affected status, evidence link and remaining decision in place. Keep one current verification summary. Label proposals and local experiments explicitly, and update the affected scenario if its guarantee or policy changes. Detailed API instructions and installation steps stay in their linked guides.
