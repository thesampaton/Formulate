import { Form, Section, useFormulate } from "@formulate/react";
import { z } from "zod";
import { EmailConfirmation } from "../../examples/react/src/email-confirmation";
import { Email } from "../../examples/react/src/email";
import { Field } from "../../examples/react/src/formulate";
import { SubmitButton } from "../../examples/react/src/submit-button";

// Schema-first regression fixture: nesting must preserve the same requirement,
// error destination, and payload without relying on a Section data binding.
export const nestedEmailConfirmationSchema = z.object({ contact: EmailConfirmation.schema });

export function NestedEmailConfirmation({ onConfirm }: {
  onConfirm: (values: z.output<typeof nestedEmailConfirmationSchema>) => Promise<void> | void;
}) {
  const form = useFormulate(nestedEmailConfirmationSchema, {
    defaultValues: { contact: EmailConfirmation.defaultValues },
  });
  return <Form form={form} onSubmit={onConfirm}>
    <Section title="Contact">
      <Field control={form.control} name="contact.email" label={Email.label} component={Email.component} componentProps={Email.componentProps} />
      <Field control={form.control} name="contact.confirmEmail" label="Confirm email" component={Email.component} componentProps={{ ...Email.componentProps, autoComplete: "off" }} />
    </Section>
    <SubmitButton pendingLabel="Confirming…">Confirm email address</SubmitButton>
  </Form>;
}
