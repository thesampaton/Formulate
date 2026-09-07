# Dynamic survey or questionnaire

[Scenario rubric](README.md)

A household survey asks shared questions, repeats member details, and reveals employment questions for employed members. Respondents can change answers, reorder members, leave, and recover a draft. The test is whether question meaning and answers survive changes to branches, presentation, and the survey definition.

The following is illustrative pseudocode, not TypeScript or a proposed public API. Basic text fields configure local shadcn Input controls inline; Age and EmploymentStatus are reusable library fields. The member section owns the relationship between employment status and employment details; each repeated use resolves it within its own member.

```text
library section EmploymentDetails
  employer = field at employer
    control: Input
    placeholder: Enter employer
    validate: required
  role = field at role
    control: Input
    placeholder: Enter role
    validate: required

library section HouseholdMember
  name = field at name
    control: Input
    placeholder: Enter member name
    validate: required
  age = use Age at age
  employmentStatus = use EmploymentStatus at employmentStatus

  employment = use EmploymentDetails at employment
    when employmentStatus.value == "employed"
    inactive: retain values; skip their requirements; exclude from payload

form HouseholdSurvey
  declaration = field at householdDescription
    control: Input
    placeholder: Describe your household
  members = repeat HouseholdMember at members
    keyed by stable item identity

  page Household
    present declaration
  page Members
    present members
  page Review
    review declaration, members
  workflow: Household -> Members -> Review

  save draft with definition version, values, and member identities
  submit applicable values to application.recordSurveyResponse
```

Inline fields are ordinary instances, needing no named definition or registry entry. They share the library uses' binding, state, and completion model. Extracting a repeated question into a library later preserves its instances' identities, values, configuration, and rules.

Changing one member from employed to unemployed makes that member's employment section inapplicable. Its answers remain in the draft but neither block progression nor enter the submitted response. Other members are unaffected. Switching back rechecks the retained answers under the current requirements; an earlier completion marker does not certify them automatically. Merely navigating away from the Members page has none of these branch effects.

`declaration` is the identity of a declared field use; `householdDescription` is its value binding. Neither depends on displayed wording or page position. Page identities are also independent of route paths and tab labels. A revised label, layout, or review view can refer to the same field. A materially different question requires an intentional identity and data-contract decision.

**Completion and state:** current field requirements feed each repeated member's section completion, the assigned page's completion, and form completion. Inapplicable employment requirements do not block any of them. Review references do not duplicate fields or their requirement counts, and visiting it is not acknowledgement. An explicit review requirement can contribute its own page obligation. Touched, visited, draft-save, and submission state remain separate from completion. The form retains values, errors, and pending work when pages unmount.

| Change to pressure-test | Required outcome |
| --- | --- |
| Enter employment answers, switch branches, and return. | Retain draft work, omit inactive answers from the payload, and re-evaluate restored requirements. Review follows the same applicability rules as data entry. |
| Reorder members or remove one before correcting a validation error. | Answers, errors, and internal dependencies remain attached to stable member identities. The error cannot move to another person because their array index changed. |
| Recover a draft after questions or branching rules change. | Identify its original definition version. Continue on that version or explicitly migrate to a compatible definition; never silently reinterpret old answers. Re-evaluate requirements and prior completion after recovery. |
| Split a member's fields across pages, navigate away, then change employment status. | A page checks its assigned members and local requirements; the whole member section and form can remain incomplete. Recompute affected off-screen completion. A full document reload uses the persisted draft and re-evaluates it rather than trusting visited or saved markers. |

**Open design question:** Who selects the recovery policy when a saved draft's definition version is unavailable or incompatible: continue an available earlier version, apply an application-supplied migration, or request the affected answers again?
