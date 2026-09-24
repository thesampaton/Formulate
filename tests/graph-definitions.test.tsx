import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { createGraphRuntime, defineChoice, defineField, defineForm, defineSection, expandGraphValues, field, normalizeGraph } from "@formulate/react";

it("exports reusable definitions without repeating validation or including React controls", () => {
  const Resource = defineField({
    definitionId: "resource-name.v1", primitive: "text", schema: z.string().trim().min(1).transform((value) => value.toUpperCase()),
    defaultValue: "worker", label: "Resource name", component: "input", componentProps: { placeholder: "Name" },
  });
  const Deployment = defineForm({ name: field(Resource) }, { id: "deployment" });
  const exported = Deployment.toPortable();
  const graph = JSON.parse(JSON.stringify(exported.graph));
  expect(normalizeGraph(exported.authoring)).toEqual(exported.graph);
  expect(graph.nodes.name).toMatchObject({
    id: "name", bind: "name", use: "resource-name.v1", label: "Resource name",
    validate: { capability: "deployment.name.validate" },
  });
  expect(graph.nodes.name).not.toHaveProperty("required");
  expect(graph.nodes.name).not.toHaveProperty("schema");
  expect(graph.nodes.name).not.toHaveProperty("component");
  expect(graph.nodes.name).not.toHaveProperty("componentProps");
  const runtime = createGraphRuntime(graph, { capabilities: exported.capabilities });
  expect(runtime.inspect().state.values).toEqual({ name: "worker" });
  expect(runtime.inspect().payload).toEqual(Deployment.schema.parse(Deployment.defaultValues));
  expect(runtime.update({ name: "" }).nodes.name!.status).toBe("missing");
  const unresolved = createGraphRuntime(graph);
  expect(unresolved.inspect().status).toBe("unresolved");
  unresolved.dispose();
  runtime.dispose();
});

it("scopes reusable semantics, dependency identities and action guards independently", () => {
  const Service = defineSection({
    enabled: { schema: z.boolean(), defaultValue: true, label: "Enabled", component: "checkbox" },
    region: { id: "location", schema: z.string().min(1), defaultValue: "AU", label: "Region", component: "input" },
    name: { schema: z.string().min(1), defaultValue: "worker", label: "Name", component: "input",
      applicable: { binding: "enabled", equals: true }, dependsOn: ["region"],
      actions: [{ id: "suggest", capability: "suggest-name", when: { binding: "enabled", equals: true } }],
    },
  }, { definitionId: "service.v1" });
  const Deployment = defineForm({ primary: Service, backup: Service }, { id: "deployment" });
  const { graph, capabilities } = Deployment.toPortable();
  expect(graph.nodes.primary!.use).toBe("service.v1");
  expect(graph.nodes["primary.name"]).toMatchObject({
    bind: "primary.name", dependsOn: ["primary.location"], applicable: { binding: "primary.enabled", equals: true },
    actions: [{ id: "suggest", capability: "suggest-name", when: { binding: "primary.enabled", equals: true } }],
  });
  expect(graph.nodes["backup.name"]!.dependsOn).toEqual(["backup.location"]);
  const runtime = createGraphRuntime(graph, { capabilities: { ...capabilities, "suggest-name": () => ({ "primary.name": "suggested" }) } });
  runtime.update({ "primary.region": "", "primary.name": "", "backup.name": "second" });
  expect(runtime.inspect().nodes["primary.name"]!.status).toBe("blocked");
  expect(runtime.inspect().nodes["backup.name"]!.status).toBe("complete");
  runtime.update({ "primary.region": "AU", "primary.enabled": false });
  expect(runtime.inspect().nodes["primary.name"]!.applicable).toBe(false);
  expect(runtime.inspect().payload).toEqual(Deployment.schema.parse(expandGraphValues(runtime.inspect().state.values)));
  expect(runtime.inspect().payload).toEqual({ primary: { enabled: false, region: "AU" }, backup: { enabled: true, region: "AU", name: "second" } });
  runtime.dispose();
});

it("preserves reused custom section refinements and output transforms without binding containers", () => {
  const Target = defineSection({
    name: { schema: z.string().trim().min(1), defaultValue: " worker ", label: "Name", component: "input" },
    region: { schema: z.string(), defaultValue: "AU", label: "Region", component: "input" },
  }, { schema: (schema) => schema.refine((value) => value.name !== "forbidden", { message: "Choose another name", path: ["name"] }).transform((value) => ({ resource: `${value.region}/${value.name}` })) });
  const Deployment = defineForm({ primary: Target, backup: Target });
  const exported = Deployment.toPortable({ id: "deployment" });
  const graph = JSON.parse(JSON.stringify(exported.graph));
  expect(graph.nodes.primary).not.toHaveProperty("bind");
  expect(graph.nodes.primary).not.toHaveProperty("parse");
  expect(graph.nodes.deployment.parse).toEqual({ capability: "deployment.deployment.schema.parse" });
  const runtime = createGraphRuntime(graph, { capabilities: exported.capabilities });
  expect(runtime.inspect().payload).toEqual(Deployment.schema.parse(Deployment.defaultValues));
  expect(runtime.inspect().payload).toEqual({ primary: { resource: "AU/worker" }, backup: { resource: "AU/worker" } });
  expect(runtime.inspect().state.values["primary.name"]).toBe(" worker ");
  runtime.update({ "primary.name": "forbidden" });
  expect(runtime.inspect().nodes["primary.name"]!.issues).toContain("Choose another name");
  expect(runtime.inspect().nodes.primary!.status).toBe("invalid");
  const validatePrimary = exported.capabilities[graph.nodes.primary.validate.capability]!;
  expect(validatePrimary(undefined, { primary: { name: "forbidden", region: "AU" }, backup: { name: "worker", region: "AU" } })).toEqual([
    { path: ["primary", "name"], message: "Choose another name" },
  ]);
  expect(runtime.inspect().nodes.backup!.status).toBe("complete");
  runtime.dispose();
});

it("uses the effective root schema for field validation as well as final output", () => {
  const transform = vi.fn((value: { name: string }) => ({ accepted: value.name }));
  const Definition = defineForm({ name: { schema: z.string().min(3), defaultValue: "", label: "Name", component: "input" } }, {
    schema: () => z.object({ name: z.string() }).transform(transform),
  });
  const { graph, capabilities } = Definition.toPortable();
  const runtime = createGraphRuntime(graph, { capabilities });
  expect(graph.nodes.name).not.toHaveProperty("contract");
  expect(runtime.inspect().nodes.name!.status).toBe("complete");
  expect(runtime.inspect().payload).toEqual({ accepted: "" });
  expect(transform).toHaveBeenCalledTimes(1);
  runtime.update({ name: "ok" });
  expect(runtime.inspect().payload).toEqual({ accepted: "ok" });
  expect(transform).toHaveBeenCalledTimes(2);
  runtime.dispose();
});

it("uses outer custom schemas once to produce authoritative nested output", () => {
  const Leaf = defineSection({ name: { schema: z.string().transform((value) => value + "!"), defaultValue: "worker", label: "Name", component: "input" } }, {
    schema: (schema) => schema.transform((value) => ({ result: value.name })),
  });
  const Group = defineSection({ leaf: Leaf }, { schema: (schema) => schema.transform((value) => ({ target: value.leaf.result })) });
  const WithoutRootTransform = defineForm({ group: Group });
  const WithRootTransform = defineForm({ group: Group }, { schema: (schema) => schema.transform((value) => ({ deployment: value.group.target })) });
  for (const definition of [WithoutRootTransform, WithRootTransform]) {
    const exported = definition.toPortable({ id: "deployment" });
    const runtime = createGraphRuntime(exported.graph, { capabilities: exported.capabilities });
    expect(runtime.inspect().payload).toEqual(definition.schema.parse(definition.defaultValues));
    runtime.dispose();
  }
});

it("authors identity, bindings, composition and page placement before export", () => {
  const members = {
    region: { id: "location", bind: "service.region", schema: z.string(), defaultValue: "AU", label: "Region", component: "input" },
    name: { id: "resource", bind: "service.name", schema: z.string().transform((value) => value.toUpperCase()), defaultValue: "au-worker-01", label: "Name", component: "input", composition: {
      segments: [{ binding: "service.region", transform: (value: unknown) => String(value).toLowerCase() }, { literal: "-" }, { input: true }, { literal: "-" }, { input: true }],
      parse: (value: string) => value.split("-").slice(1),
    } },
  } as const;
  const Deployment = defineForm(members, { id: "deployment", children: [{ id: "setup", role: "page", children: ["region", "name"] }] });
  const Moved = defineForm(members, { id: "deployment", children: [{ id: "setup", role: "page", children: ["region"] }, { id: "review", role: "page", children: ["name"] }] });
  const { graph, capabilities } = Deployment.toPortable();
  expect(graph.nodes.resource!.bind).toBe("service.name");
  expect(graph.nodes.resource).toEqual(Moved.toPortable().graph.nodes.resource);
  expect(graph.relations).toContainEqual(["setup", "contains", "resource"]);
  expect(Moved.toPortable().graph.relations).toContainEqual(["review", "contains", "resource"]);
  expect(graph.nodes.resource!.composition!.segments[0]!.transform).toEqual({ capability: "deployment.resource.segment.0.transform" });
  expect(graph.nodes.resource!.composition!.parse).toEqual({ capability: "deployment.resource.composition.parse" });
  const runtime = createGraphRuntime(JSON.parse(JSON.stringify(graph)), { capabilities });
  runtime.update({ "service.region": "NZ" });
  expect(runtime.inspect().state.values["service.name"]).toBe("nz-worker-01");
  expect(runtime.inspect().payload).toEqual(Deployment.schema.parse(expandGraphValues(runtime.inspect().state.values)));
  expect(runtime.inspect().payload).toEqual({ service: { region: "NZ", name: "NZ-WORKER-01" } });
  runtime.dispose();
});

it("reuses an explicitly bound section without sharing its instance identity or values", () => {
  const Service = defineSection({ name: { id: "resource", schema: z.string().min(1), defaultValue: "worker", label: "Name", component: "input" } }, { id: "service", definitionId: "cloud.service" });
  const Deployment = defineForm({ primary: Service.use({ id: "main", bind: "targets.primary" }), backup: Service.use({ id: "spare", bind: "targets.backup" }) });
  const { graph, capabilities } = Deployment.toPortable();
  expect(graph.nodes["main.resource"]).toMatchObject({ bind: "targets.primary.name" });
  expect(graph.nodes["spare.resource"]).toMatchObject({ bind: "targets.backup.name" });
  expect(graph.nodes.main!.use).toBe("cloud.service");
  const runtime = createGraphRuntime(graph, { capabilities });
  runtime.update({ "targets.primary.name": "primary", "targets.backup.name": "backup" });
  expect(runtime.inspect().payload).toEqual(Deployment.schema.parse(expandGraphValues(runtime.inspect().state.values)));
  expect(runtime.inspect().payload).toEqual({ targets: { primary: { name: "primary" }, backup: { name: "backup" } } });
  runtime.dispose();
});

it("exports declared choice dependencies and the existing loader behavior as a capability", async () => {
  const load = vi.fn(async (project: string) => [{ value: `${project}-east`, label: "East" }]);
  const regionChoices = defineChoice({
    dependencies: ["project"],
    getInput: (values: { project: string }) => values.project || null,
    getRequestKey: (project) => project,
    getLoader: (_services: unknown) => load,
    validateSelection: (selection: string, options) => options.some((option) => option.value === selection) ? undefined : "Unavailable region",
    messages: { missing: "Choose project", pending: "Loading regions", failed: "Load failed" },
  });
  const Target = defineSection({
    project: { schema: z.string().min(1), defaultValue: "acme", label: "Project", component: "input" },
    region: { schema: z.string(), defaultValue: "acme-east", label: "Region", component: "input", choices: regionChoices },
  });
  const Deployment = defineForm({ target: Target });
  const { graph, capabilities } = Deployment.toPortable({ id: "deployment" });
  expect(graph.nodes["target.region"]!.choices).toEqual({ dependencies: ["target.project"], capability: "deployment.target.region.choices" });
  const runtime = createGraphRuntime(graph, { capabilities });
  expect(runtime.inspect().nodes["target.region"]!.status).toBe("pending");
  await waitFor(() => expect(runtime.inspect().status).toBe("complete"));
  expect(load.mock.calls[0]![0]).toBe("acme");
  runtime.update({ "target.region": "obsolete" });
  expect(runtime.inspect().nodes["target.region"]!.issues).toContain("Unavailable region");
  runtime.update({ "target.project": "" });
  expect(runtime.inspect().nodes["target.region"]!.status).toBe("blocked");
  runtime.dispose();
});

it("rejects omitted or duplicate layout members rather than dropping declared semantics", () => {
  const members = { name: { schema: z.string(), defaultValue: "worker", label: "Name", component: "input" } } as const;
  expect(() => defineForm(members, { children: [] }).toPortable()).toThrow("layout omits members");
  expect(() => defineForm(members, { children: ["name", "name"] }).toPortable()).toThrow("more than once");
});

it("runs async refinements once in the authoritative schema and once in the graph evaluation", async () => {
  const check = vi.fn(async (value: string) => value !== "taken");
  const Definition = defineForm({
    enabled: { schema: z.boolean(), defaultValue: true, label: "Enabled", component: "checkbox" },
    name: { schema: z.string().refine(check, "Already taken"), defaultValue: "worker", label: "Name", component: "input", applicable: { binding: "enabled", equals: true } },
  });
  expect(await Definition.schema.parseAsync(Definition.defaultValues)).toEqual({ enabled: true, name: "worker" });
  expect(check).toHaveBeenCalledTimes(1);
  check.mockClear();
  const { graph, capabilities } = Definition.toPortable();
  const runtime = createGraphRuntime(graph, { capabilities });
  await waitFor(() => expect(runtime.inspect().status).toBe("complete"));
  expect(check).toHaveBeenCalledTimes(1);
  expect(runtime.inspect().payload).toEqual({ enabled: true, name: "worker" });
  runtime.update({ name: "taken" });
  await waitFor(() => expect(runtime.inspect().nodes.name!.status).toBe("invalid"));
  expect(check).toHaveBeenCalledTimes(2);
  expect(runtime.inspect().nodes.name!.issues).toContain("Already taken");
  runtime.update({ enabled: false });
  await waitFor(() => expect(runtime.inspect().status).toBe("complete"));
  expect(check).toHaveBeenCalledTimes(2);
  expect(runtime.inspect().payload).toEqual({ enabled: false });
  runtime.dispose();
});


it("enforces declared dependencies in normal scoped validation before any export", async () => {
  const members = {
    region: { id: "location", schema: z.string().min(1), defaultValue: "", label: "Region", component: "input" },
    name: { schema: z.string(), defaultValue: "worker", label: "Name", component: "input", dependsOn: ["region"] },
  } as const;
  const Definition = defineForm(members);
  const normal = renderHook(() => Definition.useForm());
  await act(async () => { expect(await normal.result.current.trigger("name")).toBe(false); });
  expect(normal.result.current.getFieldState("name").error?.message).toBe("Complete this node's dependencies first.");
  const exported = Definition.toPortable();
  const graph = createGraphRuntime(exported.graph, { capabilities: exported.capabilities });
  expect(graph.inspect().nodes.name!.status).toBe("blocked");
  expect(graph.inspect().payload).toBeUndefined();
  graph.dispose();
  normal.unmount();

  // A customized authoritative schema may intentionally accept this dependency.
  const Customized = defineForm(members, { schema: () => z.object({ region: z.string(), name: z.string() }) });
  const customNormal = renderHook(() => Customized.useForm());
  await act(async () => { expect(await customNormal.result.current.trigger("name")).toBe(true); });
  const customExport = Customized.toPortable();
  const customGraph = createGraphRuntime(customExport.graph, { capabilities: customExport.capabilities });
  expect(customGraph.inspect().status).toBe("complete");
  expect(customGraph.inspect().payload).toEqual({ region: "", name: "worker" });
  customGraph.dispose();
  customNormal.unmount();
});

it("shares completion dependencies on authored pages with normal field validation", async () => {
  const Definition = defineForm({
    project: { schema: z.string().min(1), defaultValue: "", label: "Project", component: "input" },
    name: { schema: z.string(), defaultValue: "worker", label: "Name", component: "input", dependsOn: ["setup"] },
  }, { children: [{ id: "setup", role: "page", children: ["project"] }, { id: "resource", role: "section", children: ["name"] }] });
  const normal = renderHook(() => Definition.useForm());
  await act(async () => { expect(await normal.result.current.trigger("name")).toBe(false); });
  const exported = Definition.toPortable();
  const runtime = createGraphRuntime(exported.graph, { capabilities: exported.capabilities });
  expect(runtime.inspect().nodes.name!.status).toBe("blocked");
  expect(runtime.update({ project: "acme" }).status).toBe("complete");
  act(() => normal.result.current.setValue("project", "acme"));
  await act(async () => { expect(await normal.result.current.trigger("name")).toBe(true); });
  normal.unmount();
  runtime.dispose();
});

it("shares composed-value source readiness with ordinary scoped validation", async () => {
  const Definition = defineForm({
    region: { schema: z.string().min(1), defaultValue: "", label: "Region", component: "input" },
    name: { schema: z.string(), defaultValue: "-worker", label: "Name", component: "input", composition: { segments: [{ binding: "region" }, { literal: "-" }, { input: true }] } },
  });
  const normal = renderHook(() => Definition.useForm());
  await act(async () => { expect(await normal.result.current.trigger("name")).toBe(false); });
  expect(normal.result.current.getFieldState("name").error?.message).toBe("Complete this node's dependencies first.");
  const exported = Definition.toPortable();
  const runtime = createGraphRuntime(exported.graph, { capabilities: exported.capabilities });
  expect(runtime.inspect().nodes.name!.status).toBe("blocked");
  act(() => normal.result.current.setValue("region", "au"));
  await act(async () => { expect(await normal.result.current.trigger("name")).toBe(true); });
  expect(runtime.update({ region: "au" }).payload).toEqual(Definition.schema.parse(normal.result.current.getValues()));
  normal.unmount();
  runtime.dispose();
});
