import { Field, FieldGroup } from "@/components/ui/field";
import { useRef } from "react";
import { useWatch } from "react-hook-form";
import { Page, useFormNavigation } from "@formulate/react";
import { AddressSummary } from "@/components/formulate/address-summary";
import { Customer, customerDefaults, deliverySource } from "@/declarations/customer";
import type { CustomerPayload, CustomerValues } from "@/declarations/customer";
import { FormContinueButton, FormNavigationButton, FormSubmitButton } from "@/components/formulate/form-actions";

export function CustomerForm({ onCreate, defaultValues = customerDefaults }: {
  onCreate: (payload: CustomerPayload) => void | Promise<void>;
  defaultValues?: CustomerValues;
}) {
  const form = Customer.useForm({ defaultValues, shouldFocusError: false });
  const navigation = useFormNavigation<CustomerValues, "details" | "review">({
    form,
    initialPage: "details",
    destinations: Customer.fieldPaths.map((name) => ({ name, page: "details" })),
  });
  const [email, billingAddress, deliverySameAsBilling, deliveryAddress] = useWatch({
    control: form.control, name: ["email", "billingAddress", "deliverySameAsBilling", "deliveryAddress"],
  });
  const effectiveDelivery = deliverySource({ deliverySameAsBilling }) === "billingAddress" ? billingAddress : deliveryAddress;
  const reviewHeadingRef = useRef<HTMLDivElement>(null);

  return <Customer.Form form={form}
    scopedAction={navigation.page === "review" ? undefined : {
      id: navigation.revision,
      errorPaths: ["email", "billingAddress", "deliverySameAsBilling", "deliveryAddress"],
      onValid: () => navigation.goToPage("review", () => reviewHeadingRef.current?.focus()),
    }}
    onInvalid={(errors) => {
      if (!navigation.goToFirstError(errors)) form.setError("root.submit", { message: "Review the form errors before continuing." });
    }}
    onSubmit={onCreate}>
    <p className="step-indicator" aria-live="polite">Step {navigation.page === "details" ? "1 of 2 · Details" : "2 of 2 · Review"}</p>
    <Page layout={FieldGroup} pageId="customer-details" title="Customer details" active={navigation.page === "details"}>
      <p>Choose billing and delivery addresses. This demo checks postcode formats for two countries.</p>
      <Customer.Field name="email" />
      <Customer.Section name="billingAddress" title="Billing address" />
      <Customer.Field name="deliverySameAsBilling"
        componentProps={{ onValueChange: () => { void form.trigger("deliveryAddress"); } }} />
      {deliverySameAsBilling ? <p>Delivery uses your current billing address. Any separate delivery address is kept for later.</p> :
        <Customer.Section name="deliveryAddress" title="Delivery address" />}
      <Field orientation="horizontal"><FormContinueButton>Review customer</FormContinueButton></Field>
    </Page>
    <Page layout={FieldGroup} pageId="customer-review" title="Review customer" active={navigation.page === "review"}>
      <div ref={reviewHeadingRef} tabIndex={-1} role="group" aria-label="Customer summary" className="review-summary">
        <dl>
          <div><dt>Email</dt><dd>{email}</dd></div>
          <div><dt>Billing address</dt><dd><AddressSummary address={billingAddress} /></dd></div>
          <div><dt>Delivery address{deliverySameAsBilling ? " · from billing" : ""}</dt><dd><AddressSummary address={effectiveDelivery} /></dd></div>
        </dl>
      </div>
      <Field orientation="horizontal" className="flex-wrap">
        <FormNavigationButton onClick={() => navigation.goToField("email")}>Edit email</FormNavigationButton>
        <FormNavigationButton onClick={() => navigation.goToField("billingAddress.street")}>Edit billing</FormNavigationButton>
        <FormNavigationButton onClick={() => navigation.goToField(`${deliverySource(form.getValues())}.street`)}>Edit delivery</FormNavigationButton>
        <FormSubmitButton pendingLabel="Creating…">Create customer</FormSubmitButton>
      </Field>
    </Page>
  </Customer.Form>;
}
