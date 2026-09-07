# Part 3 — Layout and Presentation

**Layout is how a form, page, or section arranges the content it presents.** It is presentation configuration on those compositions, expressed through ordinary CSS and ordered children. It does not introduce another data, requirement, or state layer.

The [mental model](03-mental-model.md) identifies the fields and their relationships. Layout answers where their presentations go, which styling surfaces are available, and how the intended reading sequence reaches the rendered UI. The [responsive-layout example](03-scenarios/responsive-layout.md) shows the concrete manifestation in pseudocode and CSS.

## Three styling targets, one ordinary CSS model

| Target | What the author controls | Boundary |
| --- | --- | --- |
| **Container** | Its ordered content, `className`, `style`, and ordinary layout properties such as display, gap, columns, padding, and alignment. | A form shell, page content area, or section container arranges the presentations it renders. |
| **Child placement** | A field or section presentation's span, width, alignment, or placement class within that container. | Applies to the rendered root or wrapper participating in the parent's layout, not automatically to the input inside it. |
| **Field renderer / control** | The selected component's supported props, such as placeholder, size, variant, control class, and documented slot props. | The field renderer and primitive retain their own markup, styling, and internal interaction responsibilities. |

These are targets for configuration, not three mandatory wrapper elements. The rendering contract must say where props land. A reusable section may already provide a suitable root; an extra layout wrapper is needed only when its presentation requires one.

For example, a grid can make an entire field span two columns, including its label and error text. The Input's padding or the Select trigger's appearance still comes from that component's styling interface. A parent layout class is not automatically passed to every control as a prop.

The arrangement of a field's own label, control, help, and error also stays with its renderer. If that renderer supports a horizontal orientation or named styling slots, callers can supply those props. Container layout does not need to recreate the primitive's internal field layout.

The API can place this configuration together for convenient authoring, but it must keep the targets unambiguous. Names such as `layout`, `placement`, and `controlProps` in the examples describe intent; they do not freeze the eventual API.

## Use CSS for the visual arrangement

Grid, flexbox, block flow, classes, inline styles, media queries, and CSS custom properties are sufficient building blocks. Authors can use their existing stylesheets, CSS Modules, or utility classes. Formulate need not invent its own system of columns, spacing tokens, or breakpoints.

```text
contact layout:
  className: contact-grid
  ordered children: name, email, region

region placement:
  className: contact-wide

name control props:
  placeholder: Enter your name
  className: contact-input
```

Here `.contact-grid` can use `display: grid`, `gap`, and responsive `grid-template-columns`; `.contact-wide` can use `grid-column: 1 / -1`. The classes are ordinary author-owned CSS, not references to field values or named runtime layout types.

If a row needs a wrapper, a plain layout container is enough. Creating a row must not require a Section with its own identity or completion scope. Conversely, a semantic section can exist without an elaborate layout.

A container arranges only the presentations it renders. Splitting Account and Region across pages preserves their shared section and dependencies, but each page now arranges its own content. The section's default grid cannot position DOM elements across unrelated pages. A form-level layout similarly arranges its rendered shell/content, not all routed pages as though they were simultaneously mounted.

## Order is more than CSS positioning

The ordered presentation list establishes the intended reading sequence. Default rendering should emit that sequence as DOM content order while preserving field and repeated-item identities. Changing the order of presentations is not a change to value bindings, dependency references, or the submission shape.

Ordered content can simply be ordinary React children or inline declarations. The sketches separate field handles from `present` lists to make relationships visible; they do not require every field to be declared twice or require a second layout language for manual React composition.

CSS visual ordering and grid placement do not change the default sequential focus traversal or nonvisual reading order. Consequently, moving an input visually is insufficient when the intended logical order also changes. [CSS Grid: reordering and accessibility](https://www.w3.org/TR/css-grid-1/#order-accessibility).

The default keyboard path should follow the meaningful rendered sequence, using the controls' normal keyboard behaviour. Do not create a second form-wide ordering system of positive `tabindex` numbers to compensate for CSS positioning. Positive values participate in a separate priority order under HTML's focus rules. [HTML tabindex](https://html.spec.whatwg.org/multipage/interaction.html#the-tabindex-attribute).

A two-column layout can have more than one meaningful reading order; visual and focus order need not be pixel-for-pixel identical. The requirement is that the sequence preserves meaning and operation. This model favours source order that remains understandable when the layout becomes a single column. [W3C focus-order guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html).

Normal Tab/Shift+Tab moves between available controls. Arrow keys, roving focus, and interactions inside a picker, radio group, or tabs component remain that component's responsibility. A field with several internal controls is still one logical field; it need not be one keyboard stop.

## Focus preferences belong beside layout, not inside CSS

A page or form may declare an initial-focus preference, and an error action may request focus on a particular field. Both use a [logical field reference](03-references-and-relationships.md), not a CSS selector or “the first input element.” The renderer chooses its appropriate focusable surface: an Input, a Select trigger, or a particular subcontrol of a composed field.

Treat “first select” here as choosing initial focus. A default answer, the selected option in a picker, and selection of text within an input are separate choices supplied through the field/control contract. Reordering a layout or focusing a field must not silently select a value.

| Situation | Proposed responsibility |
| --- | --- |
| **Enter a page deliberately** | The navigation/presentation integration considers its declared target, meaningful heading, or restoration target once content is ready. |
| **Validation, async data, or breakpoint changes** | Preserve the user's current focus; do not rerun initial focus because a field updated or remounted. |
| **Return to a page** | Restore an appropriate still-available target where possible; use an explicit fallback if it was removed or is unavailable. |
| **Correct an error** | Choose an eligible presentation, navigate and reveal it, wait for the control, then ask its renderer to focus the field or relevant subcontrol. |

An initial-focus preference must respect the chosen presentation's keyboard conventions. Activating a tab is not automatically a request to move focus into its first input; the tabs primitive coordinates focus among tabs and entry into the panel. [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboardinteraction).

If several views show the same field, a focus request needs an appropriate editable presentation, preferably the relevant active one or an explicitly designated correction destination. A read-only review view is not a substitute. If conditional layout removes the currently focused control, the presentation needs a reachable fallback, such as its disclosure control. A late focus request must not take focus back after the user has navigated elsewhere.

## Classes and selectors target the rendered surfaces

Authors need stable styling hooks for the container, field presentation, and any renderer-supported parts such as label, help, error, trigger, or popup. Prefer explicit classes or documented attributes to assumptions about undocumented internal nesting.

For example, a renderer might expose `data-formulate-completion` on a section presentation or `data-formulate-invalid` on a field presentation. Those names are illustrative. Such attributes reflect existing state for CSS to style; adding a class or changing an attribute does not make a field complete or invalid. Native and ARIA attributes must still reflect their actual semantics through the control integration.

CSS selectors follow the real DOM and CSS cascade. A logical section is not automatic CSS encapsulation. A popup rendered in a portal may be outside its section's DOM subtree, so styling that popup needs the primitive's supported popup/slot interface rather than an assumed descendant selector. Likewise, changing a shared stylesheet affects every matching presentation; independent field state does not imply isolated CSS.

Logical field identity, CSS classes, and DOM IDs serve different purposes. Repeated sections and multiple presentations of one field need unique mounted control IDs and correct label/help/error associations, even when they share classes or a logical field reference. Behavioural relationships continue to use field references, not `querySelector`, labels, or positional selectors.

CSS can hide a presentation, but cannot decide its applicability, retained values, validation scope, or payload inclusion. A custom presentation that hides applicable content must still provide a way to reveal it for correction. Exposed completion/error styling hooks observe the [shared state model](03-state-and-completion.md); they do not become another authority for it.

## Defaults and primitive props keep their boundaries

A library field can provide default control props; a reusable section or page can provide a default layout. The caller can adapt a particular use or presentation without editing the shared definition. Default layout, local placement, and primitive configuration remain separate targets.

Specify which configuration is inherited, extended, or replaced. Do not promise that merely appending a class name makes it override another: CSS still resolves applicable declarations. Class-merging helpers or component-specific prop composition remain explicit implementation choices.

The selected renderer accepts only the props and slots it supports. Swapping Input for a compound picker may require adapting those props while keeping the field's value contract. Field-owned value binding, change/blur coordination, accessible associations, and focus integration must not be disconnected by an unrestricted prop spread. Applications can customise those behaviours through the supported integration rather than accidentally replacing the connection.

This leaves shadcn components and owned UI code in charge of their internals. Formulate supplies composition, ordered presentation, state connections, and focus requests—not a second design system or a replacement keyboard controller for every primitive.

The [focused example](03-scenarios/responsive-layout.md) and [pressure tests](03-mental-model-pressure-tests.md) define the rubric. CSS, keyboard, and focus behaviour still need verification against rendered prototypes; this document establishes the responsibilities and expected outcomes.
