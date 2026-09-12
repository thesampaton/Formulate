import { z } from "zod";
import { defineForm } from "@/lib/formulate-config";
import { FieldGroup } from "@/components/ui/field";

export const RequestSettings = defineForm({
  showAdvanced: {
    schema: z.boolean(),
    defaultValue: false,
    label: "Show advanced options",
    component: "checkbox",
    orientation: "horizontal",
  },
  retries: {
    schema: z.number({ error: "Enter a retry count." }).int("Use a whole number.").min(0, "Use 0 to 10 retries.").max(10, "Use 0 to 10 retries."),
    defaultValue: 3,
    label: "Retries",
    description: "A whole number from 0 to 10.",
    component: "number",
    componentProps: { min: 0, max: 10, step: 1 },
  },
  timeoutSeconds: {
    schema: z.number({ error: "Enter a timeout." }).positive("Timeout must be greater than zero."),
    defaultValue: 30,
    label: "Timeout (seconds)",
    description: "Any number greater than zero.",
    component: "number",
    componentProps: { step: "any" },
  },
  endpoint: {
    schema: z.url("Enter a valid request URL."),
    defaultValue: "",
    label: "Request URL",
    description: "The destination for requests. This demo does not send a request.",
    component: "input",
    componentProps: { type: "url", placeholder: "https://api.example.com" },
  },
}, { layout: FieldGroup });

export type Settings = z.output<typeof RequestSettings.schema>;
export type RequestConfiguration = { configuration: Pick<Settings, "retries" | "timeoutSeconds" | "endpoint"> };
