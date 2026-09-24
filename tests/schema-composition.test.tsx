import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { createGraphRuntime } from "@formulate/react";
import { WorkshopRegistration, WorkshopRegistrationForm } from "../examples/react/src/compositions/workshop-registration";

it("validates the whole authored form and submits a trimmed nested payload with applicable fields", async () => {
  const onRegister = vi.fn();
  const user = userEvent.setup();
  render(<WorkshopRegistrationForm onRegister={onRegister} />);

  expect(screen.queryByLabelText("Company name")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Register" }));
  expect(screen.getByText("Enter your name.")).toBeInTheDocument();
  expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
  expect(onRegister).not.toHaveBeenCalled();

  await user.type(screen.getByLabelText("Name"), "  Sam  ");
  await user.type(screen.getByLabelText("Email"), "sam@example.com");
  await user.click(screen.getByRole("button", { name: "Register" }));
  await waitFor(() => expect(onRegister).toHaveBeenCalledTimes(1));
  expect(onRegister.mock.calls[0]![0]).toEqual({
    contact: { name: "Sam", email: "sam@example.com" },
    needsInvoice: false,
  });

  await user.click(screen.getByRole("checkbox", { name: "I need an invoice" }));
  await user.type(screen.getByLabelText("Company name"), "  ");
  await user.click(screen.getByRole("button", { name: "Register" }));
  expect(screen.getByText("Enter a company name.")).toBeInTheDocument();
  expect(onRegister).toHaveBeenCalledTimes(1);

  await user.type(screen.getByLabelText("Company name"), "Acme  ");
  await user.click(screen.getByRole("button", { name: "Register" }));
  await waitFor(() => expect(onRegister).toHaveBeenCalledTimes(2));
  expect(onRegister.mock.calls[1]![0]).toEqual({
    contact: { name: "Sam", email: "sam@example.com" },
    needsInvoice: true,
    company: "Acme",
  });

  await user.click(screen.getByRole("checkbox", { name: "I need an invoice" }));
  expect(screen.queryByLabelText("Company name")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Register" }));
  await waitFor(() => expect(onRegister).toHaveBeenCalledTimes(3));
  expect(onRegister.mock.calls[2]![0]).toEqual(onRegister.mock.calls[0]![0]);
  await user.click(screen.getByRole("checkbox", { name: "I need an invoice" }));
  expect(screen.getByLabelText("Company name")).toHaveValue("  Acme  ");
});

it("exports the same nested schema semantics for headless validation and payload construction", () => {
  const exported = WorkshopRegistration.toPortable();
  const runtime = createGraphRuntime(JSON.parse(JSON.stringify(exported.graph)), {
    capabilities: exported.capabilities,
  });
  try {
    runtime.update({
      "contact.name": "  Sam  ",
      "contact.email": "not-an-email",
      needsInvoice: true,
      company: "  Acme  ",
    });
    expect(runtime.inspect().payload).toBeUndefined();
    runtime.update({ "contact.email": "sam@example.com" });
    expect(runtime.inspect().payload).toEqual(WorkshopRegistration.schema.parse({
      contact: { name: "  Sam  ", email: "sam@example.com" },
      needsInvoice: true,
      company: "  Acme  ",
    }));
    runtime.update({ needsInvoice: false });
    expect(runtime.inspect().payload).toEqual({
      contact: { name: "Sam", email: "sam@example.com" },
      needsInvoice: false,
    });
    expect(runtime.inspect().state.values.company).toBe("  Acme  ");
  } finally {
    runtime.dispose();
  }
});
