import type { z } from "zod";
import { defineForm, field } from "@/lib/formulate-config";
import { Email } from "./email";

export const EmailConfirmation = defineForm({
  email: field(Email),
  confirmEmail: field(Email, { label: "Confirm email", componentProps: { autoComplete: "off" } }),
}, {
  schema: (schema) => schema.refine((values) => values.email === values.confirmEmail, {
    path: ["confirmEmail"], message: "Email addresses must match.",
  }),
});

export type EmailConfirmationValues = z.output<typeof EmailConfirmation.schema>;
