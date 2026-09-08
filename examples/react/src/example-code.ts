/// <reference types="vite/client" />
import simple from "./simple-form.tsx?raw";
import advanced from "./advanced-options.tsx?raw";
import confirmation from "./email-confirmation.tsx?raw";
import customer from "./customer-onboarding.tsx?raw";
import customerDefinition from "./customer-schema.ts?raw";
import address from "./address.tsx?raw";
import email from "./email.ts?raw";

import responsive from "./responsive-layout.tsx?raw";
import name from "./name.tsx?raw";
import layouts from "./components/formulate/layouts.tsx?raw";

export type ExampleName = "simple" | "advanced" | "confirmation" | "customer" | "layout";
export type CodeExcerpt = { label: string; filename: string; code: string };

// Read the implementation itself so the panel changes alongside the API.
// Explicit declaration boundaries keep imports and unrelated site UI out.
function excerpt(source: string, start: string, end?: string) {
  const from = source.indexOf(start);
  const to = end ? source.indexOf(end, from + start.length) : source.length;
  if (from < 0 || to < 0) throw new Error(`Code excerpt boundary is missing: ${start}`);
  return source.slice(from, to).trim();
}

const sharedEmail: CodeExcerpt = { label: "Email", filename: "email.ts", code: excerpt(email, "export const Email") };

export const exampleCode = {
  simple: [
    { label: "Form", filename: "simple-form.tsx", code: excerpt(simple, "export function SimpleForm") },
    { label: "Definition", filename: "simple-form.tsx", code: excerpt(simple, "const SignIn", "export function SimpleForm") },
    sharedEmail,
  ],
  advanced: [
    { label: "Form", filename: "advanced-options.tsx", code: excerpt(advanced, "export function AdvancedOptions") },
    { label: "Definition", filename: "advanced-options.tsx", code: excerpt(advanced, "const RequestSettings", "function EditButton") },
  ],
  confirmation: [
    { label: "Form", filename: "email-confirmation.tsx", code: excerpt(confirmation, "export function EmailConfirmationForm", "export function EmailConfirmationExample") },
    { label: "Definition", filename: "email-confirmation.tsx", code: excerpt(confirmation, "export const EmailConfirmation", "export function EmailConfirmationForm") },
    sharedEmail,
  ],
  layout: [
    { label: "Form", filename: "responsive-layout.tsx", code: excerpt(responsive, "const Profile") },
    { label: "Name", filename: "name.tsx", code: excerpt(name, "export const Name") },
    { label: "Layouts", filename: "layouts.tsx", code: layouts.trim() },
  ],
  customer: [
    { label: "Form", filename: "customer-onboarding.tsx", code: excerpt(customer, "export function CustomerOnboarding") },
    { label: "Definition", filename: "customer-schema.ts", code: excerpt(customerDefinition, "type DeliveryPolicy") },
    { label: "Address", filename: "address.tsx", code: excerpt(address, "export const countries", "export function AddressSummary") },
    { label: "Layouts", filename: "layouts.tsx", code: layouts.trim() },
    sharedEmail,
  ],
} satisfies Record<ExampleName, readonly [CodeExcerpt, ...CodeExcerpt[]]>;
