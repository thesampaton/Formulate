import { z } from "zod";
import { portableDefinition } from "../graph/definition.js";
import type { DefinitionLayout, FieldSource, PortableDefinitionSource } from "../graph/definition.js";
import { assertBindingPath } from "../graph/normalize.js";
import { conditionMatches, DEPENDENCY_BLOCKED_MESSAGE } from "../graph/conditions.js";
import type { Condition } from "../graph/model.js";
import { parseDefinitionSchema } from "./schema-parse.js";

type SectionSource = {
  [portableDefinition]: PortableDefinitionSource;
  schema: z.ZodType;
  defaultValues: Record<string, unknown>;
  fieldPaths: readonly string[];
};
type Members = Record<string, FieldSource | SectionSource>;
type ShapeTree = { [key: string]: z.ZodType | ShapeTree };

function write(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let object = target;
  for (const key of keys.slice(0, -1)) {
    if (!Object.hasOwn(object, key)) object[key] = {};
    object = object[key] as Record<string, unknown>;
  }
  object[keys.at(-1)!] = value;
}
function omit(target: Record<string, unknown>, path: string) {
  const keys = path.split(".");
  let object = target;
  for (const key of keys.slice(0, -1)) {
    if (!object[key] || typeof object[key] !== "object") return;
    object[key] = { ...object[key] as Record<string, unknown> };
    object = object[key] as Record<string, unknown>;
  }
  delete object[keys.at(-1)!];
}
function objectSchema(tree: ShapeTree): z.ZodObject<any> {
  return z.object(Object.fromEntries(Object.entries(tree).map(([key, value]) => [key, value instanceof z.ZodType ? value : objectSchema(value)])));
}

type DependencyNode = {
  id: string;
  path: string;
  paths?: string[];
  field?: boolean;
  bindingDependencies?: string[];
  parent?: string;
  dependencies: string[];
  conditions: { condition: Condition; scope: string }[];
};
function readScope(input: unknown, scope: string): unknown {
  return scope ? scope.split(".").reduce<unknown>((value, key) => value !== null && typeof value === "object" && Object.hasOwn(value, key) ? (value as Record<string, unknown>)[key] : undefined, input) : input;
}
/** Resolve identities separately from editing paths, including reused descendants. */
function dependencyNodes(members: PortableDefinitionSource["members"], layout?: readonly DefinitionLayout[]): DependencyNode[] {
  const nodes: DependencyNode[] = [];
  function visit(localMembers: PortableDefinitionSource["members"], ids = "", bindings = "", conditions: DependencyNode["conditions"] = [], parent?: string, children?: readonly DefinitionLayout[]) {
    const siblingIds = new Map(Object.entries(localMembers).map(([name, member]) => [name, ids + (portableDefinition in member ? member[portableDefinition].instanceId ?? name : member.id ?? name)]));
    const localNodes = new Map<string, DependencyNode>();
    for (const [name, member] of Object.entries(localMembers)) {
      const section = portableDefinition in member ? member[portableDefinition] : undefined;
      const metadata = section ?? member as FieldSource;
      const id = siblingIds.get(name)!;
      const path = bindings + (metadata.bind ?? name);
      const active = metadata.applicable ? [...conditions, { condition: metadata.applicable, scope: bindings.replace(/\.$/, "") }] : conditions;
      const field = section ? undefined : member as FieldSource;
      const bindingDependencies = field ? [
        ...(field.composition?.segments.flatMap((segment) => segment.binding === undefined ? [] : [bindings + segment.binding]) ?? []),
        ...(field.choices?.dependencies?.map((binding) => bindings + binding) ?? []),
      ] : [];
      const node = { id, path, field: !section, bindingDependencies, ...(parent ? { parent } : {}), dependencies: (metadata.dependsOn ?? []).map((dependency) => siblingIds.get(dependency) ?? ids + dependency), conditions: active };
      nodes.push(node);
      localNodes.set(name, node);
      if (section) visit(section.members, `${id}.`, `${path}.`, active, id, section.children);
    }
    function place(item: DefinitionLayout, owner?: string): string[] {
      if (typeof item === "string") {
        const node = localNodes.get(item);
        if (!node) throw new Error(`Unknown member "${item}" in definition layout.`);
        node.parent = owner;
        return [node.path];
      }
      const id = ids + item.id;
      const paths = item.children.flatMap((child) => place(child, id));
      nodes.push({ id, path: "", paths, ...(owner ? { parent: owner } : {}), dependencies: [], conditions });
      return paths;
    }
    children?.forEach((item) => place(item, parent));
  }
  visit(members, "", "", [], undefined, layout);
  const identities = new Set<string>();
  for (const node of nodes) {
    if (identities.has(node.id)) throw new Error(`Duplicate node identity: "${node.id}".`);
    identities.add(node.id);
  }
  for (const node of nodes) for (const binding of node.bindingDependencies ?? []) {
    const owner = nodes.find((candidate) => candidate.field && candidate.path === binding)
      ?? nodes.find((candidate) => candidate.field && binding.startsWith(`${candidate.path}.`));
    if (!owner) throw new Error(`Node "${node.id}" references missing value binding "${binding}".`);
    node.dependencies.push(owner.id);
  }
  for (const node of nodes) for (const dependency of node.dependencies) {
    if (!identities.has(dependency)) throw new Error(`Node "${node.id}" depends on missing node "${dependency}".`);
  }
  const edges = new Map(nodes.map((node) => [node.id, [...node.dependencies, ...nodes.filter((child) => child.parent === node.id).map((child) => child.id)]]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function check(id: string) {
    if (visiting.has(id)) throw new Error(`Cyclic graph dependency at node "${id}".`);
    if (visited.has(id)) return;
    visiting.add(id);
    edges.get(id)?.forEach(check);
    visiting.delete(id);
    visited.add(id);
  }
  nodes.forEach((node) => check(node.id));
  return nodes;
}
function addDependencyIssues(result: Awaited<ReturnType<typeof parseDefinitionSchema>>, values: unknown, nodes: DependencyNode[]): Awaited<ReturnType<typeof parseDefinitionSchema>> {
  if (result.success) return result;
  const active = nodes.filter((node) => node.conditions.every(({ condition, scope }) => conditionMatches(condition, readScope(values, scope))));
  const byId = new Map(active.map((node) => [node.id, node]));
  const issuePaths = result.error.issues.map((issue) => issue.path.join("."));
  const rejected = new Set(active.filter((node) => (node.paths ?? [node.path]).some((binding) => issuePaths.some((path) => path === binding || path.startsWith(`${binding}.`)))).map((node) => node.id));
  const blocked = new Set<DependencyNode>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of active) {
      if (node.parent && rejected.has(node.id) && !rejected.has(node.parent)) { rejected.add(node.parent); changed = true; }
      if (node.dependencies.some((dependency) => byId.has(dependency) && rejected.has(dependency))) {
        blocked.add(node);
        if (!rejected.has(node.id)) { rejected.add(node.id); changed = true; }
      }
    }
  }
  if (!blocked.size) return result;
  const added = [...blocked].map((node) => ({ code: "custom" as const, path: node.path.split("."), message: DEPENDENCY_BLOCKED_MESSAGE }));
  return { success: false, error: new z.ZodError([
    // Put readiness first for scoped React validation, while retaining the
    // original evidence. A dependent ancestor must not hide its child's error.
    ...added,
    ...result.error.issues.filter((issue) => !added.some((other) => issue.path.join(".") === other.path.join(".") && issue.message === other.message)),
  ]) };
}

/**
 * Construct editing paths, defaults and the authoritative schema together.
 * Applicability changes which declared members participate in that schema;
 * it never adds a second validation engine. Schema customization runs against
 * each cached active shape, preserving object refinements and output transforms.
 */
export function createDefinitionSchema(members: Members, customize?: (schema: z.ZodObject<any>) => z.ZodType, children?: readonly DefinitionLayout[], rootApplicable?: Condition): {
  schema: z.ZodType;
  defaultValues: Record<string, unknown>;
  fieldPaths: string[];
  resolvePath: (name: string) => string;
} {
  const dependencies = dependencyNodes(members, children);
  const declarations = Object.entries(members).map(([name, member]) => {
    const section = portableDefinition in member;
    const metadata = section ? member[portableDefinition] : member;
    const path = metadata.bind ?? name;
    assertBindingPath(path);
    return { name, member, path, applicable: metadata.applicable, section };
  });
  for (let index = 0; index < declarations.length; index++) {
    const path = declarations[index]!.path;
    for (const previous of declarations.slice(0, index)) {
      if (path === previous.path || path.startsWith(`${previous.path}.`) || previous.path.startsWith(`${path}.`)) {
        throw new Error(`Duplicate or overlapping value bindings: "${previous.path}" and "${path}".`);
      }
    }
  }
  const defaultValues: Record<string, unknown> = {};
  const fieldPaths: string[] = [];
  const bindings = new Map(declarations.map(({ name, path }) => [name, path]));
  for (const { member, path, section } of declarations) {
    write(defaultValues, path, section ? (member as SectionSource).defaultValues : (member as FieldSource).defaultValue);
    fieldPaths.push(...(section ? (member as SectionSource).fieldPaths.map((child) => `${path}.${child}`) : [path]));
  }
  function resolvePath(name: string): string {
    const [key, ...tail] = name.split(".");
    const binding = bindings.get(key!);
    return binding ? [binding, ...tail].join(".") : name;
  }
  const variants = new Map<string, z.ZodType>();
  function variant(active: readonly boolean[]) {
    const key = active.map((value) => value ? "1" : "0").join("");
    const existing = variants.get(key);
    if (existing) return existing;
    const tree: ShapeTree = {};
    declarations.forEach(({ member, path }, index) => write(tree, path, active[index] ? member.schema : z.never().optional()));
    const base = objectSchema(tree);
    const selected = customize?.(base) ?? base;
    variants.set(key, selected);
    return selected;
  }
  const base = variant(declarations.map(() => true));
  if (!rootApplicable && declarations.every(({ applicable }) => !applicable) && dependencies.every((node) => !node.dependencies.length)) return { schema: base, defaultValues, fieldPaths, resolvePath };
  const schema = z.unknown().transform((input, context) => {
    if (rootApplicable && !conditionMatches(rootApplicable, input)) return {};
    const active = declarations.map(({ applicable }) => !applicable || conditionMatches(applicable, input));
    const selected = variant(active);
    let values = input;
    if (input && typeof input === "object" && !Array.isArray(input)) {
      values = { ...input };
      declarations.forEach(({ path }, index) => { if (!active[index]) omit(values as Record<string, unknown>, path); });
    }
    const finish = (parsed: ReturnType<z.ZodType["safeParse"]>) => {
      const result = addDependencyIssues(parsed, values, dependencies);
      if (result.success) return result.data;
      result.error.issues.forEach((issue) => context.addIssue({ ...issue }));
      return z.NEVER;
    };
    const result = parseDefinitionSchema(selected, values);
    return result instanceof Promise ? result.then(finish) : finish(result);
  });
  return { schema, defaultValues, fieldPaths, resolvePath };
}
