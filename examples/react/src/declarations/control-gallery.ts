import { z } from "zod";
import { defineField } from "@/lib/formulate";
import { defineForm, field } from "@/lib/formulate-config";
import { FieldGroup } from "@/components/ui/field";
import { Country, Email, Percentage } from "./common-fields";

export const countryOptions = [
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "US", label: "United States", disabled: true },
] as const;
const CountryChoice = defineField({ ...Country, componentProps: { ...Country.componentProps, options: countryOptions } });
const BooleanField = defineField({
  primitive: "boolean", schema: z.boolean(), defaultValue: false, label: "Enabled", component: "checkbox",
});
const SingleDate = defineField({
  primitive: "date", schema: z.date().nullable().refine((date) => date !== null, "Choose a date."),
  defaultValue: null, label: "Date", component: "datePicker",
  componentProps: { defaultMonth: new Date(2026, 8, 1) },
});

export const ControlGallery = defineForm({
  input: field(Email, { label: "Input" }),
  textarea: { primitive: "text", schema: z.string().min(1, "Enter a note."), defaultValue: "", label: "Textarea", component: "textarea", componentProps: { rows: 3, placeholder: "Add a note…" } },
  inputOTP: { primitive: "text", schema: z.string().regex(/^\d{6}$/, "Enter six digits."), defaultValue: "", label: "InputOTP", component: "inputOTP", componentProps: { maxLength: 6 } },
  checkbox: field(BooleanField, { label: "Checkbox" }),
  switch: field(BooleanField, { label: "Switch", component: "switch" }),
  select: field(CountryChoice, { label: "Select", component: "select", componentProps: { options: countryOptions, placeholder: "Choose a country" } }),
  radioGroup: field(CountryChoice, { label: "RadioGroup", component: "radioGroup", componentProps: { options: countryOptions } }),
  combobox: field(CountryChoice, { label: "Combobox" }),
  command: field(CountryChoice, { label: "Command", component: "command", componentProps: { options: countryOptions, placeholder: "Search countries…", className: "rounded-md border" } }),
  toggleGroup: field(CountryChoice, { label: "ToggleGroup", component: "toggleGroup", componentProps: { options: countryOptions, variant: "outline" } }),
  multiToggleGroup: { primitive: "multiChoice", schema: z.array(z.enum(["AU", "NZ"])), defaultValue: [], label: "ToggleGroup (multiple)", component: "multiToggleGroup", componentProps: { options: countryOptions, variant: "outline" } },
  slider: field(Percentage, { label: "Slider", defaultValue: 50, component: "slider", componentProps: { min: 0, max: 100, step: 1 } }),
  calendar: field(SingleDate, { label: "Calendar", component: "calendar", componentProps: SingleDate.componentProps }),
  datePicker: field(SingleDate, { label: "DatePicker" }),
}, { layout: FieldGroup });

export type ControlGalleryValues = z.output<typeof ControlGallery.schema>;
