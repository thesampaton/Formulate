# A simple form stays simple

[Scenario rubric](README.md) · [Mental model](../03-mental-model.md)

**A form can contain fields directly. Pages, sections, and library definitions are optional.**

```text
form SignIn submit application.signIn
  field email
    control: Input
    label: Email
    rules: required, valid email

  field password
    control: Input
    label: Password
    type: password
    rules: required

  action submit
    label: Sign in
```

This illustrates the authoring bar, not chosen syntax. Each field needs one value key; ordered children supply presentation. `action submit` is the rendered submit control connected to the handler.

Fields participate directly in form validation, errors, and completion. Submit checks applicable requirements and passes `email` and `password` to `application.signIn`. Ordinary binding, label/error associations, focus integration, and submission defaults come from the field integration. No synthetic page needs configuration.

## Add only what changes

Each row is an independent addition to the same form.

| Requirement | Expected authoring |
| --- | --- |
| Put fields in a CSS row. | Add a container class or ordinary layout wrapper. |
| Disclose an advanced field. | Add a checkbox and `visible when showAdvanced.value` on that field. Keep hidden errors reachable for correction. |
| Reuse Email. | Extract its configuration; preserve this use's binding and behaviour. Other fields stay inline. |
| Reuse related fields. | Extract an ordinary component; add a Section only when the group needs semantic identity, requirements, or state. |
| Split into pages. | Add page presentation and navigation while preserving fields, dependencies, and domain rules. |
| Remove pages or a section. | Remove obsolete navigation; relocate still-needed rules, conditions, policies, and defaults. |
| Show a server rejection. | Attach feedback to its attempt and affected fields or form, preserving entered values. |

## Acceptance budget

- **Zero authored Pages, Sections, library definitions, registry entries, separate references, payload mapper, or duplicate presentation lists.**
- **One value key per field; each rule declared once.**
- One submit connection and rendered submit control.
- Field and form errors/completion without an extra configuration or value store.

Actual API prototypes must meet this bar. Measure required concepts and independent edits when growing or shrinking the form; short pseudocode alone does not prove easy authoring.

## Definition-helper pressure test

The executable [email-confirmation example](../../examples/react/src/email-confirmation.tsx) adds one relationship: both valid email addresses must match exactly. The visible example focuses on field reuse and the matching rule. A [test fixture](../../tests/fixtures/nested-email-confirmation.tsx) preserves the comparison with explicit nested bindings. The [shared Email configuration](../../examples/react/src/email.ts) is also reused by sign-in without changing its behaviour.

Acceptance invariants, covered by [interaction tests](../../tests/definition-pressure.test.tsx):

- Reusing Email creates independent values and accessible control IDs. A per-use label or autocomplete override leaves the source declaration intact.
- A mismatch blocks submission and associates the relationship error with the confirmation editor; correction focuses that editor.
- Changing the original email after a successful confirmation invalidates the relationship on the next submission.
- The rule runs before the confirmation editor first mounts and after it unmounts. Values survive unmounting.
- Rerendering preserves entered values and control identity. Simultaneous form instances stay independent.
- Nesting under `contact` changes the payload only through explicit schema/default/binding paths. A Section alone introduces no data object.

The example renders declaration order through `Fields`. Its schema option declares the equality rule once, and the bound `useForm()` hook includes it. The schema-first nested case remains in tests to verify nested error paths and exact payloads. There is no comparison toggle in the visible form; customer onboarding demonstrates section composition.
