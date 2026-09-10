# Part 3 — Mental Model Pressure Tests

These optional checks challenge the [mental model](03-mental-model.md) against the [seven hero scenarios and focused sketches](03-scenarios/README.md). Each describes a change the model must accommodate and the outcome a later implementation must prove. They are proposed acceptance cases, not passing runtime tests or a settled API.

## Adversarial checks

### 1. Library reuse must not share live state

Use CostCentre twice for requesting and billing, with different values, labels, organisations, errors, and pending lookups. Updating one use must not affect the other or mutate the library definition. A fresh form has its own initial state. Shared services or caches must not accidentally share selections or errors.

### 2. A field boundary cannot be inferred from its markup or JSON shape

A DateRange with two controls and one object value remains one field contract, including end-date errors. Account and Region composed in a section remain independently bound fields when split across pages. The declared contract determines the boundary. Writable fields bound to both `period` and `period.end` conflict; section bindings merely route children and introduce no competing owner.

### 3. Reusing a section twice must preserve its internal wiring

Use DeploymentTarget for primary and recovery targets. Change the primary account during pending region lookups; deliver responses out of order. Only results for the current account and intended use may update its options. Recheck its selected region and the form's distinct-target rule; recovery remains independent. External inputs are explicit. Part 6 must settle whether obsolete selections clear or remain invalid.

### 4. Presentation changes must not rewrite the data contract

Add a grid, split Account and Region across pages, show them in review, and replace a picker with compatible custom React. Identities, bindings, dependencies, and validation remain stable, including off-screen. Account can be ready before Region; final submission checks both. Review adds no registration or state copy. Section applicability does not follow the visible page. Simultaneous editable views need deliberate binding support; the baseline review is read-only.

### 5. Reusable pages must not carry a hidden dependency on their original route

Reuse Employment in onboarding and employee-change forms, with different following pages. Local fields and readiness rules remain reusable; each host supplies external inputs and onward navigation. Splitting the page preserves field identities and bindings. An ordinary wizard must not require a general-purpose graph language.

### 6. Repeats must survive reorder, deletion, and delayed responses

Reorder LineItems, delete one, and insert another at its old index while lookups are pending. Values, errors, references, and focus follow stable item identities; deleted-item responses are discarded. Reconcile server errors against the submitted attempt's item mapping, never the current index. A UI key alone does not establish a server identity protocol.

### 7. Nested conditions must compose predictably

Complete a production-only section, switch to development, then return with a different account. A child cannot apply while its parent does not. Under explicit retain-and-exclude policy, inactive values remain stored but leave payload and requirement scopes. Reactivation rechecks them against current inputs. Hiding a panel for presentation alone does not imply this policy.

### 8. Rule composition must not silently discard validation

Combine library validation, an instance constraint, and a section cross-field rule. Change the label or compatible renderer; add another constraint. All applicable rules survive in their action scopes. Contract changes and overrides must be deliberate; incompatible configurations need useful diagnostics. Parts 4–6 must define composition semantics rather than inherit accidental object-property overwrite.

### 9. A simple form and a scoped save must stay simple

Keep inline login within the [authoring budget below](#25-the-small-form-must-have-an-explicit-authoring-budget), including when adding layout. In settings, add Profile-only save: its declared requirements, dependencies, and included values govern the action. Unrelated incomplete drafts do not block it. Whole-form submit remains a separate scope; neither scope is inferred from DOM ancestry or the visible tab.

### 10. Submission and recovery must tolerate changed reality

Submit a deployment in development mode, edit during the request, then receive an old rejection. The attempt's snapshot excludes retained production-only data and never changes with later edits; its rejection cannot certify a newer value as invalid. Restore a draft after options or permissions change: recheck requirements and permitted actions. Backend work may continue after acceptance. Response reconciliation and draft compatibility need later contracts.

### 11. Meaning must survive a change of consumer

Run the deployment interaction through default UI, custom React, and an assisting agent. Move primary Region between a grid, section, page, and Review: the agent still identifies that use, distinct from recovery, and can inspect its purpose, current choices, requirements, state, and permitted actions. Let the agent read context, then let a person change Account or Region before it answers. Recheck the proposed answer against current dependencies, reconcile conflicting edits without silently overwriting newer work, and return updated context. All consumers use the same rules, within application authorisation; include server-required further input. This tests the Part 9 hypothesis without committing an agent runtime to Version 0.1.

### 12. Routes and tabs must represent the same logical pages

Switch Account, Region, and Review from tabs to routes. Exercise Back, direct URLs, tab clicks, and UI unmounts. Identities, values, errors, and completion persist; every entry point respects the chosen navigation policy. Access does not prove completion. Full document navigation that destroys the runtime requires draft restoration and rechecking. Free navigation is a policy choice, not an automatic consequence of using tabs.

### 13. Layered completion must respect scopes and global rules

Split DeploymentTarget across Account and Region pages. Account may be Complete while its section and form remain Incomplete. Later, every page may pass locally while the form's distinct-target rule fails; expose that reason and a correction destination. Splitting pages must not lose section rules. Form completion includes unique applicable field, section, required-page, and global requirements, rather than just combining page badges.

### 14. Completion must use current evidence, not interaction history

Valid prefills and optional blanks accepted by their contract may be Complete before a visit. Required blanks, unevaluated requirements, and necessary pending checks cannot. Change a dependency during a check: old success must not restore completion. Unrelated suggestion lookups do not revoke it. Touched, visited, pending, and complete remain distinct; untouched incompleteness need not immediately display an error.

### 15. Branches, review, and repeats must not distort progress

Disable a production branch, add or remove repeated resources, and present a field again in review. Inactive scopes become Not applicable or leave applicable progress; a now-unavailable current page needs an available destination. Repeats change counts by identity; repeated views add no requirements. Active empty scopes may be Complete without claiming required work. Hiding navigation alone removes no obligations. Newly applicable requirements can decrease progress.

### 16. Review acknowledgements and save acknowledgements have different lifetimes

Acknowledge a review summary, then change relevant data. Its acknowledgement no longer satisfies the updated requirement; revisiting cannot restore it. Edit Profile while its save is pending: success acknowledges only that snapshot, leaving newer edits and unrelated drafts unsaved. Neither acknowledgement certifies newer validation or backend completion. See [state and completion](03-state-and-completion.md).

### 17. Ad hoc fields must be ordinary fields

Start with inline Input, Select, and Switch fields. Add sections or pages, then extract one field into a library definition. Preserve its identity, binding, control contract, rules, state, references, and completion behaviour. Extraction must not rename payload data or duplicate registration. Inline and library fields remain interchangeable authoring paths; neither is a prerequisite for the other. Presentation props such as placeholders do not imply validation.

### 18. A local condition must resolve the intended instance

Connect nearby content to `showAdvanced` in a section, page, or form. Move the UI, extract the group, and reuse it twice: each use still reads its own checkbox without full-path lookup or a registry. Extract only the controlled content instead: its caller connects an explicit, live `expanded` input. Matching names in another form cannot interfere; routes and DOM ancestry do not resolve references.

### 19. A reference does not choose the condition's effect

Hide the [advanced options](03-scenarios/advanced-options.md), then invalidate a retained value and submit. Disclosure preserves requirements and included configuration; payload mapping excludes its UI checkbox. A correction action must reveal invalid hidden fields before focus, with the controller reachable. A separate enablement condition changes applicability and inclusion only through explicit policies. Neither silently changes page availability. Reading a reference does not implicitly copy, clear, or write its value.

### 20. Missing references, inactive values, and mutual reads differ

A condition requiring an active affirmative answer checks both applicability and value. Required unresolved dependencies cannot silently become false or prove completion; nonexistent references need diagnostics unless absence is supported. Deleting a repeated item never retargets its references by index. Deterministic validators may read each other's stored values; unsupported computed-value or completion feedback loops need actionable diagnostics. Tracking details belong in Part 6; see [relationships](03-references-and-relationships.md).

### 21. Layout configuration must target the intended surface

In the [responsive example](03-scenarios/responsive-layout.md), change the grid, a field's span, and an Input prop independently. Container CSS arranges children; placement affects the outer presentation; supported control props reach the primitive. A plain row wrapper adds no semantic scope. Identities and rules remain stable. If a later Section spans pages, each page arranges its own content; the Section's default grid cannot position controls across unrelated pages.

### 22. Responsive arrangement must retain a meaningful interaction order

Collapse a two-column grid, then intentionally reorder name and email. Responsive changes must preserve meaningful reading and focus order. Intentional reordering changes the rendered sequence without changing field identity or values; CSS positioning alone cannot establish that sequence. A second positive-tabindex list is unnecessary. Composite controls keep their internal keyboard behaviour. Verify with keyboard and assistive technology; see the [layout references](03-layout-and-presentation.md).

### 23. Focus requests must survive layout changes without stealing focus

Resize or finish a lookup while typing: keep focus. Request correction of a hidden field on another page: navigate, reveal, mount, and ask its renderer to focus the appropriate control. Navigate away before reveal finishes: discard the obsolete request. Unavailable targets need a reachable fallback. Tab activation respects the tabs primitive's conventions. Logical focus requests are not CSS selectors, automatic text selection, or a second tab-order graph.

### 24. Styling hooks must not become field identity or state authority

Style two reused sections, a read-only field review, and a portalled picker. Shared classes follow normal CSS matching without sharing state; local placement targets its intended surface. Control IDs and accessible associations remain unique. State hooks reflect results; adding a class changes no requirement. Portals use supported primitive interfaces. Replacing a control must preserve binding, events, accessible associations, and focus integration; unsupported props need adaptation.

### 25. The small form must have an explicit authoring budget

Implement the [two-input baseline](03-scenarios/simple-form.md): no authored Pages, Sections, library definitions, registry entries, separate references, workflow declarations, payload mapper, or duplicate presentation list. Declare each field key and rule once; ordinary integration supplies field/form state, errors, validation, and completion. Add layout, a condition, reuse, a group rule, and pages independently. Each adds only its own requirements. Measure concepts and independent edits in real code, not pseudocode length alone.

### 26. Optional structure must be removable without a form-mode migration

Return a sectioned, paginated form to direct fields. Preserve field identities, bindings, state, and references. Rehome still-needed rules, review acknowledgements, conditions, retention/inclusion policies, and inherited defaults; remove obsolete navigation and scope summaries. No synthetic page must be named, visited, or completed. Submission and form completion continue normally. Adding boundaries must not silently nest data; removing them must not silently remove domain requirements.

## What still needs proof

The simple-form and twice-used Address slices now have bounded executable evidence in the [implementation anchor](05-06-rendering-and-workflow.md). The anchor records the ordered [complex-workflow sequence](05-06-rendering-and-workflow.md#complex-workflow-evidence): complete page reuse (check 5), branching with async dependencies (checks 3, 7, 14, 15, and 23), then repeats and draft restoration (checks 6 and 10). The three bounded gates now have executable evidence; broader general-purpose contracts remain unproven. Other checks above remain reference acceptance cases, not a requirement to implement everything in the next slice.

Turn each selected sequence into integration tests and review its authoring cost against ordinary RHF/shadcn composition. Require useful typing, reuse without rewriting internal paths, and presentation changes without duplicated rules. If these fail, record which assumption changed and simplify or narrow the contract before moving to the next gate. General route adapters, partial saves, and server reconciliation remain later checks; another demonstration cannot stand in for resolving a failed gate.
