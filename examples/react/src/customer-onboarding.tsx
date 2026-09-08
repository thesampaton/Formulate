import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useWatch } from "react-hook-form";
import { Form, Page, useFormActionStatus, useFormNavigation } from "@formulate/react";
import { AddressSummary } from "./address";
import { Customer, customerDefaults, deliverySource } from "./customer-schema";
import type { CustomerPayload, CustomerValues } from "./customer-schema";
import { PolicyCheckboxControl } from "./controls";
import { SubmitButton } from "./submit-button";

function EditButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const { isPending } = useFormActionStatus();
  return <button type="button" className="secondary" disabled={isPending} onClick={onClick}>{children}</button>;
}

export function CustomerOnboarding({ onCreate, defaultValues = customerDefaults }: {
  onCreate: (payload: CustomerPayload) => void | Promise<void>;
  defaultValues?: CustomerValues;
}) {
  const form = Customer.useForm({ defaultValues, shouldFocusError: false });
  const navigation = useFormNavigation<CustomerValues, "details" | "review">({
    form,
    initialPage: "details",
    destinations: Customer.fieldNames.map((name) => ({ name, page: "details" })),
  });
  const [email, billingAddress, deliverySameAsBilling, deliveryAddress] = useWatch({
    control: form.control, name: ["email", "billingAddress", "deliverySameAsBilling", "deliveryAddress"],
  });
  const effectiveDelivery = deliverySource({ deliverySameAsBilling }) === "billingAddress" ? billingAddress : deliveryAddress;
  const reviewHeading = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState<CustomerPayload | null>(null);

  return <Form form={form}
    navigation={navigation.page === "review" ? undefined : {
      id: navigation.revision,
      fields: ["email", "billingAddress", "deliverySameAsBilling", "deliveryAddress"],
      onValid: () => navigation.goTo("review", () => reviewHeading.current?.focus()),
    }}
    onInvalid={(errors) => {
      if (!navigation.correct(errors)) form.setError("root.submit", { message: "Review the form errors before continuing." });
    }}
    onSubmit={async (payload) => {
      setSaved(null);
      await onCreate(payload);
      setSaved(payload);
    }}>
    <p className="step-indicator" aria-live="polite">Step {navigation.page === "details" ? "1 of 2 · Details" : "2 of 2 · Review"}</p>
    <Page id="customer-details" title="Customer details" active={navigation.page === "details"}>
      <p>Choose billing and delivery addresses. This demo checks postcode formats for two countries.</p>
      <Customer.Field name="email" />
      <Customer.Section name="billingAddress" title="Billing address" />
      <Customer.Field name="deliverySameAsBilling">
        <PolicyCheckboxControl onValueChange={() => { void form.trigger("deliveryAddress"); }} />
      </Customer.Field>
      {deliverySameAsBilling ? <p>Delivery uses your current billing address. Any separate delivery address is kept for later.</p> :
        <Customer.Section name="deliveryAddress" title="Delivery address" />}
      <SubmitButton pendingLabel="Checking…">Review customer</SubmitButton>
    </Page>
    <Page id="customer-review" title="Review customer" active={navigation.page === "review"}>
      <div ref={reviewHeading} tabIndex={-1} role="group" aria-label="Customer summary" className="review-summary">
        <dl>
          <div><dt>Email</dt><dd>{email}</dd></div>
          <div><dt>Billing address</dt><dd><AddressSummary address={billingAddress} /></dd></div>
          <div><dt>Delivery address{deliverySameAsBilling ? " · from billing" : ""}</dt><dd><AddressSummary address={effectiveDelivery} /></dd></div>
        </dl>
      </div>
      <div className="actions">
        <EditButton onClick={() => navigation.goToField("email")}>Edit email</EditButton>
        <EditButton onClick={() => navigation.goToField("billingAddress.street")}>Edit billing</EditButton>
        <EditButton onClick={() => navigation.goToField(`${deliverySource(form.getValues())}.street`)}>Edit delivery</EditButton>
        <SubmitButton pendingLabel="Creating…">Create customer</SubmitButton>
      </div>
    </Page>
    {saved ? <div role="status" className="result"><p>Demo creation accepted. Last submitted payload:</p><pre>{JSON.stringify(saved, null, 2)}</pre></div> : null}
  </Form>;
}
