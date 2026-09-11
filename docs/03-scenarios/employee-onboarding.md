# Employee onboarding

[Scenario rubric](README.md) · [Mental model](../03-mental-model.md)

Employee onboarding and internal transfer share an employment page. The page carries its local requirements; each host chooses where Continue leads.

**Status: gate 1 demonstrated for synchronous section requirements.** [Onboarding](../../examples/react/src/compositions/employee-onboarding.tsx) and [internal transfer](../../examples/react/src/compositions/internal-transfer.tsx) share the [EmploymentSetup page](../../examples/react/src/components/formulate/employment-setup.tsx), backed by one Employment declaration and a bound section use in each host. Eleven [interaction cases](../../tests/employee-workflows.test.tsx) cover the acceptance sequence below. The result uses no page-definition API; see the [contract decision](../05-06-rendering-and-workflow.md#course-corrections-retained).

```text
library section Employment
  type = use EmploymentType at employmentType
  start = use Date at startDate
  manager = use EmployeePicker at managerId
  require: type, start, manager

library page EmploymentSetup
  input: details (existing Employment section instance)
  layout default: Stack
  present details
  Continue: require applicable details complete; emit Continue

form EmployeeOnboarding
  employment = use Employment at employment
  equipment = use EquipmentRequest at equipment
  setup = use EmploymentSetup
    details <- employment
    layout: Stack
  workflow: on setup.Continue, go to Equipment
  page Equipment: present equipment
  page Review: review employment, equipment
  submit: validate applicable requirements; send applicable values
    to application.requestEmployeeOnboarding

form InternalTransfer
  employment = use Employment at proposedEmployment
  setup = use EmploymentSetup
    details <- employment
    layout: TwoColumn
  workflow: on setup.Continue, go to Review
  page Review: review employment
  submit: validate employment requirements; send employment values
    to application.requestInternalTransfer
```

Each host binds its existing Employment section once. That use supplies the section renderer, Continue scope, correction paths and first focus without copied fields. The host supplies the destination. Routes or tab labels do not determine page identity.

Setup completion checks employment requirements. It cannot certify Equipment or the whole onboarding form. Review reads existing values without duplicating their requirements.

## Gate 1: complete page reuse

Implement both hosts using the same EmploymentSetup unit. Treat local requirements and the Continue guard as part of that unit's contract, even if the initial implementation is ordinary React composition. The host installs those requirements into its form boundary once; rendering a page must not be what registers or keeps them alive. Start with the existing-section input shown above before considering another construction API.

| Boundary | Onboarding | Internal transfer |
| --- | --- | --- |
| Binding root | `employment` | `proposedEmployment` |
| Layout | Stack | Two columns with the same reading/focus order |
| Continue destination | Equipment | Review |
| Local requirement source | Shared Employment requirements | The same shared requirements |
| Final handler | `application.requestEmployeeOnboarding` | `application.requestInternalTransfer` |

The page receives its bound details and exposes local action intent/correction targets. It does not import a host schema, route name, equipment rule, or final handler. Hosts may map those targets to their own navigation, but must not reconstruct the page's field list or duplicate its validation to make Continue work.

Required executable checks:

1. Mount both forms with different prefills. Edit type, start, and manager in one; confirm the other's values, errors, and control IDs remain independent.
2. Leave each required field empty in turn. Continue is blocked by the same local rule in either layout and focuses that host's correct editor. A valid setup can advance in onboarding while Equipment is still incomplete; it cannot submit the whole form.
3. With valid details, Continue reaches Equipment in onboarding and Review in transfer. Enter and the button use the same local guard. Neither destination is hard-coded in EmploymentSetup.
4. Navigate away, change a required employment value through the shared runtime, and submit or request correction. Unmounted requirements still apply; correction returns to the right page and field. Returning retains editing values.
5. Assert each exact payload root. Replace the page layout without changing bindings or rules; final validation and payload remain identical for that host.

Record the reusable source, host wiring, interaction tests, and a comparison with ordinary RHF/shadcn composition in the implementation anchor. If only the markup is reused while both hosts rebuild readiness or internal paths, this gate has failed. Do not introduce `definePage` solely for naming symmetry with `defineSection`; any helper must resolve demonstrated composition friction.

The changes below remain broader pressure tests. Equipment branching and post-submission reconciliation are not extra requirements for this first gate; branching is exercised coherently in gate 2.

| Change | Required outcome |
| --- | --- |
| Reuse setup in InternalTransfer and customise its layout. | Keep its local readiness rules and existing field identities; the host still chooses Review. |
| Change employment type after requesting equipment. | Explicitly retain the equipment draft, skip requirements, and exclude values when inapplicable. Recheck retained answers if it applies again. |
| Unmount setup during navigation. | Keep values, errors, and current completion at the form boundary. Being off-screen does not make employment inapplicable. |
| The application requests another manager after submission. | Attach the reason to the relevant attempt and existing manager field; preserve unrelated work and expose correction. |

HR services own employee records, permissions, approvals, equipment fulfilment, and durable onboarding progress. Reaching Review or receiving request acceptance does not complete those operations.

**Result:** the current reusable page needs only an existing bound section plus host-owned destinations. A page-definition API remains deferred until page-local obligations beyond those sections demonstrate a missing contract.
