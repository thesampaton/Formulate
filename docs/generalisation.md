# Generalisation — next implementation slice

**Status: planned. Do this before resuming the broader [Parts 5–6 work](05-06-rendering-and-workflow.md#what-still-needs-doing).** The extraction should inform those contracts through simpler authoring in the existing examples.

The aim is for a reusable field or section to carry its dependent behaviour. Its host supplies bindings and services; the library handles shared coordination. Keep the [design principles](02-design-principles.md) as the acceptance standard.

## Steps

- [ ] **Extract request mechanics into the package.** Start with [choice requests](../examples/react/src/lib/choice-request.ts) and [choice lifetimes](../examples/react/src/lib/choice-fields.ts): loading, retry, cancellation, obsolete-result rejection and evidence revisions. Separate domain wording and selection policy from the shared mechanism; keep implementation details private where possible.
- [ ] **Connect dependent choices to reusable definitions.** Reshape [useChoiceForm](../examples/react/src/hooks/use-choice-form.ts) so dependency inputs and membership requirements travel with the field or section and use the existing form runtime. Resolve its current single-loader, string-choice and unchanged-path assumptions explicitly before choosing the public API; a general-purpose dependency engine is not required.
- [ ] **Migrate Cloud Deployment and Infrastructure.** Use the same capability for primary/recovery targets and repeated resources. Remove the host wiring it replaces, and expose the actual shared implementation in the code panels.
- [ ] **Verify behaviour and authoring cost.** Preserve existing coverage for stale responses, service replacement, removed pages/items, retained values, correction and restoration. Run `pnpm check`; compare reuse and local-rule changes before/after, including shared helpers. Show which connections the host no longer maintains.
- [ ] **Record the result and return to Parts 5–6.** Document exports, ownership, restrictions and package/registry delivery. Update the rendering/workflow decisions with what the extraction established and what remains unresolved.

## Boundaries

RHF continues to own editing values. Branch destinations, draft storage/compatibility and plan acceptance stay application-owned. Layouts, actions and navigation already have registry items despite their source location under `examples`; they do not need a new package solely to change that location.

Bound section scopes and correction destinations are the next candidate to assess after this extraction. Keep the Employment adapter local unless the work demonstrates a shared contract it should use. Broader completion, applicability and workflow APIs return to Parts 5–6 with this evidence.

## Done when

Both examples consume the library capability, a reused dependent unit carries its internal wiring, and changing its local requirement changes one declaration. Existing behaviour and small forms remain intact. Moving files or shortening the host hook alone does not establish success; record any remaining authoring gap explicitly.
