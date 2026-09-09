import type { z } from "zod";
import { defineForm } from "@/lib/formulate-config";
import { Email } from "./email";

export const EmailConfirmation = defineForm({
  email: Email,
  confirmEmail: { ...Email, label: "Confirm email", componentProps: { ...Email.componentProps, autoComplete: "off" } },
}, {
  schema: (schema) => schema.refine((values) => values.email === values.confirmEmail, {
    path: ["confirmEmail"], message: "Email addresses must match.",
  }),
});

export type EmailConfirmationValues = z.output<typeof EmailConfirmation.schema>;
