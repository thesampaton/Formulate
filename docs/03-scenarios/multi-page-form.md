# Multi-page form

The sixth example composes Profile, Delivery and Notifications pages with an informational Review page. It reuses Name and Address sections, Stack/Row layouts, and locally installed shadcn Tabs and Button primitives.

- [Composition](../../examples/react/src/compositions/multi-page-form.tsx) places fields, sections, pages and action components.
- [Declaration](../../examples/react/src/declarations/multi-page-profile.ts) owns field defaults and validation, including the conditional SMS number requirement.
- [Page state](../../examples/react/src/hooks/use-profile-pages.ts) connects shared values, navigation, correction focus and the saved baseline.
- [Page rules](../../examples/react/src/hooks/profile-pages.ts) compose bound section scopes with the page's direct fields. Those same scopes drive presentation, Continue, correction and completion against the submission schema.
- [Sample data](../../examples/react/src/data/example-data.ts) supplies the sample loader, source panel and test prefills. Consumers clone the values before editing them.

The parent declares `pageLayout={FormStepLayout}` once. Nested FormTabPage components supply their title and content; the shared layout supplies the body spacing and Back/Continue row. Page context carries ordered navigation and any action override, so each page avoids repeating callbacks or wrapper markup. Review supplies FormReviewActions as its one action difference. Notifications owns its conditional editor and local revalidation in a [reusable section](../../examples/react/src/declarations/notifications.tsx).

A per-page `layout` replaces the inherited layout and `layout={null}` removes it, using the existing core layout contract. These shadcn wrappers do not change Page or introduce another form runtime. The code panel includes the page layouts and notification section as supporting code.

A single RHF runtime owns all answers. Changing tabs hides old editors with React Activity, preserving their React state, DOM and RHF values while pausing their effects. Tabs can be visited freely; visiting a page does not validate it or mark it complete. Continue validates only the current page, then focuses the next editor. Saving from Review checks the whole form and opens/focuses the first field requiring correction.

Completion describes current requirements. A valid prefill is immediately complete; clearing a required value reverses that status. SMS requires a correctly formatted mobile number. Email suspends that requirement while retaining the number's draft for switching back. Country changes recheck the postcode using Address's existing rules.

Review adds no acknowledgement requirement and is excluded from the three-page completion count. Its status is Ready when the editable pages are complete. Saving is separate: the accepted parsed payload becomes the saved baseline, and later edits can make a complete form unsaved again. The demo handler does not send data or persist it.

FormTabs, FormTabPage, FormStepLayout and the action components are available through `@formulate/navigation`. They wrap local shadcn exports and inherit Form's pending action state. The example's page rules are application code, not a general completion engine: they cover synchronous schema checks and do not claim async readiness, a dependency scheduler or arbitrary workflow requirements.

The demo wrapper owns sample loading. The resize demonstration similarly owns its slider outside ProfileForm. Code panels read the entire composition module rather than trimming away inconvenient setup, with supporting code shown separately.
