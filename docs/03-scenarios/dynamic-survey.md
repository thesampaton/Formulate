# Dynamic survey or questionnaire

[Scenario rubric](README.md) · [References](../03-references-and-relationships.md)

A household survey repeats member details and conditionally asks about employment. Answers must keep their meaning across branching, reordering, and draft recovery.

This remains a design cross-check. Executable repeat/restoration evidence lives in [infrastructure provisioning, gate 3](infrastructure-provisioning.md#gate-3-repeated-sections-and-draft-restoration); apply the version/identity cases here to that shared contract rather than building a second persistence mechanism.

```text
library section EmploymentDetails
  employer = field at employer
    control: Input
    validate: required
  role = field at role
    control: Input
    validate: required

library section HouseholdMember
  name = field at name
    control: Input
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

Each member resolves the employment condition locally. An unemployed member's employment answers remain in the draft but do not block completion or enter submission. Switching back rechecks them. Navigating away has none of those branch effects.

`declaration` identifies a field use; `householdDescription` is its binding. Wording and page position determine neither. A materially different question requires an intentional identity and data-contract decision.

| Change | Required outcome |
| --- | --- |
| Switch employment branches and return. | Retain draft answers, omit inactive values, and re-evaluate restored requirements. Review follows the same applicability policy. |
| Reorder or remove a member before correcting an error. | Answers, errors, and dependencies stay attached to the person, not their former array index. |
| Recover a draft after questions or rules change. | Identify its definition version; continue that version or migrate explicitly. Re-evaluate requirements without silently reinterpreting answers. |
| Split a member across pages, then change employment status. | Recompute affected completion, including off-screen fields. A completed page need not complete the whole member section. |

A full reload uses persisted draft data and re-evaluates it; previous completion markers cannot certify current answers. The application owns response persistence and definition-version recovery policy.

**Later API question:** When a draft's definition is unavailable, how does the application choose between migration, an available earlier version, or requesting affected answers again?
