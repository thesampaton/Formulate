import { Section } from "@formulate/react";
import type { ReactNode } from "react";
import { z } from "zod";
import { defineSection } from "./formulate";

export const countries = [
  { value: "AU", label: "Australia" },
  { value: "US", label: "United States" },
] as const;

// Deliberately limited demo format checks, not address/delivery verification.
const postcodeFormats: Record<(typeof countries)[number]["value"], { pattern: RegExp; message: string }> = {
  AU: { pattern: /^\d{4}$/, message: "Use 4 digits for this demo's Australian postcode." },
  US: { pattern: /^\d{5}$/, message: "Use 5 digits for this demo's US postcode." },
};

export const Address = defineSection({
  street: {
    schema: z.string().trim().min(1, "Enter a street address."),
    defaultValue: "", label: "Street", component: "input",
    componentProps: { autoComplete: "off" },
  },
  countryCode: {
    schema: z.string().pipe(z.enum(["AU", "US"], { error: "Choose a supported country." })),
    defaultValue: "AU", label: "Country", component: "select",
    componentProps: { options: countries },
  },
  postcode: {
    schema: z.string().trim(),
    defaultValue: "", label: "Postcode", component: "input",
    componentProps: { autoComplete: "off", inputMode: "numeric" },
  },
}, {
  title: "Address",
  schema: (schema) => schema.superRefine(({ countryCode, postcode }, context) => {
    const format = postcodeFormats[countryCode];
    if (!format.pattern.test(postcode)) context.addIssue({ code: "custom", path: ["postcode"], message: format.message });
  }),
  render: AddressFields,
});
export type AddressValues = z.input<typeof Address.schema>;

// Presentation uses local names; the enclosing section use supplies the binding.
function AddressFields({ title }: { title: ReactNode }) {
  const country = Address.useWatch("countryCode");
  const trigger = Address.useTrigger();
  return <Section title={title}>
    <Address.Field name="street" label={<>{title} street</>} />
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Address.Field name="countryCode" label={<>{title} country</>}
        componentProps={{ onValueChange: () => { void trigger("postcode"); } }} />
      <Address.Field name="postcode" label={<>{title} postcode</>}
        description={country === "US" ? "Demo format: 5 digits." : "Demo format: 4 digits."} />
    </div>
  </Section>;
}

export function AddressSummary({ address }: { address: AddressValues }) {
  return <>{address.street}<br />{address.postcode} · {countries.find(({ value }) => value === address.countryCode)?.label ?? address.countryCode}</>;
}
