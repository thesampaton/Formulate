# Responsive layout: ordinary CSS

[Scenario rubric](README.md) · [Layout and presentation](../03-layout-and-presentation.md)

Name and email sit side by side on wide screens and stack on narrow screens. Region spans the row. Layout needs no Page or Section.

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

These are three distinct styling surfaces: the form container, the whole field presentation, and the Input's supported props. The span selector relies on the field surface being a direct grid child. Picker internals use their primitive's documented hooks.

Ordered children supply **name, email, region** for rendering, reading, and ordinary Tab navigation at both widths. No second ordering list is needed. Initial focus is a deliberate entry choice; resizing and validation preserve current focus. Focusing the picker does not select an answer.

Field requirements roll up directly to form completion. A grid creates no intermediate completion scope.

| Change | Required outcome |
| --- | --- |
| Resize or reorder children. | Preserve values and references; rendered order stays meaningful and resizing preserves focus. |
| Change `contact-input`, then `contact-wide`. | Style the control, then field placement; neither changes bindings or rules. |
| Add a Contact Section or route/tab pages. | Preserve bindings; correction reveals the editable presentation before focusing it. |
| Replace Input with a compound control. | Preserve its value contract; adapt props and let its renderer resolve focus. |
| Show review alongside editing or portal picker options. | Read one state; preserve unique DOM associations and use supported styling hooks for portalled content. |

Removing optional grouping or pages must preserve rules and policies still required. See the [simple-form rubric](simple-form.md) for that reverse test.
