# Responsive layout: arrange existing fields with ordinary CSS

[Scenario rubric](README.md) · [Layout and presentation](../03-layout-and-presentation.md)

This supplement to the Part 9 hero scenarios presents name and email side by side on wide screens, stacked on narrow screens, with a region picker spanning the row. Layout needs no Page or Section and creates no binding or completion scope.

The pseudocode is illustrative. Fields are ordinary inline children in presentation order. Each field key supplies identity and binding here, without repetition in a separate presentation list.

```text
form Enquiry
  layout:
    className: enquiry-form contact-grid

  field name
    control: Input
    label: Name
    controlProps:
      placeholder: Enter your name
      className: contact-input
    validate: non-empty text

  field email
    control: Input
    label: Email
    controlProps:
      type: email
      placeholder: name@example.com
      className: contact-input
    validate: required email address

  field region
    control: Select
    label: Region (optional)
    options: available regions
    validate: accept empty or a current available region
    placement:
      className: contact-wide

  on deliberate entry:
    prefer focus name after its control is available
```

The form container is an ordinary CSS surface. The renderer's outer field surface contains label, control, help, and error; `contact-wide` places that whole presentation. No extra wrapper is needed when the root suffices. `controlProps.className` reaches the Input through its supported props.

```css
.enquiry-form {
  max-width: 48rem;
  margin-inline: auto;
}

.contact-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr);
}

.contact-grid > .contact-wide {
  grid-column: 1 / -1;
}

.contact-input {
  inline-size: 100%;
}

@media (min-width: 48rem) {
  .contact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

The span selector assumes the field surface is the grid's direct child, so that relationship must be a supported presentation contract. Container classes are not copied into control props. Normal CSS inheritance applies; picker internals use the primitive's documented props or slots.

The logical and rendered order is **name, email, region** at both widths. Reading and ordinary Tab navigation follow that sequence, without a separate tab-order list, positive `tabindex`, or CSS `order` override. To change the intended sequence, reorder the inline children while preserving their identities.

Initial focus is a deliberate entry policy. Typing, validation, and resizing preserve current focus; a valid return destination can take precedence. If Name is unavailable, use a fallback such as the form heading. Focusing a picker does not select an answer. Its renderer resolves a field reference to the appropriate control and owns internal keyboard behaviour. Styling selectors never replace those references.

Field requirements roll up directly to form completion. A grid does not introduce an intermediate completion indicator. Add a Contact Section when a named group, group rule, or reusable composition is useful; add Pages when navigation is useful. Neither addition automatically prefixes bindings. A section's local reference scope is intentional, while existing resolved relationships survive rearrangement.

| Change to pressure-test | Required outcome |
| --- | --- |
| Resize or reorder inline children. | Values, errors, and references keep their identities. Rendered order remains meaningful; resizing preserves focus. |
| Change `contact-input`, then change `contact-wide`. | The first styles the supported Input surface; the second changes field placement. Neither changes bindings, rules, or the picker's internals. |
| Extract Contact, then add route or tab Pages. | Retain field bindings and requirements. Error correction opens the assigned page before focusing the control. Tab presentation respects the tabs primitive's focus conventions. |
| Replace Name's Input with a compound control. | Preserve its value contract; its renderer resolves the focus request. Unsupported Input props require adaptation. |
| Show review alongside editing; portal the picker options. | Both views read one state. Mounted controls have unique DOM IDs and correct labels. Correction targets the editable presentation. Portalled content uses supported hooks, without assuming container ancestry. |

Reusing Contact twice creates independent fields with distinct caller-supplied bindings and DOM associations; CSS classes can remain shared. Removing a Page or Section preserves field state and relationships. Retain still-needed rules, conditions, policies, and defaults at a surviving owner; removing a scope cannot silently remove their behaviour.
