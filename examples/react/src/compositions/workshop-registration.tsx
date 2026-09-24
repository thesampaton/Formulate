import { z } from "zod";
import { defineForm, defineSection } from "@/lib/formulate-config";
import { FieldGroup } from "@/components/ui/field";
import { FormSubmitButton } from "@/components/formulate/form-actions";

export const WorkshopRegistration = defineForm({
  contact: defineSection({
    name: {
      schema: z.string().trim().min(1, "Enter your name."),
      defaultValue: "", label: "Name", component: "input",
    },
    email: {
      schema: z.email("Enter a valid email address."),
      defaultValue: "", label: "Email", component: "input",
      componentProps: { type: "email" },
    },
  }, { title: "Contact details", layout: FieldGroup }),
  needsInvoice: {
    schema: z.boolean(), defaultValue: false,
    label: "I need an invoice", component: "checkbox", orientation: "horizontal",
  },
  company: {
    schema: z.string().trim().min(1, "Enter a company name."),
    defaultValue: "", label: "Company name", component: "input",
    applicable: { binding: "needsInvoice", equals: true },
  },
}, { id: "workshop-registration", layout: FieldGroup });

export type Registration = z.output<typeof WorkshopRegistration.schema>;

export function WorkshopRegistrationForm({ onRegister }: {
  onRegister: (values: Registration) => void | Promise<void>;
}) {
  const form = WorkshopRegistration.useForm();
  return (
    <WorkshopRegistration.Form form={form} onSubmit={onRegister}>
      <WorkshopRegistration.Fields />
      <FormSubmitButton pendingLabel="Registering…">Register</FormSubmitButton>
    </WorkshopRegistration.Form>
  );
}
