# Focused Example — A Simple Form Stays Simple

**A form can contain fields directly. Pages, sections, and library definitions are optional.** This example tests the smallest useful authoring path through the [mental model](../03-mental-model.md), alongside the larger [scenario rubric](README.md).

## The baseline

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

This shorthand is a rubric, not a proposed API. In this simple case, `field email` supplies one authored value key from which binding and default field identity can be inferred. It needs no separate alias, ID, registration, or presentation declaration. Ordered inline children supply presentation order. More explicit bindings and references remain available when the composition needs them.

`action submit` is the ordinary rendered submit control connected to the form's handler, not another action-registry declaration.

The two fields participate directly in form validation, errors, and completion. Submit checks the applicable requirements and hands the current `email` and `password` values to `application.signIn`. The form records that attempt and its result; the application handles sign-in. No synthetic page needs an authored identity, visit state, completion indicator, or navigation policy.

A compatible renderer provides the ordinary binding, label/help/error associations, and focus integration. Documented defaults handle the ordinary value engine, validation/error timing, and submission path. Authors supply labels and actual requirements; they should not have to redeclare those integration defaults or invent retention, draft, or navigation policies for this baseline. A bare Input without the field integration remains an ordinary control.

## Grow only where the requirement grows

Each row is a small change to the same form, rather than a prerequisite for the next row.

| Change | What should need authoring |
| --- | --- |
| Put fields in a CSS row. | Add a class/style to the existing container or an ordinary layout wrapper. No Section or second ordering list. |
| Disclose one advanced field. | Declare a checkbox and the extra field inline; give the field `visible when showAdvanced.value`. The direct reference needs no group or registry. Disclosure preserves its requirements; a hidden error still needs a reachable correction path. |
| Reuse the email field elsewhere. | Extract its configuration into a library field, preserving this use's binding, identity, state, and rules. Other fields stay inline. |
| Reuse related fields and their rules. | Extract an ordinary component, or introduce a Section when the group needs semantic identity, requirements, or state. Reuse alone and visual rows need no Section. |
| Split the experience into two pages. | Add page presentations and the required navigation. Preserve existing fields, values, dependencies, and domain rules. Add page requirements only where the new experience calls for them. |
| Remove pages or a section. | Keep fields and rehome still-needed rules, conditions, retention/inclusion policies, and inherited defaults. Intentionally remove obsolete navigation/visit obligations. Removing a scope must not silently change remaining behaviour. |
| Show a server rejection. | Attach the handler's feedback to the relevant attempt and fields or form, preserving entered values. No architectural rewrite. |

## The acceptance budget

For the baseline, require:

- **Zero authored Pages, Sections, library definitions, registry entries, separate reference declarations, or duplicate presentation lists.**
- **One authored value key per field; each rule declared once.**
- One submit connection and one submit action, with normal integration defaults already available.
- Field and form errors/completion without an extra completion configuration or value store.

Later API prototypes must demonstrate these properties with real code and useful inference. Count independent edits when adding and removing the features above; concise pseudocode is not measured implementation ease. The [pressure tests](../03-mental-model-pressure-tests.md) must continue to pass as the form grows or shrinks.
