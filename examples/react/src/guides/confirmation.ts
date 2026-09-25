/// <reference types="vite/client" />
import declaration from "../declarations/email-confirmation.ts?raw";
import composition from "../compositions/email-confirmation.tsx?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const confirmationGuide = {
  capability: "Validate a relationship between fields",
  summary: "Some validation rules compare answers instead of checking one field alone. The form schema checks that two email values match and attaches any mismatch to the confirmation field.",
  prompt: "Enter two different valid addresses and submit to see the relationship error. Correct the confirmation and submit again; changing the first address makes the rule run again.",
  steps: [
    {
      id: "check-confirmation-match",
      title: "Put the relationship on the form",
      explanation: "A form-level refinement compares both values and places the mismatch on confirmEmail, where validation and focus can guide correction.",
      filename: "declarations/email-confirmation.ts",
      code: sourceExcerpt(declaration, "  schema: (schema) => schema.refine((values) => values.email === values.confirmEmail, {", "export type EmailConfirmationValues = z.output<typeof EmailConfirmation.schema>;"),
    },
    {
      id: "reuse-confirmation-email",
      title: "Keep the individual field rules",
      explanation: "Both uses inherit Email validation, but each has its own value and control ID. The second use changes only its label and autocomplete hint.",
      filename: "declarations/email-confirmation.ts",
      code: sourceExcerpt(declaration, "export const EmailConfirmation = defineForm({", "  schema: (schema) => schema.refine((values) => values.email === values.confirmEmail, {"),
    },
    {
      id: "render-confirmation-fields",
      title: "Submit when both kinds of rule pass",
      explanation: "Fields renders both values in order. Form submits only when the individual Email rules and the relationship rule pass.",
      filename: "compositions/email-confirmation.tsx",
      code: sourceExcerpt(composition, "export function EmailConfirmationForm({ onConfirm }: {", "}"),
    },
  ],
  completeSources: [
    { label: "Declaration", filename: "declarations/email-confirmation.ts", code: declaration.trim() },
    { label: "Composition", filename: "compositions/email-confirmation.tsx", code: composition.trim() },
  ],
} satisfies FocusedGuide;
