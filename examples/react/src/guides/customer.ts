/// <reference types="vite/client" />
import declaration from "../declarations/customer.ts?raw";
import composition from "../compositions/customer.tsx?raw";
import address from "../declarations/address.tsx?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const customerGuide = {
  capability: "Keep inactive drafts while deriving submitted values",
  summary: "A choice can determine whether an alternate draft must validate and which value is submitted, without discarding that draft. This customer form switches between billing and a separate delivery address, then produces one effective delivery address.",
  prompt: "Enter an email and billing address, then uncheck “Delivery same as billing” and enter a separate delivery address. Switch to billing and back to see the draft remain. Review and create the customer to inspect the chosen output.",
  steps: [
    {
      id: "reuse-customer-address",
      title: "Keep both drafts in the form",
      explanation: "The form holds billingAddress and deliveryAddress separately, plus a switch that chooses the active source. Each address retains its own values and control IDs.",
      filename: "declarations/customer.ts",
      code: sourceExcerpt(declaration, "  billingAddress: Address,", "}, {"),
    },
    {
      id: "show-customer-delivery",
      title: "Show the active editor",
      explanation: "The separate delivery editor appears only when selected. Hiding it leaves its values in form state, ready if the user switches back.",
      filename: "compositions/customer.tsx",
      code: sourceExcerpt(composition, '      <Customer.Section name="billingAddress" title="Billing address" />', '      <Field orientation="horizontal"><FormContinueButton>Review customer</FormContinueButton></Field>'),
    },
    {
      id: "derive-customer-delivery",
      title: "Validate and submit the chosen source",
      explanation: "The schema always validates billing and applies full rules to separate delivery only when selected. It transforms the chosen source into one deliveryAddress in the output.",
      filename: "declarations/customer.ts",
      code: sourceExcerpt(declaration, "  schema: (schema) => {", "export const customerSchema = Customer.schema;"),
    },
  ],
  completeSources: [
    { label: "Declaration", filename: "declarations/customer.ts", code: declaration.trim() },
    { label: "Composition", filename: "compositions/customer.tsx", code: composition.trim() },
    { label: "Reusable address section", filename: "declarations/address.tsx", code: address.trim() },
  ],
} satisfies FocusedGuide;
