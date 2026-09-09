import { profileCompletion } from "../examples/react/src/hooks/profile-pages";
import { exampleData } from "../examples/react/src/data/example-data";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { MultiPageExample } from "../examples/react/src/multi-page-form";
import { MultiPageProfile } from "../examples/react/src/declarations/multi-page-profile";
import type { MultiPageProfileValues } from "../examples/react/src/declarations/multi-page-profile";

function validValues(): MultiPageProfileValues {
  return structuredClone(exampleData.multiPage);
}

it("derives completion from current schema requirements, including prefills and conditional fields", () => {
  expect(profileCompletion(MultiPageProfile.defaultValues).map((page) => page.complete)).toEqual([false, false, false]);
  const values = validValues();
  expect(profileCompletion(values).every((page) => page.complete)).toBe(true);
  values.notifications.channel = "sms";
  expect(profileCompletion(values).map((page) => page.complete)).toEqual([true, true, false]);
  values.notifications.phone = "+61412345678";
  expect(profileCompletion(values).every((page) => page.complete)).toBe(true);
  values.address.countryCode = "US";
  expect(profileCompletion(values).map((page) => page.complete)).toEqual([true, false, true]);
});

it("preserves editing values across tab unmounts and lets completion go backwards", async () => {
  const user = userEvent.setup();
  render(<MultiPageExample defaultValues={validValues()} />);
  expect(screen.getByRole("status")).toHaveTextContent("3 of 3 pages complete · Not saved");
  const first = screen.getByLabelText("First name");
  await user.clear(first);
  await user.type(first, "Grace");
  await user.click(screen.getByRole("tab", { name: "Delivery: Complete" }));
  expect(screen.queryByLabelText("First name")).toBeNull();
  await user.clear(screen.getByLabelText("Delivery address postcode"));
  expect(screen.getByRole("tab", { name: "Delivery: Incomplete" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("status")).toHaveTextContent("2 of 3 pages complete");
  await user.click(screen.getByRole("tab", { name: "Profile: Complete" }));
  expect(screen.getByLabelText("First name")).toHaveValue("Grace");
  expect(screen.getByLabelText("First name")).not.toBe(first);
  await user.click(screen.getByRole("tab", { name: "Delivery: Incomplete" }));
  expect(screen.getByLabelText("Delivery address postcode")).toHaveValue("");
});

it("uses manual tab keyboard activation and free navigation without completing or submitting pages", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<MultiPageExample onSave={onSave} />);
  const profile = screen.getByRole("tab", { name: "Profile: Incomplete" });
  profile.focus();
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Delivery: Incomplete" })).toHaveFocus();
  expect(profile).toHaveAttribute("aria-selected", "true");
  await user.keyboard("{Enter}");
  const delivery = screen.getByRole("tab", { name: "Delivery: Incomplete" });
  expect(delivery).toHaveAttribute("aria-selected", "true");
  expect(delivery).toHaveFocus();
  expect(screen.getByRole("status")).toHaveTextContent("0 of 3 pages complete");
  expect(screen.queryByRole("alert")).toBeNull();
  expect(onSave).not.toHaveBeenCalled();
});

it("validates Continue locally and corrects errors on unmounted pages from final submission", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<MultiPageExample onSave={onSave} />);
  await user.click(screen.getByRole("button", { name: "Continue to delivery" }));
  await waitFor(() => expect(screen.getByLabelText("First name")).toHaveFocus());
  await user.type(screen.getByLabelText("First name"), "Ada");
  await user.type(screen.getByLabelText("Last name"), "Lovelace");
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.keyboard("{Enter}");
  await waitFor(() => expect(screen.getByLabelText("Delivery address street")).toHaveFocus());
  await user.click(screen.getByRole("tab", { name: "Review: Pending" }));
  await user.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() => expect(screen.getByLabelText("Delivery address street")).toHaveFocus());
  expect(screen.getByRole("tab", { name: "Delivery: Incomplete" })).toHaveAttribute("aria-selected", "true");
  expect(onSave).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Back to profile" }));
  await waitFor(() => expect(screen.getByLabelText("First name")).toHaveFocus());
});

it("re-evaluates conditional completion and retains a hidden mobile-number draft", async () => {
  const user = userEvent.setup();
  const values = validValues();
  values.notifications = { channel: "sms", phone: "invalid draft" };
  render(<MultiPageExample defaultValues={values} />);
  await user.click(screen.getByRole("tab", { name: "Review: Pending" }));
  await user.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() => expect(screen.getByLabelText("Mobile number")).toHaveFocus());
  await user.click(screen.getByRole("combobox", { name: "Notification method" }));
  await user.click(await screen.findByRole("option", { name: "Email" }));
  expect(screen.queryByLabelText("Mobile number")).toBeNull();
  expect(screen.getByRole("tab", { name: "Notifications: Complete" })).toBeInTheDocument();
  await user.click(screen.getByRole("combobox", { name: "Notification method" }));
  await user.click(await screen.findByRole("option", { name: "SMS" }));
  expect(screen.getByLabelText("Mobile number")).toHaveValue("invalid draft");
  expect(screen.getByRole("tab", { name: "Notifications: Incomplete" })).toBeInTheDocument();
});

it("keeps navigation pending during save, submits parsed data, and distinguishes completion from saved state", async () => {
  let finish!: () => void;
  const onSave = vi.fn((_payload: MultiPageProfileValues) => new Promise<void>((resolve) => { finish = resolve; }));
  const user = userEvent.setup();
  render(<MultiPageExample onSave={onSave} defaultValues={validValues()} />);
  await user.click(screen.getByRole("tab", { name: "Review: Ready" }));
  await user.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0]![0]).toEqual({ ...validValues(), name: { firstName: "Ada", lastName: "Lovelace" } });
  for (const tab of screen.getAllByRole("tab")) expect(tab).toBeDisabled();
  for (const button of within(screen.getByRole("tabpanel")).getAllByRole("button")) expect(button).toBeDisabled();
  finish();
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("3 of 3 pages complete · Saved"));
  await user.click(screen.getByRole("button", { name: "Edit profile" }));
  await waitFor(() => expect(screen.getByLabelText("First name")).toHaveFocus());
  await user.type(screen.getByLabelText("First name"), " changed");
  expect(screen.getByRole("status")).toHaveTextContent("3 of 3 pages complete · Not saved");
  expect(onSave).toHaveBeenCalledTimes(1);
});

it("loads the shared sample without changing it as editors change", async () => {
  const user = userEvent.setup();
  render(<MultiPageExample />);
  expect(screen.getByRole("status")).toHaveTextContent("0 of 3 pages complete");
  await user.click(screen.getByRole("button", { name: "Load sample data" }));
  expect(screen.getByLabelText("First name")).toHaveValue(exampleData.multiPage.name.firstName);
  expect(screen.getByRole("status")).toHaveTextContent("3 of 3 pages complete");
  await user.clear(screen.getByLabelText("First name"));
  expect(screen.getByRole("status")).toHaveTextContent("2 of 3 pages complete");
  await user.click(screen.getByRole("button", { name: "Load sample data" }));
  expect(screen.getByLabelText("First name")).toHaveValue(exampleData.multiPage.name.firstName);
  expect(screen.getByRole("status")).toHaveTextContent("3 of 3 pages complete");
});
