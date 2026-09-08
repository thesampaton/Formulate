import { z } from "zod";
import { Address } from "./address";
import { Email } from "./email";
import { Stack } from "./components/formulate/layouts";
import { defineForm } from "@/lib/formulate-config";

type DeliveryPolicy = { deliverySameAsBilling: boolean };
export function deliverySource(values: DeliveryPolicy) {
  return values.deliverySameAsBilling ? "billingAddress" : "deliveryAddress";
}

export const Customer = defineForm({
  email: { ...Email, schema: z.string().trim().pipe(Email.schema) },
  billingAddress: Address,
  deliverySameAsBilling: {
    schema: z.boolean(), defaultValue: true, label: "Delivery same as billing", component: "checkbox",
    orientation: "horizontal",
  },
  deliveryAddress: Address,
}, {
  layout: Stack,
  schema: (schema) => {
    // The inactive draft keeps its editing shape but suspends domain requirements.
    const draft = z.object({ street: z.string(), countryCode: z.string(), postcode: z.string() });
    return z.discriminatedUnion("deliverySameAsBilling", [
      schema.extend({ deliverySameAsBilling: z.literal(true), deliveryAddress: draft }),
      schema.extend({ deliverySameAsBilling: z.literal(false) }),
    ]).transform((values) => ({
      email: values.email,
      billingAddress: values.billingAddress,
      deliveryAddress: { ...(values.deliverySameAsBilling ? values.billingAddress : values.deliveryAddress) },
    }));
  },
});

export const customerSchema = Customer.schema;
export const customerDefaults = Customer.defaultValues;
export type CustomerValues = z.input<typeof Customer.schema>;
export type CustomerPayload = z.output<typeof Customer.schema>;
