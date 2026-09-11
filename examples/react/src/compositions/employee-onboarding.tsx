import { useRef } from "react";
import { useWatch } from "react-hook-form";
import { Page, useFormNavigation } from "@formulate/react";
import type { LayoutProps } from "@formulate/react";
import { EmployeeOnboarding } from "@/declarations/employee-workflows";
import type { EmployeeOnboardingPayload, EmployeeOnboardingValues } from "@/declarations/employee-workflows";
import { EmploymentSetup, EmploymentSummary } from "@/components/formulate/employment-setup";
import { Stack, ActionRow } from "@/components/formulate/layouts";
import { FormContinueButton, FormNavigationButton, FormSubmitButton } from "@/components/formulate/form-actions";

export function EmployeeOnboardingForm({ onSubmit, defaultValues, layout = Stack }: {
  onSubmit: (payload: EmployeeOnboardingPayload) => void | Promise<void>;
  defaultValues?: EmployeeOnboardingValues;
} & LayoutProps) {
  const form = EmployeeOnboarding.useForm({ defaultValues, shouldFocusError: false });
  const setup = EmployeeOnboarding.bindSection("employment");
  const navigation = useFormNavigation<EmployeeOnboardingValues, "setup" | "equipment" | "review">({
    form, initialPage: "setup",
    destinations: [{ scope: setup, page: "setup" }, { name: "equipment", page: "equipment" }],
  });
  const equipment = useWatch({ control: form.control, name: "equipment" });
  const reviewHeadingRef = useRef<HTMLDivElement>(null);
  const goToEmploymentSetup = () => navigation.goToPage("setup", () => setup.focusFirstField(form));
  const goToReview = () => navigation.goToPage("review", () => reviewHeadingRef.current?.focus());

  return <EmployeeOnboarding.Form aria-label="Employee onboarding" form={form} onSubmit={onSubmit}
    onInvalid={(errors) => {
      if (!navigation.goToFirstError(errors)) form.setError("root.submit", { message: "Review the form errors before continuing." });
    }}
    scopedAction={navigation.page === "setup" ? { id: navigation.revision, scope: setup, onValid: () => navigation.goToPage("equipment", () => form.setFocus("equipment")) }
      : navigation.page === "equipment" ? { id: navigation.revision, errorPaths: ["equipment"], onValid: goToReview } : undefined}>
    <h2>Employee onboarding</h2>
    <setup.Section layout={null}>
      <EmploymentSetup pageId="onboarding-setup" active={navigation.page === "setup"} layout={layout} />
    </setup.Section>
    <Page pageId="onboarding-equipment" title="Equipment" active={navigation.page === "equipment"} layout={Stack}>
      <EmployeeOnboarding.Field name="equipment" />
      <ActionRow><FormNavigationButton onClick={goToEmploymentSetup}>Back</FormNavigationButton><FormContinueButton>Continue</FormContinueButton></ActionRow>
    </Page>
    <Page pageId="onboarding-review" title="Review onboarding" active={navigation.page === "review"} layout={Stack}>
      <div ref={reviewHeadingRef} tabIndex={-1} role="group" aria-label="Onboarding summary">
        <setup.Section layout={null}><EmploymentSummary /></setup.Section>
        <p>Equipment: {equipment}</p>
      </div>
      <ActionRow>
        <FormNavigationButton onClick={goToEmploymentSetup}>Edit employment</FormNavigationButton>
        <FormNavigationButton onClick={() => navigation.goToField("equipment")}>Edit equipment</FormNavigationButton>
        <FormSubmitButton>Request onboarding</FormSubmitButton>
      </ActionRow>
    </Page>
  </EmployeeOnboarding.Form>;
}
