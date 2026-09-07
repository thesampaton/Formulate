# Employee onboarding

[Scenario rubric](README.md)

Employee onboarding is an original Part 9 hero scenario. This proposed example tests reusable pages, fields, bindings, and progression. The notation is not a published API.

An organisation collects employment details, asks for equipment, and reviews the request. Its internal-transfer form needs the same employment interaction but continues directly to review. The reusable page should carry its presentation and requirements without hardcoding a destination in its original form.

Employment groups independent inputs using existing library fields. EquipmentRequest is another existing section. EmploymentSetup receives a reference to an existing Employment instance; the host owns its binding. Connecting this reference does not copy fields or create a second value store.

```text
library section Employment
  type = use EmploymentType at employmentType
  start = use Date at startDate
  manager = use EmployeePicker at managerId
  require: type, start, manager

library page EmploymentSetup
  input: details (existing Employment section instance)
  present details
  Continue: require applicable details complete; emit Continue

form EmployeeOnboarding
  employment = use Employment at employment
  equipment = use EquipmentRequest at equipment
  setup = use EmploymentSetup
    details <- employment
  workflow: on setup.Continue, go to Equipment
  page Equipment: present equipment
  page Review: review employment, equipment
  submit: validate applicable requirements; send applicable values
    to application.requestEmployeeOnboarding

form InternalTransfer
  employment = use Employment at proposedEmployment
  setup = use EmploymentSetup
    details <- employment
  workflow: on setup.Continue, go to Review
  page Review: review employment
  submit: validate employment requirements; send employment values
    to application.requestInternalTransfer
```

The page's `Continue` outcome expresses successful local progression; the host's workflow supplies its destination. Section child bindings such as `managerId` stay relative to that section's explicit root. The two forms choose different roots deliberately; reusing the page does not rename data. Its identity is independent of the route or tab label used to present it. A wizard step is this page presented in sequence.

**Completion and state:** current field requirements determine Employment section completion; setup checks its assigned details and local requirements. Equipment and the whole form have their own applicable requirements. Visiting Review creates no fields, duplicate counts, or acknowledgement; add an explicit requirement if acknowledgement matters. Current completion is separate from touched, visited, saved, or accepted state, and can regress when dependencies change. Values and field state live across pages at the form boundary.

| Proposed change | Invariant expectations |
| --- | --- |
| Reuse EmploymentSetup in InternalTransfer, then customise its layout. | Both hosts retain the packaged readiness rules. The transfer host selects Review as the destination. Custom rendering presents the existing section and fields, preserving their bindings and identities. |
| Change employment type after completing an equipment request. | Declare the equipment policy explicitly: when inapplicable, retain its draft, skip its requirements, and exclude it from submission. Returning to an applicable type rechecks retained answers. An off-screen employment page remains applicable. |
| Unmount setup when navigating to Equipment, then return using a different route or tab label. | Preserve page and field identities, values, errors, and current completion. A full document reload needs draft persistence and re-evaluation. A completed setup page cannot certify incomplete equipment or the whole form. |
| The application requests a different manager after submission. | Return the requirement through an explicit handoff with an error or reason attached to the relevant request. Preserve unrelated work, invalidate affected readiness, and expose an understandable correction action. Do not create another manager field to display the rejection. |

Formulate owns the input interaction and its next available actions. HR services own employee records, permissions, approval decisions, equipment fulfilment, and durable onboarding progress. Reaching Review or having a submission accepted must not be presented as proof that those business operations are complete.

**Open design question:** Can the eventual page authoring API make receiving an existing section and conveniently creating a locally bound section equally readable, while preserving one clear identity and binding for each field?
