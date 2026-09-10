import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { CloudDeploymentForm } from "../examples/react/src/compositions/cloud-deployment";
import { createChoiceRequest } from "../examples/react/src/lib/choice-request";
import type { Choice, ChoiceLoader } from "../examples/react/src/lib/choice-request";
import type { CloudValues } from "../examples/react/src/declarations/cloud-deployment";

function controlledChoices() {
  const calls: { input: string; resolve: (options: readonly Choice[]) => void; reject: (error: Error) => void }[] = [];
  const load: ChoiceLoader = vi.fn((input) => new Promise<readonly Choice[]>((resolve, reject) => { calls.push({ input, resolve, reject }); }));
  return { load, calls };
}
const options = (value: string) => [{ value, label: value }];
const defaults = (): CloudValues => ({
  environment: "production", primary: { accountId: "A", regionId: "A1" }, recovery: { accountId: "B", regionId: "B1" }, production: "CHANGE-123",
});
async function choose(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: option }));
}

it("combines out-of-order Regions, removal of the current page, retained drafts, retry and exact applicable submission", async () => {
  const user = userEvent.setup();
  const service = controlledChoices();
  const onDeploy = vi.fn();
  render(<CloudDeploymentForm listRegions={service.load} defaultValues={defaults()} onDeploy={onDeploy} />);
  await waitFor(() => expect(service.calls).toHaveLength(2));
  await act(async () => { service.calls[0]!.resolve(options("A1")); service.calls[1]!.resolve(options("B1")); });
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByLabelText("Production change reference")).toHaveValue("CHANGE-123");
  await user.click(screen.getByRole("button", { name: "Targets" }));
  await choose(user, "Primary account", "Account B");
  await choose(user, "Primary account", "Account C");
  expect(service.calls.map((call) => call.input)).toEqual(["A", "B", "B", "C"]);
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.queryByLabelText("Production change reference")).toBeNull();
  await act(async () => service.calls[3]!.resolve(options("C1")));
  await act(async () => service.calls[2]!.resolve(options("A1")));
  expect(screen.getByText("Primary: The retained choice is unavailable. Choose another option.")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Recovery region" })).toHaveTextContent("B1");
  await choose(user, "Primary region", "C1");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByLabelText("Production change reference")).toHaveValue("CHANGE-123");
  await choose(user, "Environment", "Development");
  await waitFor(() => expect(screen.getByRole("combobox", { name: "Environment" })).toHaveFocus());
  expect(screen.queryByLabelText("Production change reference")).toBeNull();
  expect(screen.getByRole("button", { name: "Production" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Production" }));
  expect(screen.queryByLabelText("Production change reference")).toBeNull();
  await choose(user, "Primary account", "Account A");
  await choose(user, "Environment", "Production");
  expect(screen.queryByText(/Production is no longer required/)).toBeNull();
  await user.click(screen.getByRole("button", { name: "Production" }));
  expect(screen.getByLabelText("Production change reference")).toHaveValue("CHANGE-123");
  await user.click(screen.getByRole("button", { name: "Review" }));
  await user.click(screen.getByRole("button", { name: "Deploy" }));
  expect(onDeploy).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByLabelText("Primary region")).toHaveFocus());
  await act(async () => service.calls[4]!.reject(new Error("Offline")));
  await user.click(screen.getByRole("button", { name: "Retry primary regions" }));
  await act(async () => service.calls[5]!.resolve(options("A2")));
  await choose(user, "Primary region", "A2");
  await user.click(screen.getByRole("button", { name: "Review" }));
  await user.click(screen.getByRole("button", { name: "Deploy" }));
  await waitFor(() => expect(onDeploy).toHaveBeenCalledTimes(1));
  expect(onDeploy.mock.calls[0]![0]).toEqual({ ...defaults(), primary: { accountId: "A", regionId: "A2" } });
  await choose(user, "Environment", "Development");
  expect(screen.queryByText("Production change: CHANGE-123")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Deploy" }));
  await waitFor(() => expect(onDeploy).toHaveBeenCalledTimes(2));
  const { production: _draft, ...expected } = defaults();
  expect(onDeploy.mock.calls[1]![0]).toEqual({ ...expected, environment: "development", primary: { accountId: "A", regionId: "A2" } });
});

it("rejects old success/failure for A → B → A and disposed uses even if abort is ignored", async () => {
  const service = controlledChoices();
  const request = createChoiceRequest(service.load);
  request.setInput("A"); request.setInput("B"); request.setInput("A");
  await Promise.resolve();
  service.calls[0]!.resolve(options("old-A")); service.calls[1]!.reject(new Error("old-B"));
  await Promise.resolve(); await Promise.resolve();
  expect(request.getSnapshot().status).toBe("pending");
  expect(request.problem("A", "old-A")).toBe("Checking available choices…");
  service.calls[2]!.resolve(options("current-A"));
  await Promise.resolve(); await Promise.resolve();
  expect(request.problem("A", "current-A")).toBeUndefined();
  request.retry(); await Promise.resolve();
  request.dispose();
  service.calls[3]!.resolve(options("late-A"));
  await Promise.resolve(); await Promise.resolve();
  expect(request.problem("A", "late-A")).toBe("Checking available choices…");
  expect(request.getSnapshot().options).toEqual([]);
});

it("rechecks retained production requirements and never treats a direct Review visit as permission to deploy", async () => {
  const user = userEvent.setup();
  const onDeploy = vi.fn();
  const service: ChoiceLoader = async (input) => options(`${input}1`);
  render(<CloudDeploymentForm listRegions={service} defaultValues={defaults()} onDeploy={onDeploy} />);
  await screen.findByText("Primary: Ready");
  await user.click(screen.getByRole("button", { name: "Production" }));
  await user.clear(screen.getByLabelText("Production change reference"));
  await choose(user, "Environment", "Development");
  await choose(user, "Environment", "Production");
  await user.click(screen.getByRole("button", { name: "Review" }));
  fireEvent.submit(screen.getByRole("form", { name: "Cloud deployment" }));
  await waitFor(() => expect(screen.getByLabelText("Production change reference")).toHaveFocus());
  expect(screen.getByText("Enter a production change reference.")).toBeInTheDocument();
  expect(onDeploy).not.toHaveBeenCalled();
});
