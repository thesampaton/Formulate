import { useState } from "react";
import { Form } from "@formulate/react";
import type { z } from "zod";
import { defineForm } from "./formulate";
import { Email } from "./email";
import { SubmitButton } from "./submit-button";

export const EmailConfirmation = defineForm({
  email: Email,
  confirmEmail: { ...Email, label: "Confirm email", componentProps: { ...Email.componentProps, autoComplete: "off" } },
}, {
  schema: (schema) => schema.refine((values) => values.email === values.confirmEmail, {
    path: ["confirmEmail"], message: "Email addresses must match.",
  }),
});

export type EmailConfirmationValues = z.output<typeof EmailConfirmation.schema>;

export function EmailConfirmationForm({ onConfirm }: { onConfirm: (values: EmailConfirmationValues) => Promise<void> | void }) {
  const form = EmailConfirmation.useForm();
  return <Form form={form} onSubmit={onConfirm}>
    <EmailConfirmation.Fields />
    <SubmitButton pendingLabel="Confirming…">Confirm email address</SubmitButton>
  </Form>;
}

export function EmailConfirmationExample() {
  const [accepted, setAccepted] = useState<EmailConfirmationValues>();
  return <>
    <h2>Confirm your email</h2>
    <p className="card-description">Enter your email twice. Both addresses must be valid and match exactly.</p>
    <EmailConfirmationForm onConfirm={setAccepted} />
    {accepted ? <div role="status"><p>Last accepted demo values</p><pre>{JSON.stringify(accepted, null, 2)}</pre></div> : null}
  </>;
}
