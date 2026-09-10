import { EmployeeOnboarding, InternalTransfer } from "../examples/react/src/declarations/employee-workflows";
import { bindEmploymentSetup } from "../examples/react/src/components/formulate/employment-setup";

function EmploymentBindings() {
  const onboarding = EmployeeOnboarding.useForm();
  const transfer = InternalTransfer.useForm();
  bindEmploymentSetup(onboarding, "employment");
  bindEmploymentSetup(transfer, "proposedEmployment");
  // @ts-expect-error An equipment string cannot supply the Employment editing contract.
  bindEmploymentSetup(onboarding, "equipment");
  // @ts-expect-error The page cannot guess a path from another host.
  bindEmploymentSetup(transfer, "employment");
  // @ts-expect-error Local leaf fields are not complete Employment bindings.
  bindEmploymentSetup(onboarding, "employment.managerId");
}
void EmploymentBindings;
