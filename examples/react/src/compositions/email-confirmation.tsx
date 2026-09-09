import { EmailConfirmation } from "@/declarations/email-confirmation";
import type { EmailConfirmationValues } from "@/declarations/email-confirmation";
import { Form } from "@formulate/react";
import { FormSubmitButton } from "@/components/formulate/form-actions";

export function EmailConfirmationForm({ onConfirm }: { onConfirm: (values: EmailConfirmationValues) => Promise<void> | void }) {
  const form = EmailConfirmation.useForm();
  return <Form form={form} onSubmit={onConfirm}>
    <EmailConfirmation.Fields />
    <FormSubmitButton pendingLabel="Confirming…">Confirm email address</FormSubmitButton>
  </Form>;
}
