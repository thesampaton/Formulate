import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { InfrastructureForm } from "../examples/react/src/compositions/infrastructure";
import { useInfrastructure } from "../examples/react/src/hooks/use-infrastructure";
import type { InfrastructureProps } from "../examples/react/src/hooks/use-infrastructure";
import type { InfrastructureDraft, InfrastructureValues } from "../examples/react/src/declarations/infrastructure";
import { draftSchema, infrastructureSchema, Resource } from "../examples/react/src/declarations/infrastructure";
import { Form } from "@formulate/react";
import type { Choice, ChoiceLoader } from "@formulate/react";

const options = [{ value: "small", label: "Small" }, { value: "large", label: "Large" }];
const values = (): InfrastructureValues => ({ regionId: "east", resources: [
  { resourceId: "R1", name: " One ", machineSize: "small" },
  { resourceId: "R2", name: "Two", machineSize: "large" },
] });
const props = (): InfrastructureProps => ({ accountId: "A", defaultValues: values(), listMachineSizes: async () => options,
  drafts: { save: async () => undefined, load: async () => null }, previewPlan: async () => ({ reference: "plan-1" }), onProvision: vi.fn() });
function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Value>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

it("keeps repeated section values and errors with surviving IDs and discards a deleted item's lookup", async () => {
  const user = userEvent.setup();
  const calls: ReturnType<typeof deferred<readonly Choice[]>>[] = [];
  const listMachineSizes: ChoiceLoader = vi.fn(() => { const request = deferred<readonly Choice[]>(); calls.push(request); return request.promise; });
  const initial = values(); initial.resources[0]!.name = "";
  render(<InfrastructureForm {...props()} listMachineSizes={listMachineSizes} defaultValues={initial} />);
  await waitFor(() => expect(calls).toHaveLength(2));
  await user.click(screen.getByRole("button", { name: "Preview plan" }));
  expect(screen.getByLabelText("Resource 1 name")).toHaveAttribute("aria-invalid", "true");
  await user.click(within(screen.getByRole("group", { name: "Resource 2" })).getByRole("button", { name: "Move up" }));
  expect(screen.getByLabelText("Resource 1 name")).toHaveValue("Two");
  expect(screen.getByLabelText("Resource 1 name")).toHaveFocus();
  expect(screen.getByLabelText("Resource 2 name")).toHaveValue("");
  expect(screen.getByLabelText("Resource 2 name")).toHaveAttribute("aria-invalid", "true");
  await user.click(within(screen.getByRole("group", { name: "Resource 2" })).getByRole("button", { name: "Remove" }));
  expect(screen.getByRole("group", { name: "Resources" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Add resource" }));
  expect(screen.getByLabelText("Resource 2 name")).toHaveFocus();
  await waitFor(() => expect(calls).toHaveLength(3));
  await act(async () => { calls[1]!.resolve(options); calls[2]!.resolve([{ value: "new", label: "New size" }]); });
  await act(async () => calls[0]!.resolve([{ value: "old", label: "Deleted size" }]));
  expect(screen.getByLabelText("Resource 1 name")).toHaveValue("Two");
  expect(screen.getByLabelText("Resource 2 name")).toHaveValue("");
  await user.click(screen.getByRole("combobox", { name: "Resource 2 size" }));
  expect(screen.queryByRole("option", { name: "Deleted size" })).toBeNull();
  await user.click(await screen.findByRole("option", { name: "New size" }));
  expect(screen.getByRole("combobox", { name: "Resource 1 size" })).toHaveTextContent("Large");
});

it("saves incomplete snapshots without acknowledging newer edits and restores into a fresh runtime with current choices", async () => {
  const user = userEvent.setup();
  const saved = deferred<void>();
  let stored: InfrastructureDraft | undefined;
  const drafts = { save: vi.fn(async (draft: InfrastructureDraft) => { stored = structuredClone(draft); await saved.promise; }), load: async () => stored };
  const initial = values(); initial.resources[0]!.name = "";
  const view = render(<InfrastructureForm {...props()} drafts={drafts} defaultValues={initial} />);
  await user.click(screen.getByRole("button", { name: "Save draft" }));
  expect(stored?.values.resources[0]!.name).toBe("");
  await user.type(screen.getByLabelText("Resource 1 name"), "Newer work");
  await act(async () => saved.resolve());
  expect(screen.getByText("Draft has unsaved changes · New plan required")).toBeInTheDocument();
  expect(stored?.values.resources[0]!.name).toBe("");
  const oldControlId = screen.getByLabelText("Resource 1 name").id;
  view.unmount();
  const onProvision = vi.fn();
  render(<InfrastructureForm {...props()} defaultValues={{ regionId: "", resources: [] }} drafts={drafts}
    listMachineSizes={async () => [{ value: "large", label: "Large" }]} onProvision={onProvision} />);
  await user.click(screen.getByRole("button", { name: "Restore draft" }));
  expect(screen.getByLabelText("Resource 1 name")).toHaveValue("");
  expect(screen.getByLabelText("Resource 1 name").id).not.toBe(oldControlId);
  expect(screen.getByLabelText("Resource 1 name").closest("fieldset")).toHaveAttribute("data-resource-id", "R1");
  expect(screen.getByLabelText("Resource 2 name").closest("fieldset")).toHaveAttribute("data-resource-id", "R2");
  await screen.findByText("The retained choice is unavailable. Choose another option.");
  await user.click(screen.getByRole("button", { name: "Review" }));
  await user.click(screen.getByRole("button", { name: "Provision" }));
  await waitFor(() => expect(screen.getByLabelText("Resource 1 name")).toHaveFocus());
  expect(onProvision).not.toHaveBeenCalled();
  expect(stored).toMatchObject({ definition: "infrastructure-request", version: 1, revision: expect.any(String), values: initial });
  expect(Object.keys(stored!)).toEqual(["definition", "version", "revision", "values"]);
});

it("preserves current work after incompatible drafts, storage failures, and late load responses", async () => {
  const user = userEvent.setup();
  const load = deferred<unknown>();
  const draftLoad = vi.fn().mockResolvedValueOnce({ version: 2, values: values() }).mockImplementationOnce(() => load.promise).mockRejectedValueOnce(new Error("Unavailable"));
  render(<InfrastructureForm {...props()} drafts={{ save: async () => { throw new Error("Full"); }, load: draftLoad }} />);
  await user.click(screen.getByRole("button", { name: "Restore draft" }));
  expect(screen.getByText("This draft is unavailable or incompatible. Your current work was kept.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Restore draft" }));
  await user.clear(screen.getByLabelText("Resource 1 name"));
  await user.type(screen.getByLabelText("Resource 1 name"), "Latest");
  await act(async () => load.resolve({ definition: "infrastructure-request", version: 1, revision: "saved", values: values() }));
  expect(screen.getByLabelText("Resource 1 name")).toHaveValue("Latest");
  expect(screen.getByText(/The draft arrived after you edited/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Restore draft" }));
  expect(screen.getByText("Unable to load the draft. Your current work was kept.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Save draft" }));
  expect(screen.getByText("Unable to save this draft. Your edits are retained.")).toBeInTheDocument();
  expect(screen.getByLabelText("Resource 1 name")).toHaveValue("Latest");
});

it("rejects stale plans, requires a fresh plan after edits and restore, and submits the exact current configuration", async () => {
  const user = userEvent.setup();
  const preview = deferred<{ reference: string }>();
  const previewPlan = vi.fn().mockImplementationOnce(() => preview.promise).mockResolvedValue({ reference: "fresh-plan" });
  const onProvision = vi.fn();
  render(<InfrastructureForm {...props()} previewPlan={previewPlan} onProvision={onProvision}
    drafts={{ save: async () => undefined, load: async () => ({ definition: "infrastructure-request", version: 1, revision: "old-draft", values: values() }) }} />);
  await waitFor(() => expect(screen.queryByText("Checking available choices…")).toBeNull());
  await user.click(screen.getByRole("button", { name: "Preview plan" }));
  await waitFor(() => expect(previewPlan).toHaveBeenCalledTimes(1));
  await user.clear(screen.getByLabelText("Resource 1 name"));
  await user.type(screen.getByLabelText("Resource 1 name"), "New");
  await act(async () => preview.resolve({ reference: "old-plan" }));
  expect(screen.getByText("The configuration changed. Preview a new plan.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Review" }));
  await user.click(screen.getByRole("button", { name: "Provision" }));
  expect(onProvision).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Configure" }));
  await user.click(screen.getByRole("button", { name: "Preview plan" }));
  await screen.findByText("The plan matches this configuration.");
  expect(screen.getByRole("group", { name: "Infrastructure summary" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Provision" }));
  await waitFor(() => expect(onProvision).toHaveBeenCalledTimes(1));
  expect(onProvision.mock.calls[0]![0]).toEqual({ accountId: "A", configuration: { ...values(), resources: [{ resourceId: "R1", name: "New", machineSize: "small" }, values().resources[1]] }, plan: "fresh-plan" });
  await user.click(screen.getByRole("button", { name: "Restore draft" }));
  await screen.findByText("Draft saved · New plan required");
  await user.click(screen.getByRole("button", { name: "Review" }));
  await user.click(screen.getByRole("button", { name: "Provision" }));
  expect(onProvision).toHaveBeenCalledTimes(1);
});

it("keeps collection rules in the submission schema while allowing incomplete, uniquely identified drafts", () => {
  expect(infrastructureSchema.safeParse({ regionId: "east", resources: [] }).success).toBe(false);
  const repeated = values(); repeated.resources[1]!.name = " One ";
  expect(infrastructureSchema.safeParse(repeated).success).toBe(false);
  const draft = { definition: "infrastructure-request", version: 1, revision: "draft", values: { regionId: "", resources: [{ resourceId: "R1", name: "", machineSize: "" }] } };
  expect(draftSchema.safeParse(draft).success).toBe(true);
  draft.values.resources.push({ resourceId: "R1", name: "Different", machineSize: "small" });
  expect(draftSchema.safeParse(draft).success).toBe(false);
});

it("does not accept an in-flight plan after restoring an identical editing snapshot", async () => {
  const user = userEvent.setup();
  const pending = deferred<{ reference: string }>();
  const previewPlan = vi.fn(() => pending.promise);
  const onProvision = vi.fn();
  render(<InfrastructureForm {...props()} previewPlan={previewPlan} onProvision={onProvision}
    drafts={{ save: async () => undefined, load: async () => ({ definition: "infrastructure-request", version: 1, revision: "same-values", values: values() }) }} />);
  await waitFor(() => expect(screen.queryByText("Checking available choices…")).toBeNull());
  await user.click(screen.getByRole("button", { name: "Preview plan" }));
  await waitFor(() => expect(previewPlan).toHaveBeenCalledTimes(1));
  await user.click(screen.getByRole("button", { name: "Restore draft" }));
  await screen.findByText("Draft restored. Available choices and requirements are being checked again.");
  await act(async () => pending.resolve({ reference: "before-restore" }));
  await user.click(screen.getByRole("button", { name: "Review" }));
  await user.click(screen.getByRole("button", { name: "Provision" }));
  expect(onProvision).not.toHaveBeenCalled();
  expect(screen.getByText("Preview a current plan before provisioning.")).toBeInTheDocument();
});

it("resolves pending correction by durable identity and falls back if that item is removed", async () => {
  let flow!: ReturnType<typeof useInfrastructure>;
  // Stable service objects keep this harness focused on array/focus lifetime.
  const stable = props();
  function StableHarness() {
    flow = useInfrastructure(stable);
    return <Form form={flow.form} onSubmit={() => undefined}>
      <div ref={flow.resourceListRef} tabIndex={-1} role="group" aria-label="Collection">
        {flow.resourceArray.fields.map((item, index) => <Resource.Bind key={item.id} control={flow.form.control}
          bindings={{ name: `resources.${index}.name`, machineSize: `resources.${index}.machineSize` }}>
          <Resource.Field name="name" label={`Name ${item.resourceId}`} />
        </Resource.Bind>)}
      </div>
    </Form>;
  }
  render(<StableHarness />);
  await act(async () => { flow.goToResourceField("R1", "name"); flow.resourceArray.move(0, 1); });
  expect(screen.getByLabelText("Name R1")).toHaveFocus();
  await act(async () => {
    flow.goToResourceField("R1", "name"); flow.resourceArray.remove(1);
    flow.resourceArray.append({ resourceId: "R3", name: "Replacement", machineSize: "small" }, { shouldFocus: false });
  });
  expect(screen.getByRole("group", { name: "Collection" })).toHaveFocus();
  expect(screen.getByLabelText("Name R3")).not.toHaveFocus();
});

it("uses the form action for Enter, blocks duplicate previews, and releases pending state after a failed plan", async () => {
  const user = userEvent.setup();
  const pending = deferred<{ reference: string }>();
  const previewPlan = vi.fn().mockImplementationOnce(() => pending.promise).mockResolvedValue({ reference: "retry-plan" });
  render(<InfrastructureForm {...props()} previewPlan={previewPlan} />);
  await waitFor(() => expect(screen.queryByText("Checking available choices…")).toBeNull());
  await user.click(screen.getByLabelText("Resource 1 name"));
  await user.keyboard("{Enter}");
  await waitFor(() => expect(previewPlan).toHaveBeenCalledTimes(1));
  fireEvent.submit(screen.getByRole("form", { name: "Infrastructure request" }));
  expect(previewPlan).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Preparing plan…" })).toBeDisabled();
  await act(async () => pending.reject(new Error("Plan service unavailable")));
  expect(screen.getByText("Unable to preview the plan. Try again.")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Preview plan" }));
  expect(await screen.findByText("The plan matches this configuration.")).toBeInTheDocument();
});

it("invalidates pending plan evidence when the application account changes with identical editing values", async () => {
  const user = userEvent.setup();
  const pending = deferred<{ reference: string }>();
  const stable = props();
  stable.previewPlan = vi.fn().mockImplementationOnce(() => pending.promise).mockResolvedValue({ reference: "account-B-plan" });
  const view = render(<InfrastructureForm {...stable} />);
  await waitFor(() => expect(screen.queryByText("Checking available choices…")).toBeNull());
  await user.click(screen.getByRole("button", { name: "Preview plan" }));
  await waitFor(() => expect(stable.previewPlan).toHaveBeenCalledTimes(1));
  view.rerender(<InfrastructureForm {...stable} accountId="B" />);
  await act(async () => pending.resolve({ reference: "account-A-plan" }));
  expect(screen.queryByText("The plan matches this configuration.")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Preview plan" }));
  await screen.findByText("The plan matches this configuration.");
  await user.click(screen.getByRole("button", { name: "Provision" }));
  await waitFor(() => expect(stable.onProvision).toHaveBeenCalledWith({
    accountId: "B", configuration: { ...values(), resources: [{ ...values().resources[0], name: "One" }, values().resources[1]] }, plan: "account-B-plan",
  }));
});
