import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { createGraphRuntime, flattenGraphValues } from "../packages/react/src/graph/index";
import { useGraphForm } from "@formulate/react";
import { CloudDeploymentForm } from "../examples/react/src/compositions/cloud-deployment";
import { CloudDeployment, createCloudGraph } from "../examples/react/src/declarations/cloud-deployment";
import type { CloudPayload, CloudValues } from "../examples/react/src/declarations/cloud-deployment";
import type { ChoiceLoader } from "../packages/react/src/choices/definition";

it("round-trips one cloud definition through JSON and produces the same React and agent payloads", async () => {
  const listRegions: ChoiceLoader = async (account) => [{ value: `${account}1`, label: `${account} region 1` }];
  const exported = createCloudGraph(listRegions);
  const graph = JSON.parse(JSON.stringify(exported.graph));
  expect(graph).toEqual(exported.graph);
  expect(graph.nodes.primary.use).toBe("cloud.deployment-target");
  expect(graph.nodes.recovery.use).toBe("cloud.deployment-target");
  expect(graph.nodes["deployment-name"]).toMatchObject({ bind: "resourceName", use: "cloud.deployment-name" });
  expect(graph.relations).toContainEqual(["targets", "contains", "deployment-name"]);
  expect(graph.nodes["primary.accountId"].contract).toEqual({ type: "string", enum: ["A", "B", "C"] });
  expect(graph.nodes["primary.regionId"].contract).toEqual({ type: "string", minLength: 1 });
  expect(graph.nodes["primary.regionId"]).not.toHaveProperty("required");
  expect(graph.nodes["primary.regionId"].choices.dependencies).toEqual(["primary.accountId"]);
  expect(graph.nodes["recovery.regionId"].choices.dependencies).toEqual(["recovery.accountId"]);
  const initial = {
    environment: "production", primary: { accountId: "A", regionId: "A1" },
    recovery: { accountId: "B", regionId: "B1" }, production: "  CHANGE-123  ", resourceName: "",
  };
  const agent = createGraphRuntime(graph, { capabilities: exported.capabilities, state: { values: flattenGraphValues(graph, initial) } });
  expect(agent.inspect().status).toBe("pending");
  await waitFor(() => expect(agent.inspect().status).toBe("complete"));
  expect(agent.inspect().payload).toEqual({ ...initial, production: "CHANGE-123", resourceName: "production-A" });
  const user = userEvent.setup();
  const onDeploy = vi.fn();
  render(<CloudDeploymentForm listRegions={listRegions} defaultValues={initial} onDeploy={onDeploy} />);
  await screen.findByText("Primary: Ready");
  await user.click(screen.getByRole("button", { name: "Review" }));
  await user.click(screen.getByRole("button", { name: "Deploy" }));
  await waitFor(() => expect(onDeploy).toHaveBeenCalledTimes(1));
  expect(onDeploy.mock.calls[0]![0]).toEqual(agent.inspect().payload);

  agent.update({ production: "", environment: "development" });
  expect(agent.inspect().status).toBe("complete");
  expect(agent.inspect().payload).not.toHaveProperty("production");
  expect(agent.inspect().state.values.production).toBe("");
  expect(agent.inspect().state.values.resourceName).toBe("development-A");
  await user.click(screen.getByRole("combobox", { name: "Environment" }));
  await user.click(await screen.findByRole("option", { name: "Development" }));
  await user.click(screen.getByRole("button", { name: "Deploy" }));
  await waitFor(() => expect(onDeploy).toHaveBeenCalledTimes(2));
  expect(onDeploy.mock.calls[1]![0]).toEqual(agent.inspect().payload);

  agent.update({ environment: "production" });
  expect(agent.inspect().nodes.production?.status).toBe("missing");
  expect(agent.inspect().payload).toBeUndefined();
  agent.update({ "primary.accountId": "C" });
  await waitFor(() => expect(agent.inspect().nodes["primary.regionId"]?.status).toBe("invalid"));
  expect(agent.inspect().state.values["primary.regionId"]).toBe("A1");
  agent.update({ "primary.regionId": "C1", production: "CHANGE-456" });
  expect(agent.inspect().status).toBe("complete");
  expect(agent.inspect().state.values.resourceName).toBe("production-C");
  expect(() => agent.update({ resourceName: "override" })).toThrow(/Derived/);
  agent.dispose();
});

it("enforces the same rules before export, through the React graph adapter, and for an agent", async () => {
  const listRegions: ChoiceLoader = async (account) => [{ value: `${account}1`, label: `${account} region 1` }];
  const services = { listRegions };
  const initial: CloudValues = {
    environment: "production", primary: { accountId: "A", regionId: "A1" },
    recovery: { accountId: "B", regionId: "B1" }, production: "  ", resourceName: "",
  };
  // Normal use needs only the authored definition and its host services.
  const normal = renderHook(() => CloudDeployment.useForm({ services, defaultValues: initial }));
  const exported = createCloudGraph(listRegions);
  const graph = JSON.parse(JSON.stringify(exported.graph));
  const projected = renderHook(() => useGraphForm<CloudValues, CloudPayload>(graph, { capabilities: exported.capabilities, defaultValues: initial }));
  const agent = createGraphRuntime(graph, { capabilities: exported.capabilities, state: { values: flattenGraphValues(graph, initial) } });
  await waitFor(() => {
    expect(normal.result.current.inspection!.nodes.production?.status).toBe("missing");
    expect(projected.result.current.inspection.nodes.production?.status).toBe("missing");
    expect(agent.inspect().nodes.production?.status).toBe("missing");
    expect(normal.result.current.inspection!.nodes["primary.regionId"]?.status).toBe("complete");
  });

  const normalSubmit = vi.fn();
  const graphSubmit = vi.fn();
  await act(async () => {
    await normal.result.current.handleSubmit(normalSubmit)();
    await projected.result.current.handleSubmit(graphSubmit)();
  });
  expect(normalSubmit).not.toHaveBeenCalled();
  expect(graphSubmit).not.toHaveBeenCalled();
  expect(agent.inspect().payload).toBeUndefined();

  await act(async () => {
    normal.result.current.setValue("production", "  CHANGE-789  ");
    projected.result.current.setValue("production", "  CHANGE-789  ");
    agent.update({ production: "  CHANGE-789  " });
  });
  await act(async () => {
    await normal.result.current.handleSubmit(normalSubmit)();
    await projected.result.current.handleSubmit(graphSubmit)();
  });
  expect(normalSubmit.mock.calls[0]![0]).toEqual(agent.inspect().payload);
  expect(graphSubmit.mock.calls[0]![0]).toEqual(agent.inspect().payload);
  expect(agent.inspect().payload).toMatchObject({ production: "CHANGE-789", resourceName: "production-A" });

  await act(async () => {
    normal.result.current.setValue("primary.accountId", "");
    projected.result.current.setValue("primary.accountId", "");
    agent.update({ "primary.accountId": "" });
  });
  await waitFor(() => {
    expect(normal.result.current.inspection!.nodes["primary.regionId"]?.status).toBe("blocked");
    expect(projected.result.current.inspection.nodes["primary.regionId"]?.status).toBe("blocked");
    expect(agent.inspect().nodes["primary.regionId"]?.status).toBe("blocked");
  });
  expect(normal.result.current.getValues("primary.regionId")).toBe("A1");
  expect(projected.result.current.getValues("primary.regionId")).toBe("A1");
  expect(agent.inspect().state.values["primary.regionId"]).toBe("A1");
  normal.unmount();
  projected.unmount();
  agent.dispose();
});

it("reports unresolved named host capabilities after transport instead of accepting opaque schemas", () => {
  const { graph } = createCloudGraph(async () => []);
  const runtime = createGraphRuntime(JSON.parse(JSON.stringify(graph)));
  expect(runtime.inspect().status).toBe("unresolved");
  expect(runtime.inspect().payload).toBeUndefined();
  runtime.dispose();
});
