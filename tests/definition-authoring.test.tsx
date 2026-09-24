import { act, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { createGraphRuntime, defineField, defineForm, defineSection, field } from "@formulate/react";

const ResourceName = defineField({
  primitive: "text", definitionId: "cloud.resource-name", schema: z.string().regex(/^[a-z]+-[a-z]+$/),
  defaultValue: "au-worker", label: "Name", component: "input",
  composition: { segments: [{ binding: "region" }, { literal: "-" }, { input: true }] },
});
const Service = defineSection({
  region: { schema: z.string().min(1), defaultValue: "au", label: "Region", component: "input" },
  resource: field(ResourceName, { id: "resource-node", bind: "name" }),
}, { definitionId: "cloud.service", title: "Service" });

it("authors identity, nested binding, applicability and pages before normal React use or export", async () => {
  const Definition = defineForm({
    service: Service.use({ id: "main-service", bind: "deployment.service" }),
    approved: { schema: z.boolean(), defaultValue: false, label: "Require approval", component: "checkbox" },
    approval: { schema: z.string().trim().min(1, "Approval required"), defaultValue: "", label: "Approval", component: "input", applicable: { binding: "approved", equals: true } },
  }, { id: "deployment", children: [
    { id: "targets", role: "page", label: "Targets", children: ["service", "approved"] },
    { id: "approval-page", role: "page", label: "Approval page", children: ["approval"] },
  ] });
  const submit = vi.fn();
  function Example() {
    const form = Definition.useForm();
    return <Definition.Form form={form} onSubmit={submit}><Definition.Fields /><button type="submit">Save</button></Definition.Form>;
  }
  const user = userEvent.setup();
  // Normal usage is exercised before creating any export.
  render(<Example />);
  expect(within(screen.getByRole("region", { name: "Targets" })).getByLabelText("Name")).toHaveValue("au-worker");
  expect(screen.queryByLabelText("Approval")).not.toBeInTheDocument();
  await user.clear(screen.getByLabelText("Region"));
  await user.type(screen.getByLabelText("Region"), "nz");
  expect(screen.getByLabelText("Name")).toHaveValue("nz-worker");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]![0]).toEqual({ deployment: { service: { region: "nz", name: "nz-worker" } }, approved: false });
  await user.click(screen.getByLabelText("Require approval"));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(submit).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Approval required")).toBeInTheDocument();
  await user.type(screen.getByLabelText("Approval"), " OK ");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
  const exported = Definition.toPortable();
  expect(exported.graph.nodes["main-service.resource-node"]).toMatchObject({ bind: "deployment.service.name", use: "cloud.resource-name" });
  expect(exported.graph.relations).toContainEqual(["targets", "contains", "main-service"]);
  const agent = createGraphRuntime(JSON.parse(JSON.stringify(exported.graph)), { capabilities: exported.capabilities });
  agent.update({ "deployment.service.region": "nz", approved: true, approval: " OK " });
  expect(agent.inspect().payload).toEqual(submit.mock.calls[1]![0]);
  agent.dispose();
});

it("reuses sections under explicit sibling bindings while keeping normal form types and defaults", async () => {
  const Pair = defineForm({
    first: Service.use({ id: "primary-node", bind: "services.primary" }),
    second: Service.use({ id: "backup-node", bind: "services.backup" }),
  });
  const values: z.input<typeof Pair.schema> = { services: { primary: { region: "au", name: "au-main" }, backup: { region: "nz", name: "nz-backup" } } };
  const { result } = renderHook(() => Pair.useForm({ defaultValues: values }));
  // Binding paths are editing types; declaration aliases never become values.
  const first: string = result.current.getValues("services.primary.name");
  const second: string = result.current.getValues("services.backup.name");
  expect([first, second]).toEqual(["au-main", "nz-backup"]);
  act(() => result.current.setValue("services.primary.region", "us"));
  expect(result.current.getValues("services.primary.name")).toBe("us-main");
  expect(result.current.getValues("services.backup.name")).toBe("nz-backup");
  const exported = Pair.toPortable();
  expect(exported.graph.nodes["primary-node.resource-node"]!.bind).toBe("services.primary.name");
  expect(exported.graph.nodes["backup-node.resource-node"]!.bind).toBe("services.backup.name");
});

it("uses form applicability in native validation, rendering and the exported graph", async () => {
  const refinement = vi.fn(() => true);
  const Definition = defineForm({
    enabled: { schema: z.boolean(), defaultValue: false, label: "Enabled", component: "checkbox" },
    name: { schema: z.string().min(1).refine(refinement), defaultValue: "", label: "Conditional name", component: "input" },
  }, { applicable: { binding: "enabled", equals: true } });
  const native = renderHook(() => Definition.useForm());
  const submitted = vi.fn();
  const view = render(<Definition.Form form={native.result.current} onSubmit={submitted}><Definition.Fields /></Definition.Form>);
  expect(screen.queryByLabelText("Conditional name")).not.toBeInTheDocument();
  await act(async () => { await native.result.current.handleSubmit(submitted)(); });
  expect(submitted.mock.calls[0]![0]).toEqual({});
  expect(refinement).not.toHaveBeenCalled();
  const exported = Definition.toPortable();
  const graph = createGraphRuntime(exported.graph, { capabilities: exported.capabilities });
  expect(graph.inspect().payload).toEqual(submitted.mock.calls[0]![0]);
  expect(graph.inspect().nodes.name?.applicable).toBe(false);
  act(() => { native.result.current.setValue("enabled", true); graph.update({ enabled: true }); });
  expect(screen.getByLabelText("Conditional name")).toBeInTheDocument();
  await act(async () => { await native.result.current.handleSubmit(submitted)(); });
  expect(submitted).toHaveBeenCalledTimes(1);
  expect(graph.inspect().status).toBe("missing");
  act(() => { native.result.current.setValue("name", "worker"); graph.update({ name: "worker" }); });
  await act(async () => { await native.result.current.handleSubmit(submitted)(); });
  expect(submitted.mock.calls[1]![0]).toEqual(graph.inspect().payload);
  view.unmount();
  native.unmount();
  graph.dispose();
});
