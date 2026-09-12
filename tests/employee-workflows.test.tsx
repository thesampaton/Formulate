import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { EmployeeOnboardingForm } from "../examples/react/src/compositions/employee-onboarding";
import { InternalTransferForm } from "../examples/react/src/compositions/internal-transfer";
import { EmployeeOnboarding, InternalTransfer } from "../examples/react/src/declarations/employee-workflows";
import { exampleData } from "../examples/react/src/data/example-data";
import { Row, Stack } from "../examples/react/src/components/formulate/layouts";
import type { EmploymentValues } from "../examples/react/src/declarations/employment";

afterEach(() => vi.restoreAllMocks());
const hosts = ["onboarding", "transfer"] as const;
const requirements = [
  { field: "employmentType", label: "Employment type", error: "Choose an employment type." },
  { field: "startDate", label: "Start date", error: "Enter a valid start date." },
  { field: "managerId", label: "Manager", error: "Choose a manager." },
] as const;

it.each(hosts.flatMap((host) => requirements.map((requirement) => ({ host, ...requirement }))))(
  "$host preserves the shared $field requirement and correction focus",
  async ({ host, field, label, error }) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const details: EmploymentValues = { ...exampleData.employment.onboarding.employment, [field]: "" };
    render(host === "onboarding"
      ? <EmployeeOnboardingForm onSubmit={onSubmit} defaultValues={{ employment: details, equipment: "" }} />
      : <InternalTransferForm onSubmit={onSubmit} defaultValues={{ proposedEmployment: details }} />);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByLabelText(label, { selector: "input:not([aria-hidden]), button" })).toHaveFocus());
    expect(screen.getByText(error)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Employment details" })).toBeInTheDocument();
  },
);

it("keeps two simultaneous page uses independent and allows only local progression", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  const transfer = vi.fn();
  const values = structuredClone(exampleData.employment);
  values.transfer.proposedEmployment.employmentType = "permanent";
  values.transfer.proposedEmployment.managerId = "alex";
  render(<StrictMode>
    <EmployeeOnboardingForm onSubmit={onSubmit} defaultValues={{ ...values.onboarding, equipment: "" }} />
    <InternalTransferForm onSubmit={transfer} defaultValues={values.transfer} />
  </StrictMode>);
  const first = within(screen.getByRole("form", { name: "Employee onboarding" }));
  const second = within(screen.getByRole("form", { name: "Internal transfer" }));
  for (const { label } of requirements) expect(first.getByLabelText(label).id).not.toBe(second.getByLabelText(label).id);
  const secondDate = second.getByLabelText("Start date");
  fireEvent.change(first.getByLabelText("Start date"), { target: { value: "2027-02-01" } });
  await user.click(first.getByRole("combobox", { name: "Employment type" }));
  await user.click(await screen.findByRole("option", { name: "Contract" }));
  await user.click(first.getByRole("combobox", { name: "Manager" }));
  await user.click(await screen.findByRole("option", { name: "Jordan Lee" }));
  expect(secondDate).toHaveValue("2026-11-02");
  expect(second.getByRole("combobox", { name: "Employment type" })).toHaveTextContent("Permanent");
  expect(second.getByRole("combobox", { name: "Manager" })).toHaveTextContent("Alex Morgan");
  first.getByLabelText("Start date").focus();
  await user.keyboard("{Enter}");
  await waitFor(() => expect(first.getByLabelText("Equipment request")).toHaveFocus());
  expect(onSubmit).not.toHaveBeenCalled();
  await user.click(first.getByRole("button", { name: "Continue" }));
  expect(first.getByText("Describe the equipment required.")).toBeInTheDocument();
  expect(second.queryByRole("alert")).toBeNull();
  await user.click(second.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(second.getByRole("group", { name: "Transfer summary" })).toHaveFocus());
  expect(second.queryByRole("combobox")).toBeNull();
  expect(transfer).not.toHaveBeenCalled();
  await user.click(first.getByRole("button", { name: "Back" }));
  expect(first.getByLabelText("Start date")).toHaveValue("2027-02-01");
  await user.click(second.getByRole("button", { name: "Edit employment" }));
  expect(second.getByLabelText("Start date")).toHaveValue("2026-11-02");
});

it.each(hosts)("%s validates an off-screen edit and corrects the existing page use", async (host) => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  let changeManager: () => void = () => { throw new Error("Runtime was not captured"); };
  if (host === "onboarding") {
    const original = EmployeeOnboarding.useForm;
    vi.spyOn(EmployeeOnboarding, "useForm").mockImplementation((options) => {
      const form = original(options);
      changeManager = () => form.setValue("employment.managerId", "");
      return form;
    });
  } else {
    const original = InternalTransfer.useForm;
    vi.spyOn(InternalTransfer, "useForm").mockImplementation((options) => {
      const form = original(options);
      changeManager = () => form.setValue("proposedEmployment.managerId", "");
      return form;
    });
  }
  render(host === "onboarding"
    ? <EmployeeOnboardingForm onSubmit={onSubmit} defaultValues={structuredClone(exampleData.employment.onboarding)} />
    : <InternalTransferForm onSubmit={onSubmit} defaultValues={structuredClone(exampleData.employment.transfer)} />);
  await user.click(screen.getByRole("button", { name: "Continue" }));
  if (host === "onboarding") await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByLabelText("Manager", { selector: "button" })).not.toBeVisible();
  act(changeManager);
  await user.click(screen.getByRole("button", { name: host === "onboarding" ? "Request onboarding" : "Request transfer" }));
  await waitFor(() => expect(screen.getByLabelText("Manager", { selector: "button" })).toHaveFocus());
  expect(screen.getByText("Choose a manager.")).toBeInTheDocument();
  expect(screen.getByLabelText("Start date")).toHaveValue(host === "onboarding" ? "2026-10-01" : "2026-11-02");
  expect(onSubmit).not.toHaveBeenCalled();
});

it.each(hosts)("%s preserves values and exact payload when the host replaces the page layout", async (host) => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  const renderHost = (layout: typeof Row | typeof Stack) => host === "onboarding"
    ? <EmployeeOnboardingForm onSubmit={onSubmit} defaultValues={structuredClone(exampleData.employment.onboarding)} layout={layout} />
    : <InternalTransferForm onSubmit={onSubmit} defaultValues={structuredClone(exampleData.employment.transfer)} layout={layout} />;
  const view = render(renderHost(Stack));
  fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2027-01-05" } });
  view.rerender(renderHost(Row));
  expect(screen.getByLabelText("Start date")).toHaveValue("2027-01-05");
  expect(screen.getByLabelText("Start date").closest('[data-formulate-layout="row"]')).not.toBeNull();
  expect(screen.getAllByLabelText(/^(Employment type|Start date|Manager)$/).map((field) => field.getAttribute("name"))).toEqual([
    null, `${host === "onboarding" ? "employment" : "proposedEmployment"}.startDate`, null,
  ]);
  await user.click(screen.getByRole("button", { name: "Continue" }));
  if (host === "onboarding") await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.getByLabelText("Start date")).not.toBeVisible();
  await user.click(screen.getByRole("button", { name: host === "onboarding" ? "Request onboarding" : "Request transfer" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]![0]).toEqual(host === "onboarding"
    ? { employment: { ...exampleData.employment.onboarding.employment, startDate: "2027-01-05" }, equipment: "Laptop and monitor" }
    : { proposedEmployment: { ...exampleData.employment.transfer.proposedEmployment, startDate: "2027-01-05" } });
});
