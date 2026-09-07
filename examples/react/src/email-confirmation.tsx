import { useState } from "react";
import { Form, Section, useFormulate } from "@formulate/react";
import { z } from "zod";
import { defineForm, Field } from "./formulate";
import { Email } from "./email";
import { SubmitButton } from "./submit-button";

export const EmailConfirmation = defineForm({
  email: Email,
  confirmEmail: { ...Email, label: "Confirm email", componentProps: { ...Email.componentProps, autoComplete: "off" } },
});

// Compose once at module scope. The definition's original useForm hook still
// uses its original schema, so this boundary is passed explicitly to useFormulate.
export const emailConfirmationBoundary = {
  schema: EmailConfirmation.schema.refine((values) => values.email === values.confirmEmail, {
    path: ["confirmEmail"], message: "Email addresses must match.",
  }),
  defaultValues: EmailConfirmation.defaultValues,
};

// The same requirement under an explicit object binding. Section does not
// introduce this path; the schema, defaults, and Field names declare it.
export const nestedEmailConfirmationSchema = z.object({ contact: emailConfirmationBoundary.schema });
const nestedDefaults = { contact: { email: Email.defaultValue, confirmEmail: Email.defaultValue } };

export type EmailConfirmationValues = z.output<typeof emailConfirmationBoundary.schema>;
export type NestedEmailConfirmationValues = z.output<typeof nestedEmailConfirmationSchema>;

export function FlatEmailConfirmation({ onConfirm }: { onConfirm: (values: EmailConfirmationValues) => Promise<void> | void }) {
  const form = useFormulate(emailConfirmationBoundary);
  return <Form form={form} onSubmit={onConfirm}>
    <EmailConfirmation.Fields />
    <SubmitButton pendingLabel="Confirming…">Confirm email address</SubmitButton>
  </Form>;
}

export function NestedEmailConfirmation({ onConfirm }: { onConfirm: (values: NestedEmailConfirmationValues) => Promise<void> | void }) {
  const form = useFormulate(nestedEmailConfirmationSchema, { defaultValues: nestedDefaults });
  return <Form form={form} onSubmit={onConfirm}>
    <Section title="Contact">
      <Field control={form.control} name="contact.email" label={Email.label} component={Email.component} componentProps={Email.componentProps} />
      <Field control={form.control} name="contact.confirmEmail" label="Confirm email" component={Email.component} componentProps={{ ...Email.componentProps, autoComplete: "off" }} />
    </Section>
    <SubmitButton pendingLabel="Confirming…">Confirm email address</SubmitButton>
  </Form>;
}

export function EmailConfirmationExample() {
  const [nested, setNested] = useState(false);
  const [accepted, setAccepted] = useState<EmailConfirmationValues | NestedEmailConfirmationValues>();
  return <>
    <h2>Confirm your email</h2>
    <p className="card-description">Enter your email twice. Both addresses must be valid and match exactly.</p>
    <label className="flex items-center gap-2 mb-6 text-sm">
      <input type="checkbox" checked={nested} onChange={(event) => { setNested(event.target.checked); setAccepted(undefined); }} />
      Use nested contact details (starts a fresh form)
    </label>
    {nested ? <NestedEmailConfirmation onConfirm={setAccepted} /> : <FlatEmailConfirmation onConfirm={setAccepted} />}
    {accepted ? <div role="status"><p>Last accepted demo values</p><pre>{JSON.stringify(accepted, null, 2)}</pre></div> : null}
  </>;
}
