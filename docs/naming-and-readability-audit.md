# Naming and readability

Implemented 11 September 2026 across the React library, examples, tests, documentation, and source registry.

The audit covered all 19 core source modules and their public and generated APIs. The main finding was that several names hid an operation’s effect or the kind of data involved. The implementation now follows one rule: **a reader should be able to predict an operation’s purpose and main effect without opening its implementation.**

The package uses the new API directly. The table records the decisions made during the audit.

| Previous name | Current name | Meaning |
| --- | --- | --- |
| `navigation.correct(errors)` | `navigation.goToFirstError(errors)` | Reveal and request navigation/focus for the first mapped error. |
| `navigation.goTo(page)` | `navigation.goToPage(page)` | Change the page, optionally scheduling focus after commit. |
| `CorrectionDestination` | `FieldDestination` | Map an editor or scope to its page and reveal callback. |
| `Form.navigation` / `FormNavigationAction` | `Form.scopedAction` / `ScopedFormAction` | Configure the validation-gated action invoked by submit/Enter. |
| `FormScope.fields` / `.correction` | `.errorPaths` / `.focusPaths` | Errors that block an action versus ordered editors that can receive focus. |
| `definition.fieldNames` | `definition.fieldPaths` | Ordered declared leaf paths, including nested fields. |
| `section.field(name)` / `.choiceId(name)` | `.resolveFieldPath(name)` / `.resolveChoiceId(name)` | Resolve a local path or choice identifier for a bound section. |
| `section.focusFirst(form)` | `section.focusFirstField(form)` | Focus the first editor after the host has revealed it. |
| `SectionBindings` | `SectionPathMap` | Map local members to compatible host value paths. |
| `Section.Bind use={descriptor}` | `Section.Bind binding={descriptor}` | Render an explicitly bound section descriptor. |
| `defineSection(..., { render })` | `defineSection(..., { presentation })` | Supply a React presentation component. |
| `Subsection` / `DefinedSubsection` | `Section` / `DefinedSection` | Use one section contract at every nesting level. |
| `useFieldControl()` | `useFieldBinding()` | Read value, events, ref, and accessible attributes for a connected control. |
| `Page.id` | `Page.pageId` | Supply the logical `data-page` marker; native `id` is a separate DOM identifier. |
| `FormPendingFields` | `FormActionFieldset` | Disable contained editors while the owning form action is pending. |
| `submissionErrorMessage` | `actionErrorMessage` | Feedback for a thrown check or action callback, including final submission. |
| `useChoiceForm({ fields })` | `useChoiceForm({ getChoiceBindings })` | Compute current choice bindings from editing values. |
| Choice config `input`, `key`, `loader`, `validate` | `getInput`, `getRequestKey`, `getLoader`, `validateSelection` | Distinguish callbacks from their results. |
| `BoundChoice.id`, `.name`, `.key` | `.choiceId`, `.fieldPath`, `.requestKey` | Stable identity, current value location, and request equivalence. |
| `choices.clear()` | `choices.clearRequests()` | Abort/discard request state and options while retaining selections. |
| `ChoiceView.problem` | `ChoiceView.validationMessage` | Explain why current choice evidence or selection blocks validation. |

Both `Definition.useChoiceForm` and the exported `useChoiceForm` now return `ChoiceFormRuntime` directly: RHF’s form API augmented with `choices` and `getValidationRevision`. The lower-level hook no longer wraps the runtime in another `{ form, ... }` object. Ordinary `useForm` remains schema-only; dependent services start through the explicit choice-aware hook.

The [package API guide](../packages/react/README.md) contains the current usage examples and contracts.

**Conventions for future changes**

- Name commands with an action and its target: `goToField`, `clearRequests`, `saveDraft`.
- Name queries for their result: `resolveFieldPath`, `getChoiceBindings`. Use `is` or `has` for predicates.
- Name data for what it contains: `errorPaths`, `focusPaths`, `fieldPath`, `requestKey`. A callback should not look like a collection.
- Distinguish definitions, binding descriptors, the form runtime, and state views. A descriptor does not own live editing values.
- Preserve established integration names: RHF’s `control`, `name`, `trigger`, `setValue`, and `handleSubmit`; React’s `ref`; the library’s `Form`, `Field`, `Section`, `schema`, `defaultValues`, and `layout`.
- Keep concise names when their receiver already makes them clear: `navigation.page`, `choices.get`, `retry`, `subscribe`, `getSnapshot`.
- Use comments for timing, ordering, ownership, fallback, and cancellation. The name should already explain the basic operation.

**Important distinctions**

[Error navigation](../packages/react/src/form/use-form-navigation.ts) changes presentation and schedules focus. The helper itself does not edit values, clear errors, or run validation; host reveal callbacks can update values such as a disclosure checkbox. “First” means destination order, then focus-path order. A true result means a mapped navigation/focus request was made; it does not guarantee the control mounted or focus succeeded. Unmapped and section-level errors can require application fallback feedback.

[Scoped actions](../packages/react/src/form/form.tsx) gate errors at `errorPaths`. The resolver still evaluates the form schema. A section’s object path can include group and descendant errors, while `focusPaths` identifies concrete editors. An empty scope calls `onValid` without a validation run. Omitting the scoped action invokes full validation and parsed `onSubmit` output. The default thrown-action feedback now reads “Unable to complete this action. Please try again.”

[Choice bindings](../packages/react/src/choices/definition.ts) distinguish identity from location: a repeated item can change its field path while retaining its choice ID and request. Equal request keys assert interchangeable inputs. `clearRequests` does not immediately reload; later binding synchronization starts requests for non-null inputs. A `ready` choice view describes loaded options, and its selection may still be invalid.

[Sections](../packages/react/src/definitions/define-form.tsx) retain distinct bound descriptors for declared sections and explicit maps because they offer different capabilities. `bindSection` caches its renderer. `presentation` is a React component. Nested sections use the same `Section` API.

**Implementation readability**

Form action checks use `actionGeneration`, `attemptGeneration`, `isActionContextActive`, `valuesChanged`, and `isAttemptCurrent` to state what invalidates an attempt. A generation changes when its action context is replaced; it is not a submission count. Request freshness uses `isCurrentForKey`, separate from readiness and selection validity.

The definition builder now shares its local-to-host path resolver and binding checks, with expanded recursive binding and presentation branches. Its factory and cached component identities remain intact. Request/store mutations and asynchronous action branches are expanded so the order of cancellation, state changes, and callbacks can be read directly.

The [Infrastructure example](../examples/react/src/hooks/use-infrastructure.ts) exposes `resourceArray`, `resourceListRef`, `reviewHeadingRef`, `goToResourceField`, `saveDraft`, `restoreDraft`, `handleInvalid`, and `previewOrProvision`. These names describe adding/editing/reordering resources as well as responding to invalid input. Profile and Cloud examples distinguish their page navigator from `scopedAction` and use explicit handler/ref names.

Existing interaction and type tests exercise the renamed APIs, the direct choice-form return, transformed submission output, remapped choice paths, stale callbacks, focus after commit, fallback errors, and retained selections. The layout test also checks logical page identity independently of its DOM ID.

The review criterion is practical: read a representative composition without opening implementation files, describe what each command changes and what each value contains, then compare that description with the behavior. Where it fails, improve the name or simplify the API boundary before adding another explanatory comment.

Verification: `pnpm check` passed with workspace type checking, all 94 tests, source-registry generation, and package/example builds. The generated core contains all 19 modules with matching public exports; the shadcn bindings item installs `form-action-fieldset.tsx`.
