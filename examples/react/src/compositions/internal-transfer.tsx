import { useRef } from "react";
import { Page, useFormNavigation } from "@formulate/react";
import type { LayoutProps } from "@formulate/react";
import { InternalTransfer } from "@/declarations/employee-workflows";
import type { InternalTransferPayload, InternalTransferValues } from "@/declarations/employee-workflows";
import { EmploymentSetup, EmploymentSummary } from "@/components/formulate/employment-setup";
import { Row, Stack, ActionRow } from "@/components/formulate/layouts";
import { FormNavigationButton, FormSubmitButton } from "@/components/formulate/form-actions";

export function InternalTransferForm({ onSubmit, defaultValues, layout = Row }: {
  onSubmit: (payload: InternalTransferPayload) => void | Promise<void>;
  defaultValues?: InternalTransferValues;
} & LayoutProps) {
  const form = InternalTransfer.useForm({ defaultValues, shouldFocusError: false });
  const setup = InternalTransfer.bindSection("proposedEmployment");
  const navigation = useFormNavigation<InternalTransferValues, "setup" | "review">({
    form, initialPage: "setup", destinations: [{ scope: setup, page: "setup" }],
  });
  const review = useRef<HTMLDivElement>(null);

  return <InternalTransfer.Form aria-label="Internal transfer" form={form} onSubmit={onSubmit}
    onInvalid={(errors) => {
      if (!navigation.correct(errors)) form.setError("root.submit", { message: "Review the form errors before continuing." });
    }}
    navigation={navigation.page === "setup" ? { id: navigation.revision, scope: setup, onValid: () => navigation.goTo("review", () => review.current?.focus()) } : undefined}>
    <h2>Internal transfer</h2>
    <setup.Section layout={null}>
      <EmploymentSetup id="transfer-setup" active={navigation.page === "setup"} layout={layout} />
    </setup.Section>
    <Page id="transfer-review" title="Review transfer" active={navigation.page === "review"} layout={Stack}>
      <div ref={review} tabIndex={-1} role="group" aria-label="Transfer summary">
        <setup.Section layout={null}><EmploymentSummary /></setup.Section>
      </div>
      <ActionRow>
        <FormNavigationButton onClick={() => navigation.goTo("setup", () => setup.focusFirst(form))}>Edit employment</FormNavigationButton>
        <FormSubmitButton>Request transfer</FormSubmitButton>
      </ActionRow>
    </Page>
  </InternalTransfer.Form>;
}
