import { exampleData } from "../examples/react/src/data/example-data";
import { StrictMode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustomerOnboarding } from "../examples/react/src/customer-onboarding";
import { customerSchema } from "../examples/react/src/declarations/customer";
import type { CustomerValues } from "../examples/react/src/declarations/customer";

function prefill(overrides: Partial<CustomerValues> = {}): CustomerValues {
  return { ...structuredClone(exampleData.customer), ...overrides };
}

describe("customer onboarding", () => {
  it("rechecks only the changed address's postcode and preserves both bindings", async () => {
    const user = userEvent.setup();
    render(<StrictMode><CustomerOnboarding onCreate={vi.fn()} defaultValues={prefill({ deliverySameAsBilling: false })} /></StrictMode>);
    const billing = screen.getByLabelText("Billing address postcode");
    const delivery = screen.getByLabelText("Delivery address postcode");
    expect(billing.id).not.toBe(delivery.id);
    await user.click(screen.getByRole("combobox", { name: "Billing address country" }));
    await user.click(await screen.findByRole("option", { name: "United States" }));
    await waitFor(() => expect(billing).toHaveAttribute("aria-invalid", "true"));
    expect(delivery).not.toHaveAttribute("aria-invalid", "true");
    expect(delivery).toHaveValue("3000");
    expect(billing).toHaveValue("2000");
    expect(billing).toHaveAccessibleDescription("Demo format: 5 digits. Use 5 digits for this demo's US postcode.");
    await user.click(screen.getByRole("combobox", { name: "Delivery address country" }));
    await user.click(await screen.findByRole("option", { name: "United States" }));
    await waitFor(() => expect(delivery).toHaveAttribute("aria-invalid", "true"));
    await user.click(screen.getByRole("combobox", { name: "Billing address country" }));
    await user.click(await screen.findByRole("option", { name: "Australia" }));
    await waitFor(() => expect(billing).not.toHaveAttribute("aria-invalid", "true"));
    expect(delivery).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Billing address street")).toHaveValue("  1 Billing Street  ");
  });

  it("suspends an invalid manual draft, derives fresh delivery, and restores/rechecks the draft", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<CustomerOnboarding onCreate={onCreate} defaultValues={prefill({
      deliverySameAsBilling: false,
      deliveryAddress: { street: "Keep my draft", countryCode: "US", postcode: "123" },
    })} />);
    await user.click(screen.getByRole("button", { name: "Review customer" }));
    await waitFor(() => expect(screen.getByLabelText("Delivery address postcode")).toHaveFocus());
    await user.click(screen.getByLabelText("Delivery same as billing"));
    expect(screen.queryByLabelText("Delivery address postcode")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Review customer" }));
    const summary = await screen.findByRole("group", { name: "Customer summary" });
    expect(summary).toHaveFocus();
    expect(within(summary).getAllByText(/1 Billing Street/)).toHaveLength(2);
    expect(within(summary).queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(onCreate).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Edit delivery" }));
    const street = await screen.findByLabelText("Billing address street");
    expect(street).toHaveFocus();
    expect(street).toHaveValue("  1 Billing Street  ");
    await user.clear(street);
    await user.type(street, "  9 New Street  ");
    await user.click(screen.getByLabelText("Delivery same as billing"));
    expect(screen.getByLabelText("Delivery address street")).toHaveValue("Keep my draft");
    expect(screen.getByRole("combobox", { name: "Delivery address country" })).toHaveTextContent("United States");
    expect(screen.getByLabelText("Delivery address postcode")).toHaveValue("123");
    await waitFor(() => expect(screen.getByLabelText("Delivery address postcode")).toHaveAttribute("aria-invalid", "true"));
    await user.click(screen.getByLabelText("Delivery same as billing"));
    await user.click(screen.getByRole("button", { name: "Review customer" }));
    expect(within(await screen.findByRole("group", { name: "Customer summary" })).getAllByText(/9 New Street/)).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Create customer" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onCreate).toHaveBeenCalledWith({
      email: "person@example.com",
      billingAddress: { street: "9 New Street", countryCode: "AU", postcode: "2000" },
      deliveryAddress: { street: "9 New Street", countryCode: "AU", postcode: "2000" },
    });
  });

  it("corrects and submits separate delivery without changing billing", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<CustomerOnboarding onCreate={onCreate} defaultValues={prefill({ deliverySameAsBilling: false })} />);
    await user.click(screen.getByRole("button", { name: "Review customer" }));
    await user.click(await screen.findByRole("button", { name: "Edit delivery" }));
    const street = await screen.findByLabelText("Delivery address street");
    expect(street).toHaveFocus();
    await user.clear(street);
    await user.type(street, "3 Delivery Street");
    await user.click(screen.getByRole("button", { name: "Review customer" }));
    await user.click(await screen.findByRole("button", { name: "Create customer" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onCreate).toHaveBeenCalledWith({
      email: "person@example.com",
      billingAddress: { street: "1 Billing Street", countryCode: "AU", postcode: "2000" },
      deliveryAddress: { street: "3 Delivery Street", countryCode: "AU", postcode: "3000" },
    });
  });

  it("keeps simultaneous customer runtimes independent", async () => {
    const user = userEvent.setup();
    render(<><CustomerOnboarding onCreate={vi.fn()} /><CustomerOnboarding onCreate={vi.fn()} /></>);
    const streets = screen.getAllByLabelText("Billing address street");
    expect(streets[0]!.id).not.toBe(streets[1]!.id);
    await user.type(streets[0]!, "First customer");
    expect(streets[1]).toHaveValue("");
    await user.click(screen.getAllByLabelText("Delivery same as billing")[0]!);
    expect(screen.getAllByLabelText("Delivery address street")).toHaveLength(1);
  });

  it("validates current sources without editors and assigns derived errors to billing once", () => {
    const values = prefill({ deliveryAddress: { street: "", countryCode: "unsupported", postcode: "" } });
    expect(customerSchema.safeParse(values).success).toBe(true);
    values.billingAddress.countryCode = "US";
    const changed = customerSchema.safeParse(values);
    expect(changed.success).toBe(false);
    if (changed.success) throw new Error("Expected a country/postcode error");
    expect(changed.error.issues.map(({ path }) => path)).toEqual([["billingAddress", "postcode"]]);
    values.billingAddress.postcode = "10001";
    const accepted = customerSchema.parse(values);
    expect(accepted.deliveryAddress).toEqual({ street: "1 Billing Street", countryCode: "US", postcode: "10001" });
    expect(values.billingAddress.street).toBe("  1 Billing Street  ");
    values.deliverySameAsBilling = false;
    expect(customerSchema.safeParse(values).success).toBe(false);
  });
});
