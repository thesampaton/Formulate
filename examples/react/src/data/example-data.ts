import type { z } from "zod";
import type { SignIn } from "@/declarations/sign-in";
import type { RequestSettings } from "@/declarations/request-settings";
import type { EmailConfirmation } from "@/declarations/email-confirmation";
import type { Customer } from "@/declarations/customer";
import type { Profile } from "@/declarations/profile";
import type { MultiPageProfile } from "@/declarations/multi-page-profile";

// Fictional, reusable editing values. Declarations own empty defaults and rules;
// screens, source panels and tests consume this same sample data.
const sampleName = { firstName: " Ada ", lastName: "Lovelace" };
const sampleAddress = { street: "1 Example Street", countryCode: "AU", postcode: "2000" };

export const exampleData = {
  simple: { email: "person@example.com", password: "demo-password" } satisfies z.input<typeof SignIn.schema>,
  advanced: { showAdvanced: false, retries: 3, timeoutSeconds: 30, endpoint: "https://api.example.com" } satisfies z.input<typeof RequestSettings.schema>,
  confirmation: { email: "person@example.com", confirmEmail: "person@example.com" } satisfies z.input<typeof EmailConfirmation.schema>,
  customer: {
    email: "person@example.com",
    billingAddress: { ...sampleAddress, street: "  1 Billing Street  " },
    deliverySameAsBilling: true,
    deliveryAddress: { ...sampleAddress, street: "2 Delivery Street", postcode: "3000" },
  } satisfies z.input<typeof Customer.schema>,
  layout: { name: sampleName, email: "ada@example.com" } satisfies z.input<typeof Profile.schema>,
  multiPage: {
    name: sampleName, email: "ada@example.com", address: sampleAddress,
    notifications: { channel: "email", phone: "" },
  } satisfies z.input<typeof MultiPageProfile.schema>,
};
