import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdvancedOptions } from "../examples/react/src/advanced-options";
import { SimpleForm } from "../examples/react/src/simple-form";

describe("simple-form scenario", () => {
  it("associates errors with controls, focuses the first error, and submits validated values", async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    render(<SimpleForm onSignIn={onSignIn} />);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSignIn).not.toHaveBeenCalled();
    const email = screen.getByLabelText("Email");
    await waitFor(() => expect(email).toHaveFocus());
    expect(email).toHaveAccessibleDescription("Enter a valid email address.");
    expect(email).toHaveAttribute("aria-invalid", "true");
    await user.type(email, "person@example.com");
    await user.type(screen.getByLabelText("Password"), "demo-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(onSignIn).toHaveBeenCalledTimes(1));
    expect(onSignIn.mock.calls[0]?.[0]).toEqual({ email: "person@example.com", password: "demo-password" });
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });

  it("blocks duplicate attempts, preserves values after rejection, and allows retry", async () => {
    const user = userEvent.setup();
    let reject!: (reason: Error) => void;
    const onSignIn = vi.fn().mockImplementationOnce(() => new Promise<void>((_, rejectAttempt) => { reject = rejectAttempt; })).mockResolvedValue(undefined);
    render(<SimpleForm onSignIn={onSignIn} />);
    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "demo-password");
    const form = screen.getByRole("button", { name: "Sign in" }).closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(onSignIn).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
    reject(new Error("Private backend detail"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to submit. Please try again.");
    expect(screen.getByLabelText("Email")).toHaveValue("person@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("demo-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(onSignIn).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("gives two independent form instances unique label/control associations", async () => {
    const user = userEvent.setup();
    render(<><SimpleForm onSignIn={vi.fn()} /><SimpleForm onSignIn={vi.fn()} /></>);
    const emails = screen.getAllByLabelText("Email");
    expect(emails[0]!.id).not.toEqual(emails[1]!.id);
    await user.type(emails[0]!, "first@example.com");
    expect(emails[1]).toHaveValue("");
  });
});

describe("advanced-options scenario", () => {
  async function finishDestination(user: ReturnType<typeof userEvent.setup>) {
    const endpoint = await screen.findByLabelText("Request URL");
    await user.clear(endpoint);
    await user.type(endpoint, "https://api.example.com");
    await user.click(screen.getByRole("button", { name: "Review settings" }));
  }

  it("accepts undisclosed defaults, reviews without registering editors, and omits the UI toggle from the payload", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AdvancedOptions onSave={onSave} />);
    expect(screen.queryByLabelText("Retries")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next: destination" }));
    const endpoint = await screen.findByLabelText("Request URL");
    expect(endpoint).toHaveFocus();
    expect(endpoint).toHaveValue("");
    expect(endpoint).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await finishDestination(user);
    const summary = await screen.findByRole("group", { name: "Configuration summary" });
    expect(summary).toHaveFocus();
    expect(within(summary).getByText("3")).toBeInTheDocument();
    expect(within(summary).getByText("30 seconds")).toBeInTheDocument();
    expect(summary.querySelectorAll("input")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
    expect(onSave).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save configuration" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({ configuration: { retries: 3, timeoutSeconds: 30, endpoint: "https://api.example.com" } });
  });

  it("reveals and focuses invalid applicable fields after their section has unmounted", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AdvancedOptions onSave={onSave} />);
    await user.click(screen.getByLabelText("Show advanced options"));
    await user.clear(screen.getByLabelText("Retries"));
    await user.type(screen.getByLabelText("Retries"), "11");
    await user.click(screen.getByLabelText("Show advanced options"));
    expect(screen.queryByLabelText("Retries")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next: destination" }));
    const retries = await screen.findByLabelText("Retries");
    await waitFor(() => expect(retries).toHaveFocus());
    expect(retries).toHaveValue(11);
    expect(retries).toHaveAccessibleDescription("A whole number from 0 to 10. Use 0 to 10 retries.");
    expect(screen.getByLabelText("Show advanced options")).toBeChecked();
    expect(onSave).not.toHaveBeenCalled();
    await user.clear(retries);
    await user.type(retries, "5");
    await user.click(screen.getByRole("button", { name: "Next: destination" }));
    await finishDestination(user);
    await user.click(await screen.findByRole("button", { name: "Edit retries" }));
    expect(screen.getByLabelText("Retries")).toHaveValue(5);
    expect(screen.getByLabelText("Retries")).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Next: destination" }));
    expect(await screen.findByLabelText("Request URL")).toHaveValue("https://api.example.com");
    await user.click(screen.getByRole("button", { name: "Review settings" }));
    await user.click(await screen.findByRole("button", { name: "Save configuration" }));
    expect(onSave).toHaveBeenCalledWith({ configuration: { retries: 5, timeoutSeconds: 30, endpoint: "https://api.example.com" } });
  });

  it("treats clearing a numeric input as invalid and routes Enter through review before saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AdvancedOptions onSave={onSave} />);
    await user.click(screen.getByLabelText("Show advanced options"));
    const timeout = screen.getByLabelText("Timeout (seconds)");
    await user.clear(timeout);
    await user.keyboard("{Enter}");
    await waitFor(() => expect(timeout).toHaveAttribute("aria-invalid", "true"));
    expect(timeout).toHaveFocus();
    expect(onSave).not.toHaveBeenCalled();
    await user.type(timeout, "12.5{Enter}");
    await finishDestination(user);
    await screen.findByRole("group", { name: "Configuration summary" });
    expect(onSave).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save configuration" }));
    expect(onSave).toHaveBeenCalledWith({ configuration: { retries: 3, timeoutSeconds: 12.5, endpoint: "https://api.example.com" } });
  });
});
