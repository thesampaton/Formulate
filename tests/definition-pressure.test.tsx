import { StrictMode, useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Form, useFormulate } from "@formulate/react";
import {
  EmailConfirmation, emailConfirmationBoundary, FlatEmailConfirmation, NestedEmailConfirmation,
} from "../examples/react/src/email-confirmation";
import { Email } from "../examples/react/src/email";

it.each([
  { name: "declaration-backed", Component: FlatEmailConfirmation, payload: { email: "first@example.com", confirmEmail: "first@example.com" } },
  { name: "explicit nested", Component: NestedEmailConfirmation, payload: { contact: { email: "first@example.com", confirmEmail: "first@example.com" } } },
])("validates cross-field rules, focuses correction, and preserves runtime identity with $name bindings", async ({ Component, payload }) => {
  const user = userEvent.setup();
  const onConfirm = vi.fn();
  const { rerender } = render(<StrictMode><Component onConfirm={onConfirm} /></StrictMode>);
  const email = screen.getByLabelText("Email");
  const confirmation = screen.getByLabelText("Confirm email");
  expect(email.id).not.toEqual(confirmation.id);
  await user.type(email, "first@example.com");
  expect(confirmation).toHaveValue("");
  await user.type(confirmation, "other@example.com");
  await user.click(screen.getByRole("button", { name: "Confirm email address" }));
  await waitFor(() => expect(confirmation).toHaveFocus());
  expect(confirmation).toHaveAccessibleDescription("Email addresses must match.");
  expect(confirmation).toHaveAttribute("aria-invalid", "true");
  expect(onConfirm).not.toHaveBeenCalled();
  rerender(<StrictMode><Component onConfirm={onConfirm} /></StrictMode>);
  expect(screen.getByLabelText("Confirm email")).toBe(confirmation);
  expect(confirmation).toHaveValue("other@example.com");
  await user.clear(confirmation);
  await user.type(confirmation, "first@example.com{Enter}");
  await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  expect(onConfirm.mock.calls[0]?.[0]).toEqual(payload);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  // A previously accepted confirmation must be checked against a later email edit.
  await user.clear(email);
  await user.type(email, "changed@example.com{Enter}");
  await waitFor(() => expect(confirmation).toHaveFocus());
  expect(confirmation).toHaveAccessibleDescription("Email addresses must match.");
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(Email.defaultValue).toBe("");
  expect(EmailConfirmation.defaultValues).toEqual({ email: "", confirmEmail: "" });
});

it("keeps a cross-field requirement active before its editor mounts and after it unmounts", async () => {
  const onConfirm = vi.fn();
  function Example() {
    const form = useFormulate(emailConfirmationBoundary, { defaultValues: { email: "first@example.com", confirmEmail: "other@example.com" } });
    const [shown, setShown] = useState(false);
    return <Form form={form} onSubmit={onConfirm}>
      <EmailConfirmation.Field name="email" />
      {shown ? <EmailConfirmation.Field name="confirmEmail" /> : null}
      <p role="status">{form.formState.errors.confirmEmail?.message}</p>
      <button type="button" onClick={() => setShown(!shown)}>Toggle confirmation</button>
      <button type="submit">Confirm</button>
    </Form>;
  }
  const user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "Confirm" }));
  expect(screen.getByRole("status")).toHaveTextContent("Email addresses must match.");
  expect(onConfirm).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Toggle confirmation" }));
  const confirmation = screen.getByLabelText("Confirm email");
  expect(confirmation).toHaveValue("other@example.com");
  await user.clear(confirmation);
  await user.type(confirmation, "first@example.com");
  await user.click(screen.getByRole("button", { name: "Toggle confirmation" }));
  await user.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  await user.clear(screen.getByLabelText("Email"));
  await user.type(screen.getByLabelText("Email"), "changed@example.com");
  await user.click(screen.getByRole("button", { name: "Confirm" }));
  expect(screen.getByRole("status")).toHaveTextContent("Email addresses must match.");
  expect(onConfirm).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Toggle confirmation" }));
  expect(screen.getByLabelText("Confirm email")).toHaveValue("first@example.com");
});

it("isolates reused declarations across form runtimes and preserves per-use presentation", async () => {
  const user = userEvent.setup();
  render(<>
    <div role="group" aria-label="First"><FlatEmailConfirmation onConfirm={vi.fn()} /></div>
    <div role="group" aria-label="Second"><FlatEmailConfirmation onConfirm={vi.fn()} /></div>
  </>);
  const first = within(screen.getByRole("group", { name: "First" }));
  const second = within(screen.getByRole("group", { name: "Second" }));
  await user.type(first.getByLabelText("Email"), "first@example.com");
  expect(first.getByLabelText("Confirm email")).toHaveValue("");
  expect(second.getByLabelText("Email")).toHaveValue("");
  expect(new Set(screen.getAllByRole("textbox").map((input) => input.id)).size).toBe(4);
  expect(first.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
  expect(first.getByLabelText("Confirm email")).toHaveAttribute("autocomplete", "off");
  expect(Email.componentProps.autoComplete).toBe("email");
});
