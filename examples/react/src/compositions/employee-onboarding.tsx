import { useRef } from "react";
import { useWatch } from "react-hook-form";
import { Page, useFormNavigation } from "@formulate/react";
import type { LayoutProps } from "@formulate/react";
import { EmployeeOnboarding } from "@/declarations/employee-workflows";
import type { EmployeeOnboardingPayload, EmployeeOnboardingValues } from "@/declarations/employee-workflows";
import { bindEmploymentSetup, EmploymentSetup, EmploymentSummary } from "@/components/formulate/employment-setup";
import { Stack, ActionRow } from "@/components/formulate/layouts";
import { FormContinueButton, FormNavigationButton, FormSubmitButton } from "@/components/formulate/form-actions";

export function EmployeeOnboardingForm({ onSubmit, defaultValues, layout = Stack }: {
  onSubmit: (payload: EmployeeOnboardingPayload) => void | Promise<void>;
  defaultValues?: EmployeeOnboardingValues;
} & LayoutProps) {
  const form = EmployeeOnboarding.useForm({ defaultValues, shouldFocusError: false });
  const setup = bindEmploymentSetup(form, "employment");
  const navigation = useFormNavigation<EmployeeOnboardingValues, "setup" | "equipment" | "review">({
    form, initialPage: "setup",
    destinations: [...setup.destinations("setup"), { name: "equipment", page: "equipment" }],
  });
  const equipment = useWatch({ control: form.control, name: "equipment" });
  const review = useRef<HTMLDivElement>(null);
  const toSetup = () => navigation.goTo("setup", setup.focusFirst);
  const toReview = () => navigation.goTo("review", () => review.current?.focus());

  return <EmployeeOnboarding.Form aria-label="Employee onboarding" form={form} onSubmit={onSubmit}
    onInvalid={(errors) => {
      if (!navigation.correct(errors)) form.setError("root.submit", { message: "Review the form errors before continuing." });
    }}
    navigation={navigation.page === "setup" ? setup.continueAction(navigation.revision, () => navigation.goTo("equipment", () => form.setFocus("equipment")))
      : navigation.page === "equipment" ? { id: navigation.revision, fields: ["equipment"], onValid: toReview } : undefined}>
    <h2>Employee onboarding</h2>
    <EmployeeOnboarding.Section name={setup.root} layout={null}>
      <EmploymentSetup id="onboarding-setup" active={navigation.page === "setup"} layout={layout} />
    </EmployeeOnboarding.Section>
    <Page id="onboarding-equipment" title="Equipment" active={navigation.page === "equipment"} layout={Stack}>
      <EmployeeOnboarding.Field name="equipment" />
      <ActionRow><FormNavigationButton onClick={toSetup}>Back</FormNavigationButton><FormContinueButton>Continue</FormContinueButton></ActionRow>
    </Page>
    <Page id="onboarding-review" title="Review onboarding" active={navigation.page === "review"} layout={Stack}>
      <div ref={review} tabIndex={-1} role="group" aria-label="Onboarding summary">
        <EmployeeOnboarding.Section name={setup.root} layout={null}><EmploymentSummary /></EmployeeOnboarding.Section>
        <p>Equipment: {equipment}</p>
      </div>
      <ActionRow>
        <FormNavigationButton onClick={toSetup}>Edit employment</FormNavigationButton>
        <FormNavigationButton onClick={() => navigation.goToField("equipment")}>Edit equipment</FormNavigationButton>
        <FormSubmitButton>Request onboarding</FormSubmitButton>
      </ActionRow>
    </Page>
  </EmployeeOnboarding.Form>;
}
