import { EmployeeOnboarding, InternalTransfer } from "../examples/react/src/declarations/employee-workflows";

function EmploymentBindings() {
  const onboarding = EmployeeOnboarding.useForm();
  const transfer = InternalTransfer.useForm();
  const onboardingSetup = EmployeeOnboarding.bindSection("employment");
  const transferSetup = InternalTransfer.bindSection("proposedEmployment");
  onboardingSetup.focusFirstField(onboarding);
  transferSetup.focusFirstField(transfer);
  // @ts-expect-error An equipment string cannot supply the Employment editing contract.
  EmployeeOnboarding.bindSection("equipment");
  // @ts-expect-error The page cannot guess a path from another host.
  InternalTransfer.bindSection("employment");
  // @ts-expect-error Local leaf fields are not complete Employment bindings.
  EmployeeOnboarding.bindSection("employment.managerId");
}
void EmploymentBindings;
