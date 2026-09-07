# Part 2 — Design Principles

Formulate makes complete form interactions composable. These principles guide its APIs and architecture, grounded in the [product vision](01-product-vision.md).

## 1. Compose complete interactions

Reuse fields, sections, and steps with their presentation defaults, dependencies, validation, and progression rules. An account-and-region section should carry its internal wiring wherever it is used, including multiple instances in one workflow. Keep domain rules in application-owned components and expose clear configuration boundaries.

## 2. Keep behaviour consistent across presentations

Default rendering and custom React must share the same interaction rules. Changing presentation should preserve applicability, validation, and available actions. Expose that meaning through contracts humans, tooling, and agents can understand, while allowing custom components and application functions.

## 3. Make consequential behaviour explicit

Make it possible to explain why a value is required, cleared, invalid, excluded from submission, or blocking progression. Keep visibility, value retention, validation, and payload inclusion distinct. Defaults should be predictable, inspectable, and overridable. Account for changed dependencies and stale asynchronous results.

## 4. Keep data, layout, and progression independently changeable

Compose these concerns without making one hierarchy dictate all three. Moving a field or splitting a step should preserve field identities and the submission contract unless the developer intends to change them. Convenient authoring can bring declarations together without coupling their meaning.

## 5. Preserve contracts through composition

Preserve types through values, component mappings, reusable units, dependencies, and submission. Validate external definitions and their referenced capabilities at runtime. Prefer useful inference and actionable errors; ordinary composition should not require repeated type assertions.

## 6. Own the UI; give shared behaviour a stable contract

Distribute editable UI building blocks through the shadcn registry model. Keep styling in local components and the application theme. Replacing a control or redesigning a step should work through stable integration contracts without forking workflow coordination. Make updates and compatibility requirements reviewable.

## 7. Let complexity grow by composition

Keep small forms small. Add branches, repeatable groups, asynchronous dependencies, and guarded steps through the same model as they become necessary. Default rendering, targeted customisation, and manual composition should be compatible paths. Introduce abstractions when concrete workflows justify them.

## 8. Make workflows usable and recoverable

Provide accessible defaults for labels, keyboard interaction, focus, errors, and progression, with clear integration obligations for custom UI. Failed requests and changed branches should preserve valid work and offer an understandable next action. Restored drafts must re-evaluate the rules their values depend on.

## 9. Give each kind of state one authority

React Hook Form owns field values by default; Formulate owns interaction coordination. Application services own permissions, business decisions, and durable execution. Connect these authorities through explicit handoffs, including server rejections and requests for further input. Avoid competing value stores or duplicated backend state machines.

The test for every addition: **Does this make building and changing complex workflows dramatically easier than composing shadcn components manually?**
