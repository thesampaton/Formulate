import { useRef } from "react";
import { Page, useFormNavigation } from "@formulate/react";
import type { LayoutProps } from "@formulate/react";
import { InternalTransfer } from "@/declarations/employee-workflows";
import type { InternalTransferPayload, InternalTransferValues } from "@/declarations/employee-workflows";
import { bindEmploymentSetup, EmploymentSetup, EmploymentSummary } from "@/components/formulate/employment-setup";
import { Row, Stack, ActionRow } from "@/components/formulate/layouts";
import { FormNavigationButton, FormSubmitButton } from "@/components/formulate/form-actions";

export function InternalTransferForm({ onSubmit, defaultValues, layout = Row }: {
  onSubmit: (payload: InternalTransferPayload) => void | Promise<void>;
  defaultValues?: InternalTransferValues;
} & LayoutProps) {
  const form = InternalTransfer.useForm({ defaultValues, shouldFocusError: false });
  const setup = bindEmploymentSetup(form, "proposedEmployment");
  const navigation = useFormNavigation<InternalTransferValues, "setup" | "review">({
    form, initialPage: "setup", destinations: setup.destinations("setup"),
  });
  const review = useRef<HTMLDivElement>(null);

  return <InternalTransfer.Form aria-label="Internal transfer" form={form} onSubmit={onSubmit}
    onInvalid={(errors) => {
      if (!navigation.correct(errors)) form.setError("root.submit", { message: "Review the form errors before continuing." });
    }}
    navigation={navigation.page === "setup" ? setup.continueAction(navigation.revision, () => navigation.goTo("review", () => review.current?.focus())) : undefined}>
    <h2>Internal transfer</h2>
    <InternalTransfer.Section name={setup.root} layout={null}>
      <EmploymentSetup id="transfer-setup" active={navigation.page === "setup"} layout={layout} />
    </InternalTransfer.Section>
    <Page id="transfer-review" title="Review transfer" active={navigation.page === "review"} layout={Stack}>
      <div ref={review} tabIndex={-1} role="group" aria-label="Transfer summary">
        <InternalTransfer.Section name={setup.root} layout={null}><EmploymentSummary /></InternalTransfer.Section>
      </div>
      <ActionRow>
        <FormNavigationButton onClick={() => navigation.goTo("setup", setup.focusFirst)}>Edit employment</FormNavigationButton>
        <FormSubmitButton>Request transfer</FormSubmitButton>
      </ActionRow>
    </Page>
  </InternalTransfer.Form>;
}
