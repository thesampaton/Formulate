# Employee onboarding

[Scenario rubric](README.md) · [Mental model](../03-mental-model.md)

Employee onboarding and internal transfer share an employment page. The page carries its local requirements; each host chooses where Continue leads.

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

EmploymentSetup receives an existing section reference; it creates no copied fields. The host supplies the binding root and destination. Section child bindings remain relative to that root, while routes or tab labels do not determine page identity.

Setup completion checks employment requirements. It cannot certify Equipment or the whole onboarding form. Review reads existing values without duplicating their requirements.

| Change | Required outcome |
| --- | --- |
| Reuse setup in InternalTransfer and customise its layout. | Keep its local readiness rules and existing field identities; the host still chooses Review. |
| Change employment type after requesting equipment. | Explicitly retain the equipment draft, skip requirements, and exclude values when inapplicable. Recheck retained answers if it applies again. |
| Unmount setup during navigation. | Keep values, errors, and current completion at the form boundary. Being off-screen does not make employment inapplicable. |
| The application requests another manager after submission. | Attach the reason to the relevant attempt and existing manager field; preserve unrelated work and expose correction. |

HR services own employee records, permissions, approvals, equipment fulfilment, and durable onboarding progress. Reaching Review or receiving request acceptance does not complete those operations.

**Later API question:** Can a reusable page receive an existing section or create a locally bound one with equally clear authoring?
