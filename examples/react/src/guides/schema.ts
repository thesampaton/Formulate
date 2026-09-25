/// <reference types="vite/client" />
import composition from "../compositions/workshop-registration.tsx?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const schemaGuide = {
  capability: "Render nested and conditional fields from a schema",
  summary: "A form schema can describe the field hierarchy and when each value applies. Formulate renders that structure and omits inactive values from the submitted result. Workshop registration illustrates this with contact details and an optional invoice company.",
  prompt: "Register with contact details, then turn on invoicing and try submitting without a company. Add one and register again. Turn invoicing off to see the company disappear from the payload.",
  steps: [
    {
      id: "nest-workshop-contact",
      title: "Declare a nested section",
      explanation: "The contact section groups related fields under nested paths such as contact.email. Its field rules and presentation stay with the section.",
      filename: "compositions/workshop-registration.tsx",
      code: sourceExcerpt(composition, "export const WorkshopRegistration = defineForm({", "  needsInvoice: {"),
    },
    {
      id: "declare-workshop-condition",
      title: "Declare when a field applies",
      explanation: "The company field reads needsInvoice. When it is off, Formulate hides the field, skips its validation and omits it from the payload while preserving its draft.",
      filename: "compositions/workshop-registration.tsx",
      code: sourceExcerpt(composition, "  needsInvoice: {", '}, { id: "workshop-registration", layout: FieldGroup });'),
    },
    {
      id: "render-workshop-schema",
      title: "Render the declared hierarchy",
      explanation: "Fields renders both the nesting and the condition in schema order. Form connects that rendering to one stateful instance and submit callback.",
      filename: "compositions/workshop-registration.tsx",
      code: sourceExcerpt(composition, "export function WorkshopRegistrationForm({ onRegister }: {", "}"),
    },
  ],
  completeSources: [
    { label: "Schema and composition", filename: "compositions/workshop-registration.tsx", code: composition.trim() },
  ],
} satisfies FocusedGuide;
