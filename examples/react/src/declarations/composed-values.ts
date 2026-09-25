import { z } from "zod";
import { defineForm } from "@/lib/formulate-config";
import { FieldGroup } from "@/components/ui/field";
import { customerReferenceSchema, slugSchema } from "./string-patterns";

export const ComposedValues = defineForm({
  environment: {
    primitive: "text", schema: z.enum(["prd", "dev"]), defaultValue: "prd", label: "Environment", component: "select",
    componentProps: { options: [{ value: "prd", label: "Production" }, { value: "dev", label: "Development" }] },
  },
  region: {
    primitive: "text", schema: z.enum(["aue1", "nzn1"]), defaultValue: "aue1", label: "Region", component: "select",
    componentProps: { options: [{ value: "aue1", label: "Australia East" }, { value: "nzn1", label: "New Zealand North" }] },
  },
  email: {
    primitive: "text",
    schema: z.email("Enter a valid company email."),
    defaultValue: "", label: "Company email", component: "composedInput",
    description: "Choose a username. The company domain is fixed.",
    composition: {
      segments: [{ input: true, placeholder: "username" }, { literal: "@company.com" }],
    },
  },
  url: {
    primitive: "text", schema: z.string().regex(/^https:\/\/example\.com\/[a-z0-9]+(?:-[a-z0-9]+)*$/, "Enter a lowercase slug with single hyphens."),
    defaultValue: "", label: "Public URL", component: "composedInput",
    description: "The complete URL is validated and submitted.",
    composition: { segments: [{ literal: "https://example.com/" }, { input: true, placeholder: "your-page" }] },
  },
  resourceName: {
    primitive: "text",
    schema: z.string().regex(
      /^[a-z0-9]+-(?:prd|dev)-[a-z0-9]+(?:-[a-z0-9]+)*-(?:aue1|nzn1)$/,
      "Enter an app name using lowercase letters, digits and single hyphens.",
    ),
    defaultValue: "", label: "Resource name", component: "composedInput",
    description: "Organization comes from context; environment and region come from the fields above.",
    composition: { segments: [
      { context: "organization.slug" }, { literal: "-" },
      { binding: "environment" }, { literal: "-" },
      { input: true, placeholder: "payments" }, { literal: "-" },
      { binding: "region" },
    ] },
  },
  customerReference: {
    primitive: "text", schema: customerReferenceSchema, defaultValue: "", label: "Customer reference", component: "composedInput",
    description: "The region is transformed to two uppercase letters. Enter a four-digit sequence.",
    composition: { segments: [
      { literal: "CUS-" }, { binding: "region", transform: (value: unknown) => String(value).slice(0, 2).toUpperCase() },
      { literal: "-" }, { input: true, placeholder: "0042" },
    ] },
    componentProps: { inputMode: "numeric" },
  },
  sku: {
    primitive: "text",
    schema: z.string().regex(
      /^SKU-[A-Z]{2,8}-[A-Z0-9]{1,4}$/,
      "Enter an uppercase style (2–8 letters) and size (1–4 letters or digits).",
    ),
    defaultValue: "", label: "SKU", component: "composedInput",
    description: "Two editable parts share one value, one validation result and one field blur.",
    composition: {
      segments: [
        { literal: "SKU-" },
        { input: true, label: "Style", placeholder: "TEE" },
        { literal: "-" },
        { input: true, label: "Size", placeholder: "XL" },
      ],
      // Persisted strings split at the first separator after SKU-. The schema
      // excludes hyphens from styles, so accepted values rehydrate unambiguously.
      parse: (value: string) => {
        const remainder = value.slice("SKU-".length);
        const separator = remainder.indexOf("-");
        return separator < 0 ? [remainder, ""] : [remainder.slice(0, separator), remainder.slice(separator + 1)];
      },
    },
    componentProps: { autoCapitalize: "characters", spellCheck: false },
  },
  plainSlug: {
    primitive: "text", schema: slugSchema, defaultValue: "", label: "Plain slug", component: "input",
    description: "Patterns are independent of composition: this ordinary string input uses a reusable regex schema.",
    componentProps: { placeholder: "monthly-report" },
  },
}, { layout: FieldGroup });

export type ComposedValuesOutput = z.output<typeof ComposedValues.schema>;
