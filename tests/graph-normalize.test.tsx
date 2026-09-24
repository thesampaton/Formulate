import { describe, expect, it } from "vitest";
import type { AuthorNode, DefinitionLibrary } from "../packages/react/src/graph/model";
import { normalizeGraph } from "../packages/react/src/graph/normalize";

const resourceName = {
  role: "field",
  required: true,
  contract: { type: "string", pattern: "^[a-z][a-z0-9-]*$" },
  validate: { capability: "gcp.resource-name.validate" },
} as const;

it("normalizes hierarchical authoring into immutable JSON data without changing its input", () => {
  const authoring: AuthorNode = {
    id: "deployment", role: "form", children: [
      { id: "service", role: "page", children: [{ id: "name", use: "gcp.resource-name", bind: "service.name" }] },
    ],
  };
  const original = JSON.stringify(authoring);
  const graph = normalizeGraph(authoring, { "gcp.resource-name": resourceName });
  expect(graph).toEqual({
    version: 1,
    root: "deployment",
    nodes: {
      deployment: { id: "deployment", role: "form" },
      service: { id: "service", role: "page" },
      name: { ...resourceName, id: "name", use: "gcp.resource-name", bind: "service.name" },
    },
    relations: [["deployment", "contains", "service"], ["service", "contains", "name"]],
  });
  expect(JSON.parse(JSON.stringify(graph))).toEqual(graph);
  expect(JSON.stringify(authoring)).toBe(original);
  expect(Object.isFrozen(authoring)).toBe(false);
  expect(Object.isFrozen(graph)).toBe(true);
  expect(Object.isFrozen(graph.nodes.name!.contract)).toBe(true);
  expect(Object.isFrozen(graph.relations[0])).toBe(true);
});

it("keeps value binding and identity stable when presentation moves between pages", () => {
  const field = { id: "name", role: "field", bind: "service.name", defaultValue: "worker" } as const;
  const before = normalizeGraph({ id: "form", role: "form", children: [
    { id: "first", role: "page", children: [field] }, { id: "second", role: "page" },
  ] });
  const after = normalizeGraph({ id: "form", role: "form", children: [
    { id: "first", role: "page" }, { id: "second", role: "page", children: [field] },
  ] });
  expect(before.nodes.name).toEqual(after.nodes.name);
  expect(before.relations).toContainEqual(["first", "contains", "name"]);
  expect(after.relations).toContainEqual(["second", "contains", "name"]);
});

it("instantiates a reusable section twice with independent identities, values, conditions and composition", () => {
  const definitions: DefinitionLibrary = {
    service: { role: "section", children: [
      { id: "region", bind: "region", defaultValue: "AU" },
      { id: "enabled", bind: "enabled", defaultValue: true },
      { id: "name", bind: "name", required: { binding: "enabled", equals: true },
        applicable: { all: [{ binding: "enabled", present: true }, { not: { binding: "enabled", equals: false } }] },
        dependsOn: ["region"], choices: { dependencies: ["region"], capability: "name.choices" },
        composition: { segments: [{ binding: "region" }, { literal: "-" }, { input: true }] },
        actions: [{ id: "suggest", capability: "name.suggest", when: { any: [{ binding: "enabled", equals: true }] } }],
      },
    ] },
  };
  const graph = normalizeGraph({ id: "deployment", role: "form", children: [
    { id: "primary", use: "service", scope: "services.primary" },
    { id: "backup", use: "service", scope: "services.backup" },
  ] }, definitions);
  expect(graph.nodes["primary/name"]).toMatchObject({
    id: "primary/name", bind: "services.primary.name", dependsOn: ["primary/region"],
    required: { binding: "services.primary.enabled", equals: true },
    composition: { segments: [{ binding: "services.primary.region" }, { literal: "-" }, { input: true }] },
  });
  expect(graph.nodes["backup/name"]!.bind).toBe("services.backup.name");
  expect(graph.nodes.primary!.use).toBe("service");
  expect(graph.nodes.backup!.use).toBe("service");
  expect(graph.relations.filter(([, relation]) => relation === "dependsOn")).toEqual([
    ["primary/name", "dependsOn", "primary/region"],
    ["backup/name", "dependsOn", "backup/region"],
  ]);
});

it("supports nested reusable instances and template inheritance", () => {
  const graph = normalizeGraph({ id: "deployment", role: "form", children: [{ id: "service", use: "service", scope: "service" }] }, {
    base: { role: "field", required: true, contract: { type: "string" } },
    name: { use: "base", label: "Name" },
    credentials: { role: "section", children: [{ id: "name", use: "name", bind: "name" }] },
    service: { role: "section", children: [{ id: "credentials", use: "credentials", scope: "credentials" }] },
  });
  expect(graph.nodes["service/credentials/name"]).toEqual({
    id: "service/credentials/name", role: "field", use: "name", label: "Name", required: true,
    bind: "service.credentials.name", contract: { type: "string" },
  });
});

it("keeps already-expanded definition identity without requiring its template library", () => {
  const graph = normalizeGraph({ id: "deployment", role: "form", use: "deployment.v1", children: [
    { id: "name", role: "field", use: "resource-name", bind: "name", contract: { type: "string" } },
  ] });
  expect(graph.nodes.name!.use).toBe("resource-name");
  expect(() => normalizeGraph({ id: "name", use: "missing" })).toThrow('Unknown reusable definition: "missing"');
});

it("does not add blocking dependencies for conditional requirements", () => {
  const graph = normalizeGraph({ id: "form", role: "form", children: [
    { id: "enabled", bind: "enabled" },
    { id: "name", bind: "name", required: { binding: "enabled", equals: true } },
  ] });
  expect(graph.relations.every(([, relation]) => relation === "contains")).toBe(true);
});

it("allows references to a property inside an explicitly bound object", () => {
  const graph = normalizeGraph({ id: "form", role: "form", children: [
    { id: "location", bind: "location", contract: { type: "object" } },
    { id: "region", bind: "region", composition: { segments: [{ binding: "location.region" }] } },
  ] });
  expect(graph.relations).toContainEqual(["region", "dependsOn", "location"]);
});

describe("invalid portable definitions", () => {
  it("rejects duplicate identities and ambiguous bindings", () => {
    expect(() => normalizeGraph({ id: "form", children: [{ id: "name" }, { id: "name" }] })).toThrow("Duplicate node identity");
    expect(() => normalizeGraph({ id: "form", children: [{ id: "a", bind: "name" }, { id: "b", bind: "name" }] })).toThrow("Duplicate or overlapping");
    expect(() => normalizeGraph({ id: "form", children: [{ id: "a", bind: "service" }, { id: "b", bind: "service.name" }] })).toThrow("Duplicate or overlapping");
  });

  it("rejects unsafe paths without modifying object prototypes", () => {
    for (const bind of ["__proto__.name", "value.constructor", "a..b", "a[0]", ""]) {
      expect(() => normalizeGraph({ id: "field", bind })).toThrow("Unsafe or empty value binding");
    }
    expect(() => normalizeGraph(JSON.parse('{"id":"form","__proto__":{"polluted":true}}'))).toThrow("Unsafe JSON key");
    expect(Object.prototype).not.toHaveProperty("polluted");
  });

  it("rejects dangling semantic references and dependency cycles", () => {
    expect(() => normalizeGraph({ id: "name", bind: "name", dependsOn: ["missing"] })).toThrow("missing node");
    expect(() => normalizeGraph({ id: "name", bind: "name", required: { binding: "missing", present: true } })).toThrow("missing value binding");
    expect(() => normalizeGraph({ id: "name", bind: "name", choices: { dependencies: ["missing"] } })).toThrow("missing value binding");
    expect(() => normalizeGraph({ id: "form", children: [
      { id: "a", bind: "a", composition: { segments: [{ binding: "b" }] } },
      { id: "b", bind: "b", composition: { segments: [{ binding: "a" }] } },
    ] })).toThrow("Cyclic graph dependency");
    expect(() => normalizeGraph({ id: "form", children: [{ id: "a", dependsOn: ["form"] }] })).toThrow("Cyclic graph dependency");
  });

  it("rejects recursive reusable definitions and cyclic author data", () => {
    expect(() => normalizeGraph({ id: "form", use: "a" }, { a: { role: "section", children: [{ id: "again", use: "a" }] } })).toThrow("Cyclic reusable definition");
    const cyclic: { id: string; children?: AuthorNode[] } = { id: "form" };
    cyclic.children = [cyclic];
    expect(() => normalizeGraph(cyclic)).toThrow("Cyclic authoring data");
  });

  it("rejects callbacks, non-JSON values and ambiguous compositions", () => {
    expect(() => normalizeGraph({ id: "name", validate: (() => true) as never })).toThrow("named capability");
    expect(() => normalizeGraph({ id: "name", defaultValue: Number.NaN })).toThrow("not JSON data");
    expect(() => normalizeGraph({ id: "name", defaultValue: Array(1) })).toThrow("not JSON data");
    expect(() => normalizeGraph({ id: "name", defaultValue: new Date() as never })).toThrow("plain JSON object");
    expect(() => normalizeGraph({ id: "name", bind: "name", composition: { segments: [{ input: true }, { input: true }] } })).toThrow("explicit composition parser");
  });
});
