import { z } from "zod";
import { defineField } from "@/lib/formulate";

// Source-owned semantics: no control implementations or application control map.
export const Email = defineField({
  primitive: "text",
  schema: z.email("Enter a valid email address."),
  defaultValue: "",
  label: "Email",
  component: "input",
  componentProps: { type: "email", autoComplete: "email", placeholder: "you@example.com" },
});

// Presence only: sign-up password policy belongs to an explicit derived definition.
export const Password = defineField({
  primitive: "text",
  schema: z.string().min(1, "Enter your password."),
  defaultValue: "",
  label: "Password",
  component: "input",
  componentProps: { type: "password", autoComplete: "current-password" },
});

export const Url = defineField({
  primitive: "text",
  schema: z.url("Enter a valid URL."),
  defaultValue: "",
  label: "URL",
  component: "input",
  componentProps: { type: "url", autoComplete: "url" },
});

// A deliberately modest format check, with no locale-specific normalisation.
export const Phone = defineField({
  primitive: "text",
  schema: z.string().regex(/^\+?[0-9 ()\-.]+$/, "Enter a phone number.")
    .refine((value) => value.replace(/\D/g, "").length >= 7, "Enter at least seven digits."),
  defaultValue: "",
  label: "Phone",
  component: "input",
  componentProps: { type: "tel", autoComplete: "tel" },
});

// Numeric major units, allowing credits. Currency/unit/rounding policy stays local.
export const Currency = defineField({
  primitive: "number",
  schema: z.number("Enter an amount."),
  defaultValue: 0,
  label: "Amount",
  component: "currencyInput",
  componentProps: { step: "0.01", inputMode: "decimal" },
});

export const Percentage = defineField({
  primitive: "number",
  schema: z.number().min(0).max(100),
  defaultValue: 0,
  label: "Percentage",
  component: "number",
  componentProps: { min: 0, max: 100, step: "0.01", inputMode: "decimal" },
});

// Format only. Supply the app's country options and membership policy at the use.
export const Country = defineField({
  primitive: "choice",
  schema: z.string().regex(/^[A-Z]{2}$/, "Choose a two-letter country code."),
  defaultValue: "",
  label: "Country",
  component: "combobox",
  componentProps: { placeholder: "Choose a country" },
});

const requiredDate = (message: string) => z.date().nullable().refine((date) => date !== null, message);
export const DateRange = defineField({
  primitive: "object",
  schema: z.object({ from: requiredDate("Choose a start date."), to: requiredDate("Choose an end date.") })
    .refine(({ from, to }) => !from || !to || to >= from, { message: "End date must follow the start date.", path: ["to"] }),
  defaultValue: { from: null, to: null },
  label: "Date range",
  component: "dateRange",
});
