# Part 3 — Mental Model Pressure Tests

This companion challenges the [proposed mental model](03-mental-model.md). The seven scenario names come from Part 9 of the original Formulate exploration prompt. Their concrete compositions and change cases below are proposed tests, informed by the [vision](01-product-vision.md), [principles](02-design-principles.md), and [design notes](design-notes.md).

This is a conceptual review. There is no implementation to execute yet. The review asks whether the model identifies the responsible parts and can express a policy with a predictable outcome without inventing another core layer. API ergonomics, type inference, and runtime correctness still require prototypes and executable tests.

## The scenario sketches

Each of the [seven scenario files](03-scenarios/README.md) contains a short pseudocode composition, changes it must survive, and a question for later API design. Start there to see the model applied. The checks below test relationships shared across those scenarios, including the cases most likely to expose contradictions.

## Adversarial checks

### 1. Library reuse must not share live state

**Given:** two uses of the same CostCentre field, bound to requesting and billing values.

**Change:** set different values, labels, organisations, errors, and lookup requests; then update only the requesting use.

**Expected:** only that use is affected. A fresh form execution starts with its own configured initial state. Neither configuration changes nor runtime updates mutate the reusable definition.

**Model decision:** definitions package contracts and defaults; instances connect each use; current state belongs to the running form. Shared immutable services or appropriately keyed caches are possible, but cannot share selection or error state accidentally.

### 2. A field boundary cannot be inferred from its markup or JSON shape

**Given:** a DateRange field with two controls and one object value; a DeploymentTarget section with independently bound Account and Region fields.

**Change:** report an error on the end date; show account and region on different pages.

**Expected:** the date range remains one field contract, including its internal error handling. The section's fields remain distinct uses with their original dependency. Neither case requires a “compound field” type.

**Model decision:** the declared integration contract decides whether an interaction is one field or a composition of fields. Object properties and visual controls are insufficient to decide this automatically. A second writable field bound to `period.end` would conflict with a DateRange field bound to `period`; overlapping ownership must be rejected. Section object bindings only route child bindings, so they create no such competing owner.

### 3. Reusing a section twice must preserve its internal wiring

**Given:** primary and recovery uses of DeploymentTarget. Each definition locally connects region to account.

**Change:** change the primary account while both region lookups are pending. Allow responses to arrive in the opposite order.

**Expected:** the recovery selection and errors are unaffected. Only results matching the current primary account can update the primary options; the previous region is rechecked under the new account. Any rule requiring distinct primary and recovery regions re-evaluates at the containing form.

**Model decision:** internal references resolve within a section use. External inputs and cross-section rules are explicit. Formulate coordinates invalidation; the application supplies lookups and domain decisions. Part 6 must choose how obsolete selections are cleared or retained as invalid.

### 4. Presentation changes must not rewrite the data contract

**Given:** Account and Region fields in one section on one page.

**Change:** add a grid wrapper; put Account on an earlier page; present both again in review; replace the picker with compatible custom React.

**Expected:** instance identities, bindings, data shape, and domain validation remain stable. Dependencies run when either field is off-screen. The Account page can continue before Region is filled in; final submission checks both. Changing Account later rechecks Region and any affected completion. Review creates no second registration or value store.

**Model decision:** pages present references to existing uses and govern an action scope. Layout is presentation; it creates no data nesting or applicability policy. Section applicability does not depend on which page currently presents its fields. Simultaneous editable presentations require deliberate binding support and accessible control identities; the baseline review case is read-only.

### 5. Reusable pages must not carry a hidden dependency on their original route

**Given:** an Employment page used in onboarding and an employee-change form.

**Change:** place Equipment after it in onboarding and Review after it in the change form.

**Expected:** field definitions and local readiness checks are reused. Each containing form supplies external inputs and the next destination. Splitting the original page preserves field identities and value paths.

**Model decision:** a page groups progression and exposes local outcomes; its host connects surrounding progression. The API must make that connection readable without introducing a general-purpose graph language for an ordinary wizard.

### 6. Repeats must survive reorder, deletion, and delayed responses

**Given:** three LineItem section instances with separate errors and pending price lookups.

**Change:** move item three to position one, delete another item, and add a new item in its former position. Deliver all old responses.

**Expected:** values, errors, dependencies, and focus targets follow stable item identities. A removed item's response is discarded. A server error for a submitted item is reconciled against that attempt's item mapping, not blindly attached to the current array index.

**Model decision:** array position and item identity differ. Server payloads may need an application item ID or an attempt-specific mapping; a UI key alone does not establish a server protocol. That mapping belongs in the submission contract.

### 7. Nested conditions must compose predictably

**Given:** a production-only section containing a further conditional recovery field.

**Change:** complete it, change to development, then return to production with a different account.

**Expected:** the child cannot apply while its parent does not. Under the explicit retain-and-exclude policy, development submission omits retained production values and their requirements do not block continuation. On return, retained values and prior completion are rechecked against current inputs.

**Model decision:** applicability narrows through the containing composition. Visibility, retention, validation, inclusion, and readiness remain distinguishable. Hiding a panel for layout reasons is a separate operation.

### 8. Rule composition must not silently discard validation

**Given:** a library field with intrinsic validation and an instance with a contextual requirement; a containing section also has a cross-field rule.

**Change:** customise the label or renderer, then add a further instance constraint.

**Expected:** all applicable rules still run in the relevant action scope. An instance-level validator must not accidentally replace the library's validator. A contract-changing adaptation is deliberate and reviewable. Unsupported configuration or incompatible renderers should fail with a useful diagnostic.

**Model decision:** each rule has a declared owner and inputs. The exact validation merge, diagnostic, and override APIs remain to be designed in Parts 4–6; ordinary object-property overwrite is not an acceptable accidental policy.

### 9. A simple form and a scoped save must stay simple

**Given:** a login form with email and password fields configured inline from Input controls, and a submit handler; a settings form mixing inline and library fields across several areas.

**Change:** add a layout wrapper to login; add a Profile-only save action to settings.

**Expected:** login requires no library field, authored section or page, named field definition, registry entry, or repeated field declarations. Profile save identifies its validation and payload scope, including any declared dependencies on other values. Incomplete unrelated drafts do not block it; whole-form submission remains a separate scope.

**Model decision:** optional containers stay optional. Actions reference the requirements and values they operate on; scope does not follow a DOM subtree or the currently visible tab.

### 10. Submission and recovery must tolerate changed reality

**Given:** a valid deployment request, retained production-only values, and a saved draft.

**Change:** submit in development mode; edit an included value while the request is pending; receive an old field rejection; later restore the draft after available regions or permissions change.

**Expected:** the sent snapshot excludes retained production-only data and remains unchanged by later edits. An old rejection is associated with its attempt and is not presented as authoritative validation of a newer value. Recovery restores useful values but re-evaluates options, requirements, and permitted actions. Acceptance can complete the interaction while backend work continues.

**Model decision:** the draft, submission attempt, and backend process have distinct responsibilities without becoming new composition layers. Parts 6–8 must specify response reconciliation, recovery, and definition compatibility; the application remains authoritative for access and business rules.

### 11. Meaning must survive a change of consumer

**Given:** the same cloud-deployment interaction consumed by the default renderer, custom React, and an assisting agent.

**Change:** change account and environment, introduce a server request for further input, and attempt to continue with stale values.

**Expected:** all consumers observe the same applicable requirements, invalidation, validation results, and named available actions. UI-only state such as an open popover can differ. The agent receives only values and actions authorised by the application.

**Model decision:** behaviour that affects validity or progression belongs in the shared interaction contract. Arbitrary React code alone cannot supply that contract. This is the Part 9 hypothesis test, not a commitment to ship an agent runtime in Version 0.1.

### 12. Routes and tabs must represent the same logical pages

**Given:** the same Account, Region, and Review page instances, shared form values, and a sequential navigation policy.

**Change:** switch from tabs to routes; use Back, a direct Review URL, and a clicked tab; unmount the Account UI.

**Expected:** page and field identities, values, errors, requirements, and completion remain stable. All navigation entry points respect the same policy. Page access never proves completion. Full document navigation that destroys the runtime must restore from a persisted draft and recheck state.

**Model decision:** Page is a logical construct with form-scoped state. Router paths and tab keys map to it. An application's deliberate choice of free navigation is a policy change, separate from changing the presentation.

### 13. Layered completion must respect scopes and global rules

**Given:** a DeploymentTarget section split across Account and Region pages, plus a form-level rule requiring primary and recovery targets to differ.

**Change:** complete Account before Region; then make each page locally valid while violating the form-level rule.

**Expected:** Account can be Complete while its section and form remain Incomplete. Later, every page's local scope can be Complete while the form is Incomplete. The global failure exposes an actionable reason and correction destination. A section's cross-page rule never disappears because its fields were split.

**Model decision:** completion is derived from applicable requirements assigned to each scope. Form completion includes unique field, section, required page, and form-wide requirements; it is not simply the conjunction of page badges.

### 14. Completion must use current evidence, not interaction history

**Given:** valid prefills, an optional blank field whose contract accepts absence, a required blank field, and a field awaiting a required asynchronous check.

**Change:** visit pages without editing; change a dependency during the check; deliver an old success; start an unrelated suggestions lookup.

**Expected:** valid prefills and the accepted optional blank can be Complete before a visit. The required blank is Incomplete. A necessary pending check prevents Complete; stale or unevaluated requirements do too. An old result cannot restore completion, and background work unrelated to requirements does not revoke it. Untouched incompleteness need not immediately display an error.

**Model decision:** completion, validation evidence, pending work, touched fields, and visited pages remain distinguishable. Only checks required for completion affect that result.

### 15. Branches, review, and repeats must not distort progress

**Given:** a production page, repeated resource sections, and an informational Review page referencing existing fields.

**Change:** leave production, add or remove a resource, and show the same field on another summary. Separately, hide a tab without changing applicability.

**Expected:** explicitly inactive scopes show Not applicable or are omitted from applicable progress. The current unavailable page resolves to an available destination. Active scopes with no obligations may be Complete but add no claimed required work. Repeats change counts by stable identity; repeated views add no fields or requirements. Hiding navigation alone neither removes requirements nor completes them.

**Model decision:** count named units and unique requirements, not DOM elements. Values follow explicit retention and inclusion rules. Progress can decrease when new requirements become applicable.

### 16. Review acknowledgements and save acknowledgements have different lifetimes

**Given:** a complete form with an explicit acknowledgement of the current review summary, and a Profile-only save pending.

**Change:** change a relevant reviewed value, then edit Profile again before its earlier save succeeds. Navigate away and return.

**Expected:** the old review acknowledgement no longer satisfies the new summary requirement. Page arrival does not restore it. The save acknowledges only its submitted snapshot; newer Profile edits and unrelated drafts remain unsaved. Neither acknowledgement can certify newer validation or complete the backend process.

**Model decision:** semantic acknowledgements record what was acknowledged and are checked against current inputs. They do not provide a permanent writable `complete` flag. See the [state and completion model](03-state-and-completion.md).

### 17. Ad hoc fields must be ordinary fields

**Given:** a form built entirely from inline fields that configure Input, Select, and Switch controls, bindings, props, and their applicable rules. It has no named library field definitions or field registry entries.

**Change:** group those fields into a section, put them on routed or tabbed pages, then extract one useful field into a library definition while preserving its use's identity, binding, control contract, and rules. Mix it with the remaining inline fields.

**Expected:** both authoring paths have the same value authority, validation, dependency behaviour, accessibility integration, and field/section/page/form completion. Extraction does not rename payload data, reset current state, duplicate registration, or silently add or remove requirements. Placeholder changes affect presentation; they do not introduce validation. Neither path requires the other as a preliminary authoring step.

**Model decision:** a field instance can be configured directly or created from an optional library definition. The binding/control integration gives both the same form behaviour. Reuse is an authoring convenience and distribution opportunity, not an extra layer every input must pass through. The exact prop, JSX, and definition APIs remain open.

### 18. A local condition must resolve the intended instance

**Given:** a section with an inline `showAdvanced` checkbox and a neighbouring section whose visibility reads that checkbox. The same relationship could be composed in a page or at the form level.

**Change:** rearrange the presentations, extract the group for reuse, then use it twice. In a second variant, extract only the controlled section and connect its declared `expanded` input from the caller's checkbox.

**Expected:** the original condition retains its field reference when the UI moves. Each reused group resolves local names to its own checkbox. The externally controlled variant reads the explicitly connected source and follows later changes, rather than receiving a one-time copied Boolean. A second form's matching names cannot affect this form. No full-path lookup or registry is required for a local condition.

**Model decision:** authoring context provides convenient names; a resolved reference identifies a specific field instance. Reuse boundaries declare their outside inputs. Pages provide presentation and completion scopes without making routes or DOM ancestry part of reference resolution.

### 19. A reference does not choose the condition's effect

**Given:** the [advanced-options example](03-scenarios/advanced-options.md), with a disclosure checkbox, valid advanced defaults, and an explicitly mapped payload.

**Change:** hide advanced options, then make a retained advanced value invalid and submit. Compare a separately authored enablement condition using applicability and retain/skip/exclude policies.

**Expected:** disclosure preserves requirements and included configuration values; its UI-only checkbox remains excluded by payload mapping. Invalid hidden data still blocks the relevant action, with a declared correction action that reveals the affected fields before focus. The controller remains reachable. Enablement instead changes requirements and inclusion through its explicit policies. Neither relationship silently changes page availability.

**Model decision:** reference, condition, and effect are distinct. Visibility, applicability, requiredness, and derived values can consume the same reference without acquiring each other's consequences. Reading a source never copies, clears, or writes its value implicitly.

### 20. Missing references, inactive values, and mutual reads differ

**Given:** a retained true checkbox in an inapplicable section, a required dependency awaiting restoration, and two validators that read both fields' stored values.

**Change:** evaluate a condition requiring an active affirmative answer; remove a referenced repeated item; separately introduce a computed value or completion condition that feeds back into itself.

**Expected:** an active-answer condition checks both applicability and value. A required unresolved dependency cannot silently evaluate as false or certify completion; a nonexistent reference reports a configuration error unless absence is explicitly supported. Removing an item never retargets its old reference by array index. Deterministic mutual reads remain valid; unsupported feedback loops produce actionable diagnostics.

**Model decision:** reference identity, source value, source applicability, and current evaluability remain distinguishable. Detailed tracking and scheduling belong in Part 6. See [references and relationships](03-references-and-relationships.md).

### 21. Layout configuration must target the intended surface

**Given:** the [responsive-layout example](03-scenarios/responsive-layout.md), with a form grid, a field spanning the row, and a class passed to an Input. Later introduce a Section only to test a reusable group.

**Change:** add a plain row wrapper, change the grid columns, change one presentation's span, then change the Input's placeholder or class. Split the section's presentations across pages.

**Expected:** container CSS arranges its rendered children; placement affects the child's outer presentation; supported control props affect the primitive. A row adds no semantic section, state, or completion scope. Field identities, bindings, references, and validation remain stable. Each page arranges its own content; the shared section's default grid cannot position controls across unrelated pages.

**Model decision:** layout is presentation configuration on a form, page, or section. Its container, child placement, and renderer/control props are distinct targets, even when convenient authoring brings them together.

### 22. Responsive arrangement must retain a meaningful interaction order

**Given:** name, email, and region presentations in logical order, displayed in a two-column grid.

**Change:** narrow the viewport to one column, then intentionally put email before name. Operate the resulting form with keyboard and assistive technology in the eventual prototype.

**Expected:** the responsive change preserves a meaningful reading and focus sequence. The intentional reorder changes the rendered presentation sequence while keeping field identities, values, and completion. CSS positioning alone is not used to implement the new logical order, and a second positive-tabindex list is unnecessary. Composite controls retain their own internal keyboard behaviour.

**Model decision:** ordered presentations establish the source sequence; CSS supplies visual arrangement. The [layout model](03-layout-and-presentation.md) separates these concerns and cites the underlying browser/accessibility behaviour.

### 23. Focus requests must survive layout changes without stealing focus

**Given:** a page with an initial field preference, and an invalid field hidden in a section on another page.

**Change:** resize or finish an async lookup while the user types elsewhere; request correction of the hidden field; navigate away before its delayed reveal finishes. Also render the pages as tabs.

**Expected:** layout and data updates preserve current focus. A current correction request navigates, reveals, mounts, and asks the designated renderer to focus its appropriate control. An obsolete request does not pull focus back. If the target is unavailable, an appropriate fallback remains reachable. Tab activation respects the tabs primitive's keyboard conventions rather than repeatedly forcing focus into the first field.

**Model decision:** focus is an explicit interaction request by logical reference, with presentation-specific delivery. It is not a CSS selector, automatic value selection, or a new tab-order graph.

### 24. Styling hooks must not become field identity or state authority

**Given:** two instances of a reusable section sharing CSS, a field shown in editing and read-only review, and a picker whose popup uses a portal.

**Change:** apply a local placement class, edit a shared CSS rule, style an invalid-state hook, and replace Input with a compatible compound control.

**Expected:** the local class affects its targeted surface; the shared rule affects all matching rendered elements through ordinary CSS. Neither shares field state. Review adds no field copy, and mounted control IDs/accessibility associations remain unique. Portal styling uses the primitive's supported interface. State hooks reflect real results; adding an invalid or complete class changes no requirement. Unsupported primitive props require adaptation, while binding, events, accessible associations, and focus integration remain connected.

**Model decision:** logical scope does not create CSS encapsulation. Classes and documented attributes style presentations; references identify fields; the value and interaction engines remain authoritative for behaviour.

### 25. The small form must have an explicit authoring budget

**Given:** the [simple-form baseline](03-scenarios/simple-form.md), with two ordinary inline inputs and a submit handler.

**Change:** implement it in the eventual API, then independently add CSS layout, one conditional field, field reuse, a group rule, and pages.

**Expected:** the baseline has zero authored Pages, Sections, library definitions, registry entries, separate reference declarations, workflow declarations, payload mappers, or duplicate presentation lists. Each field needs one value key and each rule one authoritative declaration. Normal renderer/engine integration supplies field and form state, validation, errors, and completion. Each addition introduces only its actual requirements; a condition or CSS grid does not require grouping or pagination.

**Model decision:** the hierarchy describes possible composition, not required authoring steps. Capabilities compose where needed. Count independent edits and concepts introduced in real code; short pseudocode alone does not prove ergonomic success.

### 26. Optional structure must be removable without a form-mode migration

**Given:** a form that began with direct fields and later added a reusable Section, two Pages, page-specific review acknowledgement, and a cross-field rule.

**Change:** return it to direct fields. Remove the obsolete page navigation and explicitly decide whether review acknowledgement is still required. Keep the business rule.

**Expected:** field identities, bindings, values, errors, and references survive. Rehome the business rule, any still-required acknowledgement, and applicable conditions, retention/inclusion policies, or inherited defaults to surviving fields or an appropriate remaining scope. Removed Page/Section summaries disappear; no synthetic page must be named, visited, or completed. Normal submission and form completion still work, without another engine or a separate simple/advanced mode.

**Model decision:** Pages and Sections are optional meaningful boundaries. Removing a boundary must not accidentally remove domain requirements; adding it must not silently create data nesting or duplicate state.

## What still needs proof

For Parts 4–6, implement the simple-form authoring budget first, then the same deployment form with a mix of inline fields and reusable definitions. Require useful TypeScript inference without casts, twice-used sections without manual path rewriting, a page split without a payload change, and custom React without duplicated rules. Include expected diagnostics for duplicate identities, incompatible bindings, missing inputs, and unsupported feedback cycles.

Once a runtime exists, turn the adversarial sequences above into executable integration tests, including out-of-order responses and restored drafts. Run the same page navigation and completion sequences through routes and tabs, testing split-section scopes and partial save acknowledgements. Compare equivalent manual and Formulate versions by replacing a picker, reusing a section, adding a branch, and handling a rejection. Record the independent edits and coordination code required, as requested in the design notes.

The conceptual review supports this vocabulary across the seven scenarios. It does not yet demonstrate that the API is easier to use or that the runtime implements the promised behaviour. If those prototypes need repeated declarations, hidden dependency wiring, or many new public concepts, simplify the authoring design before treating Part 3 as an API commitment.
