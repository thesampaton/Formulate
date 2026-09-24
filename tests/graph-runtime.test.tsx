import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineChoice } from "../packages/react/src/choices/definition.js";
import { normalizeGraph } from "../packages/react/src/graph/normalize.js";
import { createGraphRuntime, expandGraphValues, flattenGraphValues } from "../packages/react/src/graph/runtime.js";

const tick = async () => { for (let turn = 0; turn < 12; turn++) await Promise.resolve(); };

describe("portable graph runtime", () => {
  it("uses named schema validation as the authority for coercion, transforms, and accepted empty inputs", () => {
    const schema = z.object({ count: z.coerce.number().min(1), name: z.string().trim().min(2), empty: z.string() });
    const graph = normalizeGraph({ id: "form", role: "form", validate: { capability: "form.validate" }, parse: { capability: "form.parse" }, children: [
      { id: "count", bind: "count", defaultValue: "2", contract: { type: "number" }, valueSchema: { type: "number" }, validate: { capability: "count.validate" } },
      { id: "name", bind: "name", defaultValue: " ok ", contract: { type: "string", pattern: "^[a-z]+$" }, validate: { capability: "name.validate" } },
      { id: "empty", bind: "empty", defaultValue: "", contract: { minLength: 1 }, validate: { capability: "empty.validate" } },
    ] });
    const validate = (contract: z.ZodType) => (value: unknown) => {
      const result = contract.safeParse(value);
      return result.success ? undefined : result.error.issues;
    };
    const runtime = createGraphRuntime(graph, { capabilities: {
      "form.validate": validate(schema), "form.parse": (value) => schema.parse(value),
      "count.validate": validate(schema.shape.count), "name.validate": validate(schema.shape.name), "empty.validate": validate(schema.shape.empty),
    } });
    expect(runtime.inspect().status).toBe("complete");
    expect(runtime.inspect().nodes.empty?.status).toBe("complete");
    expect(runtime.inspect().payload).toEqual(schema.parse({ count: "2", name: " ok ", empty: "" }));
    expect(runtime.update({ name: " " }).nodes.name?.status).toBe("missing");
    const invalid = runtime.update({ name: "valid", count: "wrong" });
    expect(invalid.nodes.count?.status).toBe("invalid");
    expect(invalid.payload).toBeUndefined();
    expect(runtime.update({ count: "3" }).payload).toEqual({ count: 3, name: "valid", empty: "" });
    runtime.dispose();
  });

  it("validates drafts, retains inactive values, and constructs only a complete applicable payload", () => {
    const graph = normalizeGraph({ id: "deployment", role: "form", children: [
      { id: "project", bind: "project", required: true, contract: { type: "string", minLength: 2 } },
      { id: "environment", bind: "service.environment", defaultValue: "dev", choices: { options: [{ value: "dev", label: "Development" }, { value: "prod", label: "Production" }] } },
      { id: "approval", bind: "service.approval", required: true, applicable: { binding: "service.environment", equals: "prod" }, parse: { capability: "trim" } },
    ] });
    const runtime = createGraphRuntime(graph, { capabilities: { trim: (value: string) => value.trim() } });
    expect(runtime.inspect().status).toBe("missing");
    expect(runtime.inspect().payload).toBeUndefined();
    expect(runtime.update({ project: "x" }).nodes.project?.status).toBe("invalid");
    expect(runtime.update({ project: "acme", "service.approval": " Approved " }).payload).toEqual({ project: "acme", service: { environment: "dev" } });
    expect(runtime.update({ "service.environment": "prod" }).payload).toEqual({ project: "acme", service: { environment: "prod", approval: "Approved" } });
    runtime.update({ "service.approval": "  " });
    expect(runtime.inspect().nodes.approval?.status).toBe("missing");
    expect(runtime.update({ "service.environment": "dev" }).state.values["service.approval"]).toBe("  ");
    expect(runtime.inspect().status).toBe("complete");
    runtime.dispose();
  });

  it("uses the existing composer to retain authored fragments and resolves named transforms", () => {
    const graph = normalizeGraph({ id: "deployment", role: "form", children: [
      { id: "project", bind: "project", defaultValue: "acme", required: true },
      { id: "name", bind: "service.name", defaultValue: "", required: true, composition: { segments: [{ binding: "project", transform: { capability: "upper" } }, { literal: "-" }, { input: true }] } },
      { id: "resource", bind: "service.resource", composition: { segments: [{ literal: "projects/" }, { binding: "project" }, { literal: "/services/" }, { binding: "service.name" }] } },
    ] });
    const runtime = createGraphRuntime(graph, { capabilities: { upper: (value: string) => value.toUpperCase() } });
    runtime.update({ "service.name": "ACME-api" });
    const snapshot = runtime.update({ project: "beta" });
    expect(snapshot.state.values["service.name"]).toBe("BETA-api");
    expect(snapshot.state.values["service.resource"]).toBe("projects/beta/services/BETA-api");
    expect(snapshot.payload).toEqual({ project: "beta", service: { name: "BETA-api", resource: "projects/beta/services/BETA-api" } });
    expect(() => runtime.update({ "service.resource": "hijack" })).toThrow(/cannot be edited/);
    expect(() => runtime.update({ unknown: "value" })).toThrow(/Unknown value binding/);
    expect(runtime.inspect()).toBe(snapshot);
    runtime.dispose();
  });

  it("shares choice lifecycle, dependency blocking, stale response protection, and selection validation", async () => {
    const requests: { project: string; signal: AbortSignal; resolve: (options: readonly { value: string; label: string }[]) => void }[] = [];
    const loader = (project: string, signal: AbortSignal) => new Promise<readonly { value: string; label: string }[]>((resolve) => requests.push({ project, signal, resolve }));
    const rule = defineChoice({
      getInput: (values: { project?: string }) => values.project || null,
      getRequestKey: (project: string) => project,
      getLoader: () => loader,
      validateSelection: (selection: string, options: readonly { value: string; label: string }[]) => options.some((option) => option.value === selection) ? undefined : "Region is unavailable.",
      messages: { missing: "Choose a project.", pending: "Loading regions.", failed: "Could not load regions." },
    });
    const graph = normalizeGraph({ id: "deployment", role: "form", children: [
      { id: "project", bind: "project", required: true, contract: { type: "string" } },
      { id: "region", bind: "service.region", required: true, choices: { capability: "regions", dependencies: ["project"] } },
    ] });
    const runtime = createGraphRuntime(graph, { capabilities: { regions: (values, selection) => rule.resolve(values, selection, undefined) } });
    expect(runtime.inspect().nodes.region?.status).toBe("blocked");
    runtime.update({ project: "alpha", "service.region": "us" });
    expect(runtime.inspect().nodes.region?.status).toBe("pending");
    await tick();
    runtime.update({ project: "beta" });
    await tick();
    expect(requests.map((request) => request.project)).toEqual(["alpha", "beta"]);
    expect(requests[0]?.signal.aborted).toBe(true);
    requests[1]!.resolve([{ value: "au", label: "Australia" }]);
    await tick();
    expect(runtime.inspect().nodes.region?.status).toBe("invalid");
    expect(runtime.inspect().state.values["service.region"]).toBe("us");
    requests[0]!.resolve([{ value: "us", label: "USA" }]);
    await tick();
    expect(runtime.inspect().nodes.region?.choices?.options).toEqual([{ value: "au", label: "Australia" }]);
    expect(runtime.update({ "service.region": "au" }).payload).toEqual({ project: "beta", service: { region: "au" } });
    runtime.dispose();
  });

  it("reports missing host capabilities and settles named asynchronous validation", async () => {
    const graph = normalizeGraph({ id: "form", role: "form", children: [
      { id: "value", bind: "value", defaultValue: "draft", validate: { capability: "custom" } },
    ] });
    const missing = createGraphRuntime(graph);
    expect(missing.inspect().status).toBe("unresolved");
    expect(missing.inspect().nodes.value?.issues[0]).toContain("custom");
    const async = createGraphRuntime(graph, { capabilities: { custom: async () => undefined } });
    expect(async.inspect().status).toBe("pending");
    expect((await async.waitForValidation()).status).toBe("complete");
    missing.dispose();
    async.dispose();
  });

  it("keeps immutable stable snapshots and permits restoration while forbidding unsafe updates", () => {
    const graph = normalizeGraph({ id: "form", role: "form", children: [{ id: "details", bind: "service.details", contract: { type: "object" } }] });
    const state = { values: { "service.details": { name: "before" } } };
    const runtime = createGraphRuntime(graph, { state });
    const first = runtime.getSnapshot();
    expect(runtime.getSnapshot()).toBe(first);
    expect(Object.isFrozen(first.state.values["service.details"])).toBe(true);
    state.values["service.details"].name = "external mutation";
    expect(first.state.values["service.details"]).toEqual({ name: "before" });
    expect(flattenGraphValues(graph, { service: { details: { name: "restore" } }, other: true })).toEqual({ "service.details": { name: "restore" } });
    expect(expandGraphValues({ "service.details": { name: "restore" } })).toEqual({ service: { details: { name: "restore" } } });
    const next = runtime.replace({ values: { "service.details": { name: "after" } } });
    expect(next).not.toBe(first);
    expect(first.state.values["service.details"]).toEqual({ name: "before" });
    expect(() => runtime.update({ "service.details": Infinity })).toThrow(/JSON/);
    expect(runtime.getSnapshot()).toBe(next);
    runtime.dispose();
  });

  it("does not turn a false optional requirement into a blocked dependency", () => {
    const graph = normalizeGraph({ id: "form", role: "form", children: [
      { id: "flag", bind: "flag" },
      { id: "conditional", bind: "conditional", required: { binding: "flag", present: true } },
    ] });
    const runtime = createGraphRuntime(graph);
    expect(runtime.inspect().status).toBe("complete");
    expect(runtime.update({ flag: true }).nodes.conditional?.status).toBe("missing");
    runtime.dispose();
  });

  it("does not publish or invalidate validation evidence for equivalent state replacements", () => {
    const graph = normalizeGraph({ id: "form", role: "form", children: [{ id: "value", bind: "value", defaultValue: "one", choices: { options: [{ value: "one", label: "One" }] } }] });
    const runtime = createGraphRuntime(graph);
    const first = runtime.getSnapshot();
    const revision = runtime.getValidationRevision();
    let notifications = 0;
    runtime.subscribe(() => notifications++);
    runtime.replace({ values: { value: "one" } });
    runtime.update({ value: "one" });
    expect(runtime.getSnapshot()).toBe(first);
    expect(runtime.getValidationRevision()).toBe(revision);
    expect(notifications).toBe(0);
    runtime.dispose();
  });

  it("starts newly unblocked choice chains and retries failed host requests", async () => {
    const started: string[] = [];
    let fail = true;
    const sourceRule = defineChoice({
      getInput: () => "source", getRequestKey: (input: string) => input,
      getLoader: () => sourceLoader,
      validateSelection: () => undefined,
      messages: { missing: "missing", pending: "pending", failed: "failed" },
    });
    const sourceLoader = async () => { started.push("source"); if (fail) throw new Error("offline"); return [{ value: "source", label: "Source" }]; };
    const dependentRule = defineChoice({
      getInput: () => "dependent", getRequestKey: (input: string) => input,
      getLoader: () => dependentLoader,
      validateSelection: () => undefined,
      messages: { missing: "missing", pending: "pending", failed: "failed" },
    });
    const dependentLoader = async () => { started.push("dependent"); return [{ value: "dependent", label: "Dependent" }]; };
    const graph = normalizeGraph({ id: "form", role: "form", children: [
      { id: "source", bind: "source", defaultValue: "source", choices: { capability: "sourceOptions" } },
      { id: "dependent", bind: "dependent", defaultValue: "dependent", choices: { capability: "dependentOptions", dependencies: ["source"] } },
    ] });
    const runtime = createGraphRuntime(graph, { capabilities: { sourceOptions: (values, selection) => sourceRule.resolve(values, selection, undefined), dependentOptions: (values, selection) => dependentRule.resolve(values, selection, undefined) }, deferChoices: true });
    await tick();
    expect(started).toEqual([]);
    runtime.start();
    await tick();
    expect(started).toEqual(["source"]);
    expect(runtime.inspect().nodes.source?.status).toBe("invalid");
    expect(runtime.inspect().nodes.dependent?.status).toBe("blocked");
    fail = false;
    runtime.retry("source");
    await tick();
    expect(started).toEqual(["source", "source", "dependent"]);
    expect(runtime.inspect().status).toBe("complete");
    runtime.dispose();
  });

  it("owns imported graph and option snapshots without freezing host data", async () => {
    const graph = JSON.parse(JSON.stringify(normalizeGraph({ id: "form", role: "form", children: [{ id: "value", bind: "value", defaultValue: "one", choices: { capability: "choices", options: [{ value: "wrong", label: "Static preview" }] } }] })));
    const hostOptions = [{ value: "one", label: "One" }];
    const loader = async () => hostOptions;
    const rule = defineChoice({ getInput: () => "all", getRequestKey: (input: string) => input, getLoader: () => loader, validateSelection: () => undefined, messages: { missing: "missing", pending: "pending", failed: "failed" } });
    const runtime = createGraphRuntime(graph, { capabilities: { choices: (values, selection) => rule.resolve(values, selection, undefined) } });
    graph.nodes.value.required = true;
    graph.nodes.value.defaultValue = "external mutation";
    expect(runtime.inspect().nodes.value?.status).toBe("pending");
    await tick();
    expect(runtime.inspect().status).toBe("complete");
    expect(runtime.inspect().nodes.value?.choices?.options).toEqual(hostOptions);
    expect(Object.isFrozen(hostOptions)).toBe(false);
    expect(Object.isFrozen(hostOptions[0])).toBe(false);
    hostOptions[0]!.label = "Host mutation";
    expect(runtime.inspect().nodes.value?.choices?.options[0]?.label).toBe("One");
    runtime.dispose();
  });

  it("exposes conditional action availability without invoking host actions", () => {
    const graph = normalizeGraph({ id: "form", role: "form", actions: [
      { id: "deploy", capability: "deploy", when: { binding: "ready", equals: true } },
      { id: "missing", capability: "missing" },
    ], children: [{ id: "ready", bind: "ready", defaultValue: false }] });
    let invoked = false;
    const runtime = createGraphRuntime(graph, { capabilities: { deploy: () => { invoked = true; } } });
    expect(runtime.inspect().nodes.form?.actions?.map((action) => action.status)).toEqual(["unavailable", "unresolved"]);
    expect(runtime.update({ ready: true }).nodes.form?.actions?.map((action) => action.status)).toEqual(["available", "unresolved"]);
    expect(invoked).toBe(false);
    runtime.dispose();
  });

  it("omits optional parser outputs and waits for asynchronous parsing", async () => {
    const graph = normalizeGraph({ id: "form", role: "form", children: [{ id: "optional", bind: "optional", parse: { capability: "optional" } }] });
    const runtime = createGraphRuntime(graph, { capabilities: { optional: () => undefined } });
    expect(runtime.inspect().payload).toEqual({});
    const async = createGraphRuntime(graph, { capabilities: { optional: async () => "value" } });
    expect(async.inspect().nodes.optional?.status).toBe("pending");
    expect((await async.waitForValidation()).payload).toEqual({ optional: "value" });
    runtime.dispose();
    async.dispose();
  });

  it("ignores obsolete asynchronous validation and parsing while preserving submit intent", async () => {
    const validations: { value: string; resolve: (message: string | undefined) => void }[] = [];
    const parsers: { value: string; resolve: (value: string) => void }[] = [];
    const graph = normalizeGraph({ id: "form", role: "form", children: [{ id: "value", bind: "value", defaultValue: "old", validate: { capability: "validate" }, parse: { capability: "parse" } }] });
    const runtime = createGraphRuntime(graph, { capabilities: {
      validate: (value: string) => new Promise<string | undefined>((resolve) => validations.push({ value, resolve })),
      parse: (value: string) => new Promise<string>((resolve) => parsers.push({ value, resolve })),
    } });
    const oldRevision = runtime.getValidationRevision();
    runtime.update({ value: "new" });
    const newRevision = runtime.getValidationRevision();
    expect(newRevision).not.toBe(oldRevision);
    expect(validations.map(({ value }) => value)).toEqual(["old", "new"]);
    validations[0]!.resolve("Obsolete failure");
    await tick();
    expect(runtime.inspect().nodes.value?.issues).toEqual([]);
    expect(runtime.inspect().status).toBe("pending");
    validations[1]!.resolve(undefined);
    await tick();
    expect(parsers.map(({ value }) => value)).toEqual(["new"]);
    expect(runtime.getValidationRevision()).toBe(newRevision);
    runtime.update({ value: "latest" });
    parsers[0]!.resolve("OBSOLETE");
    await tick();
    expect(runtime.inspect().payload).toBeUndefined();
    validations[2]!.resolve(undefined);
    await tick();
    const settled = runtime.waitForValidation();
    parsers[1]!.resolve("LATEST");
    expect((await settled).payload).toEqual({ value: "LATEST" });
    expect(validations).toHaveLength(3);
    runtime.dispose();
  });

  it("does not wait for choice loading when asked to settle validation capabilities", async () => {
    const rule = defineChoice({
      getInput: () => "regions", getRequestKey: (input: string) => input,
      getLoader: () => loader, validateSelection: () => undefined,
      messages: { missing: "missing", pending: "pending", failed: "failed" },
    });
    const loader = () => new Promise<readonly { value: string; label: string }[]>(() => {});
    const graph = normalizeGraph({ id: "form", role: "form", children: [{ id: "region", bind: "region", defaultValue: "AU", choices: { capability: "regions" } }] });
    const runtime = createGraphRuntime(graph, { capabilities: { regions: (values, selection) => rule.resolve(values, selection, undefined) } });
    expect((await runtime.waitForValidation()).status).toBe("pending");
    runtime.dispose();
  });

  it("retains absolute editing paths from root and nested field validators", () => {
    const graph = normalizeGraph({ id: "form", role: "form", validate: { capability: "matching" }, children: [
      { id: "name", bind: "service.name", defaultValue: "one" },
      { id: "confirmation", bind: "service.confirmation", defaultValue: "two" },
      { id: "details", bind: "service.details", defaultValue: { code: "valid" }, validate: { capability: "details" } },
    ] });
    const runtime = createGraphRuntime(graph, { capabilities: {
      matching: (value) => value.service.name === value.service.confirmation ? undefined : [{ path: ["service", "confirmation"], message: "Confirmation must match." }],
      details: (value) => value.code === "valid" ? undefined : [{ path: ["code"], message: "Invalid code." }],
    } });
    expect(runtime.inspect().nodes.form?.validationIssues).toEqual([{ path: ["service", "confirmation"], message: "Confirmation must match." }]);
    expect(runtime.inspect().nodes.form?.issues).toEqual(["Confirmation must match."]);
    const snapshot = runtime.update({ "service.confirmation": "one", "service.details": { code: "invalid" } });
    expect(snapshot.nodes.details?.validationIssues).toEqual([{ path: ["service", "details", "code"], message: "Invalid code." }]);
    expect(Object.isFrozen(snapshot.nodes.details?.validationIssues?.[0]?.path)).toBe(true);
    runtime.dispose();
  });

  it("accepts node identities that coincide with inherited object property names", () => {
    const graph = normalizeGraph({ id: "toString", role: "form", children: [{ id: "valueOf", bind: "value", defaultValue: "present" }] });
    const runtime = createGraphRuntime(graph);
    const node = (id: string) => runtime.inspect().nodes[id];
    expect(node("toString")?.status).toBe("complete");
    expect(node("valueOf")?.value).toBe("present");
    expect(runtime.inspect().payload).toEqual({ value: "present" });
    expect(() => runtime.retry("hasOwnProperty")).toThrow(/Unknown node/);
    runtime.dispose();
  });
});
