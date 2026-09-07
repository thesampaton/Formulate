# Part 3 Reference — Layout and Presentation

[Back to the mental model](03-mental-model.md). This reference develops styling, order, and focus responsibilities. The [responsive-layout example](03-scenarios/responsive-layout.md) applies them with ordinary CSS.

**Layout arranges existing content.** It is optional presentation configuration on a form, page, section, or plain wrapper; it adds no data or completion scope.

## Styling targets

| Target | Responsibility |
| --- | --- |
| **Container** | Ordered children, classes/styles, grid or flex layout, spacing, and alignment. Arranges the presentations it renders. |
| **Child placement** | The span, width, or alignment of a field/section's outer presentation within its container. |
| **Renderer / control** | Supported props and slots: placeholder, variant, control class, trigger, label, help, and error styling. Owns its internal markup and interaction. |

These are configuration targets, not mandatory wrapper elements. A field's column span includes its label and error; Input padding belongs to the control interface. The rendering contract must make prop destinations clear.

Use existing stylesheets, utility classes, CSS Modules, grid, flexbox, and responsive rules. A visual row needs no semantic Section. Ordered React children can supply the sequence without a second declaration or presentation list.

A section split across pages keeps its fields and relationships, but each page arranges its rendered content. The section's default grid cannot position controls across unrelated pages.

## Reading and keyboard order

Render content in its intended logical sequence, preserving field and repeated-item identities. CSS positioning alone does not change normal reading or sequential focus order. Reorder the source when the intended sequence changes. [CSS Grid accessibility](https://www.w3.org/TR/css-grid-1/#order-accessibility).

Use ordinary control keyboard behaviour and a meaningful sequence that also works when columns stack. Avoid a separate positive-`tabindex` ordering system. [HTML tabindex](https://html.spec.whatwg.org/multipage/interaction.html#the-tabindex-attribute), [W3C focus-order guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html).

Pickers, radio groups, and tabs own their internal arrow-key and focus behaviour. One logical field can contain multiple keyboard stops.

## Focus requests

Initial and error focus use a [field reference](03-references-and-relationships.md). The renderer resolves it to an Input, Select trigger, or appropriate subcontrol. Focusing a control does not choose its answer; defaults and text selection are separate control concerns.

| Situation | Responsibility |
| --- | --- |
| **Deliberate entry** | Consider the preferred field, meaningful heading, or restoration target when content is ready. |
| **Validation, async updates, resizing** | Preserve current focus. Do not repeat initial focus on every update or remount. |
| **Return navigation** | Restore an available target or use an explicit fallback. |
| **Error correction** | Choose an editable presentation, navigate and reveal it, wait for its control, then request focus. |

Page preferences must respect the chosen presentation. Activating a tab does not automatically move focus into its first input. [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboardinteraction).

A review view cannot substitute for an editable correction target. If a condition removes the focused control, provide a reachable fallback such as its disclosure control. Cancel a late focus request when the user has navigated elsewhere.

## Classes, selectors, and state hooks

Expose supported classes/slots and documented state attributes for container, field, label, help, error, and popup surfaces. Completion/error attributes reflect the [shared state](03-state-and-completion.md); they do not set it. Native and ARIA attributes must retain their proper semantics.

CSS follows the actual DOM and cascade. Logical sections do not create CSS isolation. Portalled popups need supported styling hooks rather than assumed descendant selectors. Shared classes can style many independent uses.

Logical field identities, CSS classes, and DOM IDs have separate purposes. Repeated uses and multiple mounted presentations need unique control IDs with correct label/help/error associations. Behavioural conditions use logical references rather than selectors.

Hiding with CSS does not change applicability, validation, retention, or inclusion in submission. Custom presentations must still let users reveal applicable content for correction.

## Reuse and overrides

Library fields can supply control defaults; sections/pages can supply layout defaults. Callers adapt each use through the appropriate target. Later APIs must specify whether configuration extends or replaces defaults; the CSS cascade still resolves styles, and appending a class does not guarantee an override.

A replacement renderer accepts only its supported props and slots. Adapting Input to a compound picker may require changing props while preserving the value contract. Prop forwarding must preserve value binding, change/blur coordination, accessible associations, and focus integration.

The [pressure tests](03-mental-model-pressure-tests.md) capture layout invariants. Keyboard and focus outcomes still need verification in rendered prototypes.
