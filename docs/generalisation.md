# Generalisation — implementation result

**Status: implemented and revised to use existing primitives first, September 2026.** Cloud Deployment and Infrastructure consume definition-owned dependent choices from `@formulate/react`. React Activity owns inactive page lifecycles, transitions own action pending state, and AbortSignal identifies obsolete requests. The subsequent [Parts 5–6 assessment](05-06-rendering-and-workflow.md#outcome-and-remaining-boundaries) added bound section scopes and correction, then removed the remaining definition-form binder/revision wiring and host-owned choice-view lookups without adding a page or requirement engine. The [design principles](02-design-principles.md) remain the acceptance standard; this bounded extraction does not establish an overall productivity claim.

## Completed slice

- [x] **Extract request mechanics into the package.** Private [requests](../packages/react/src/choices/request.ts) and [lifetimes](../packages/react/src/choices/store.ts) own loading, retry, abort, obsolete-result rejection and evidence revisions. `defineChoice` holds application wording, dependency inputs and selection policy separately.
- [x] **Connect dependent choices to reusable definitions.** Fields accept `choices`; definitions recursively expose `bindChoices`. `Definition.useChoiceForm({ services })` installs a stable binder and evidence freshness, while local `useChoice(name)` resolves the current section use for custom presentation. The lower-level [runtime hook](../packages/react/src/choices/use-choice-form.ts) remains for dynamic repeated bindings; RHF still owns editing values.
- [x] **Migrate Cloud Deployment and Infrastructure.** Primary/recovery targets inherit the same [region declaration](../examples/react/src/declarations/cloud-deployment.ts). Repeated [Resource](../examples/react/src/declarations/infrastructure.ts) uses supply stable IDs, shared bindings and external context. The three former example helpers have been removed. Code panels show the full package implementation, including definition binding.
- [x] **Verify behaviour and authoring cost.** Existing scenario coverage remains, and new tests cover mixed loaders, numeric choices, structured request inputs, transformed output, nested reuse, independent service replacement and moved error paths. Type fixtures reject incompatible policies, dependencies, bindings and services. The before/after accounting below includes shared helpers.
- [x] **Revisit the implementation using existing capabilities first.** Activity retains inactive page and tab state; React transitions replace manual pending state. AbortSignal replaces the request generation counter and active flag. Tests cover hidden dependencies, effect reconnection, uncontrolled input retention and the existing select adapter.
- [x] **Record the result and return to Parts 5–6.** Exports, restrictions and delivery are in the [package guide](../packages/react/README.md#dependent-choices). Rendering/workflow decisions now use this evidence.

## Existing capabilities and demonstrated gaps

| Responsibility | Existing capability used | Why any coordination remains |
| --- | --- | --- |
| Inactive editors | React [`Activity`](https://react.dev/reference/react/Activity) in `Page` and tab panels preserves React state and DOM while cleaning up effects. | Activity pauses hidden subscriptions and effect-based loading. `useChoiceForm` and the schema therefore live in the surviving form host, outside page boundaries. Hidden dependency changes must still load and block invalid submission. |
| Checking and saving indicators | [`useTransition`](https://react.dev/reference/react/useTransition) owns pending state through validation and awaited callbacks. Callback state updates after `await` enter a nested transition. | React does not define validation scopes, correction destinations, or whether changed values/evidence invalidate a check. Existing action freshness checks and an immediate duplicate guard remain. |
| Choice request replacement | The platform's `AbortController`/`AbortSignal` marks each attempt. Old callbacks read their own signal before publishing, even if the service ignores cancellation. | A small per-use store associates current evidence with durable IDs, rules, loaders and editing paths. It owns no field values. `useSyncExternalStore` connects this external evidence to React. |
| Values, errors and parsing | RHF owns values, reset, arrays and resolver errors; Zod owns schema parsing. | The choice adapter adds current membership evidence at editing paths. It does not use parsed output as dependency input, so output transformations cannot silently change bindings. |

[`useActionState`](https://react.dev/reference/react/useActionState) is useful when an Action returns state that the UI needs. Here RHF already owns values/errors, and the choice loader requires superseding old inputs: `useActionState` queues dispatched Actions in order. Adding another result state would duplicate an existing authority without removing the evidence checks. The selected React primitive is `useTransition`.

A native [`form action`](https://react.dev/reference/react-dom/components/form) resets uncontrolled inputs after success. That conflicts with retaining RHF editing values through Continue and final success. `Form` therefore keeps its submit handler, starts a React transition and exposes its pending status through the existing context. Applications explicitly call RHF reset when their workflow requires it. The uncontrolled-input regression test checks this contract.

The installed Radix Select exposed a concrete Activity compatibility gap: reconnecting its native form bridge can report an empty change and overwrite a retained choice. The local Select adapter ignores that notification because Radix items cannot have empty values; RHF `setValue` and `reset` still clear the controlled selection. The [adapter test](../tests/shadcn-controls.test.tsx) checks selection, hiding/revealing, submission and reset while hidden. This is scoped integration code for an observed deficiency; the Radix component itself is unchanged.

Activity requires React **19.2 or later in the 19.x series**, reflected in package peers and registry metadata. No additional library was introduced. In particular, this implementation has no TanStack Query dependency.

## Resolved assumptions and ownership

| Previous assumption | Implemented contract |
| --- | --- |
| One loader per form | Each field rule selects its loader from typed services. Replacement cancels only uses of that loader; the form-wide evidence revision invalidates pending actions. |
| String input and `{ value, label }` options | Input, selection and options can have different types. A declaration supplies its input key and synchronous membership policy. The default `ChoiceLoader` type remains convenient for the examples. |
| Validation sees parsed paths unchanged | Choice bindings capture editing values before parsing. Schema parsing runs once; membership errors use editing paths even when output renames or removes fields. |
| Host selects each field's dependency and validation path | The field's declaration owns its local dependency and policy. Recursive definition binding supplies paths. Repeated uses supply one typed map shared with editor binding and stable item IDs. |
| Field mount owns work | The form owns request lifetimes. Activity hiding or editor unmounting does not remove a use; removal from the bound list does. Restoration clears evidence before RHF reset, including identical restored values. |

Applications still own branch destinations, correction policy, durable IDs, draft storage/compatibility, plan acceptance and execution. RHF owns editing values, array operations and reset. Layouts/actions/navigation retain their existing registry items. The later bound-use slice removed the Employment adapter while leaving its destinations with each host.

## Authoring comparison

The baseline is the checked-in implementation immediately before this extraction. Counts are physical source lines, including blanks/comments. Tests, docs, demo services and source-panel metadata are excluded on both sides. Existing definition integration and the revised Form, Page, tab and control modules are counted in full, not just their new lines.

| Source responsibility | Before | After |
| --- | ---: | ---: |
| Two host hooks | 164 | 160 |
| Two declarations | 63 | 90 |
| Two compositions | 122 | 121 |
| All choice helpers (example or package) | 136 | 176 |
| Definition factory and public index | 241 | 269 |
| Form, Page, tabs and control adapters | 316 | 325 |
| **Total** | **1,042** | **1,141** |

At completion of this extraction, the revised implementation grew by 99 lines against the pre-extraction baseline. The first extraction counted 824 lines across its narrower scope; across that same scope the revision used 816. Including the additional lifecycle/action/control changes left the second pass one line larger overall than the first. The later Parts 5–6 work has its own current accounting in the [implementation anchor](05-06-rendering-and-workflow.md#outcome-and-remaining-boundaries). Using existing primitives is a maintenance decision, not a size-reduction claim. The definition integration removes independently maintained relationships when a reusable unit changes:

| Operation | Previous host/helper work | Current work |
| --- | --- | --- |
| Reuse Target under another root | Declare the section and also extend the host's target list/region-path selector, in addition to presentation/navigation. | Declare the section use. Recursive binding discovers its account/region relationship; presentation/navigation remain explicit. |
| Change the local region dependency | Change the declaration and the host selector's `accountId` read. Every separately maintained host selector must agree. | Change the region declaration’s `getInput` callback once; both target uses inherit it. |
| Change a region membership requirement | Change the shared request's hard-coded policy, affecting unrelated choice fields, or introduce a policy escape hatch and connect hosts to it. | Change the region declaration’s `validateSelection` callback once. Both targets inherit it; machine sizes keep their own policy. |
| Reuse Resource at another index/root | Maintain choice ID, size error path and dependency-input construction in the host, alongside editor bindings. | Supply stable ID, the binding map used by editors and account/region services. Resource owns the target field and input construction. |
| Add a different loader/option shape | Extend or fork the single-loader/string-specific helpers and parsed-value selector. | Attach another typed rule; supply its service. No new coordinator. |

Compared with ordinary RHF/shadcn, applications still need controls, schema composition and service implementations. Manual RHF can use the same React primitives and implement the same complete-unit abstraction. The remaining code connects request lifetimes, definition bindings, validation evidence and action freshness. The evidence supports removal of those host-maintained connections, not a measured speedup or fewer total lines than every possible manual implementation.

## Authoring gaps revisited

The follow-on closes two repeated connections: a definition-owned choice form now calls `Definition.useChoiceForm({ services })` without authoring a stable binder or passing choice evidence to Form, and `Definition.useChoice(name)` reads the typed view for the current declared or explicitly bound use. Plain `Definition.useForm()` remains schema-only so rendering a form does not silently start services.

The remaining boundaries are:

- Custom presentation still chooses how to supply options, feedback and retry. `Fields` does not automatically inject an `options` prop because Formulate's control contract does not assert that every compatible component has one or prescribe feedback UI.
- Repeated uses now capture stable identity and the current member map once with `Section.bind`, then share that use with choice behavior and `Section.Bind`. The application still maps a durable item ID to its current array index.
- Conditional applicability is expressed by selected scopes, available pages and application schemas. The Parts 5–6 assessment kept general completion, readiness and applicability host-owned until a concrete reusable condition demonstrates a shared contract.
- Dynamic repeated hosts still use the lower-level binder because their current uses come from an application-owned array; that binder needs a stable callback. All choice dependencies need complete editing defaults and explicit request keys. There is no general dependency engine, caching or deduplication.
- Services that ignore abort are safe against obsolete publication, but arbitrary async schema results can still update RHF errors after cancelled actions.

## Delivery and verification

`defineChoice` and the lower-level `useChoiceForm`, plus the choice runtime/contract types, are package exports. `useChoiceForm`, `useChoice`, `bindChoices` and bound sections belong to definitions; bound-use and `FormScope` types remain exported from the same core source. Request/store constructors are private modules. `@formulate/core` includes all 19 relevant source modules in its manifest; package builds emit the same implementation and declarations. No new package, UI registry item or external dependency was added. Domain declarations and picker presentation remain editable application source.

Verification: `pnpm check` covers TypeScript, behavior tests, registry generation, and package/example builds. The [implementation anchor](05-06-rendering-and-workflow.md#verification-and-document-maintenance) records the latest completed run and the generated core's independent compilation.
