import type {
  AuthorNode,
  Condition,
  DefinitionLibrary,
  GraphRelation,
  NodeDefinition,
  NormalizedGraph,
  PortableNode,
} from "./model.js";

const unsafeKeys = new Set(["__proto__", "prototype", "constructor"]);

/** Dot paths are portable payload addresses, never JavaScript property expressions. */
export function assertBindingPath(path: string): void {
  if (typeof path !== "string" || path.length === 0 || path.split(".").some((key) => !key || unsafeKeys.has(key) || /[\[\]\u0000-\u001f]/.test(key))) {
    throw new Error(`Unsafe or empty value binding: "${path}".`);
  }
}

function assertIdentity(id: string): void {
  if (typeof id !== "string" || !id || unsafeKeys.has(id) || /[\u0000-\u001f]/.test(id)) {
    throw new Error(`Invalid node identity: "${id}".`);
  }
}

/** Reject executable and lossy values instead of silently dropping them via JSON.stringify. */
function cloneData<T>(value: T, path = "definition", ancestors = new Set<object>()): T {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object") throw new Error(`"${path}" is not JSON data; use a named capability for executable behavior.`);
  if (ancestors.has(value)) throw new Error(`Cyclic authoring data at "${path}".`);
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    throw new Error(`"${path}" is not a plain JSON object; use a named capability.`);
  }
  ancestors.add(value);
  let result: unknown;
  if (Array.isArray(value)) {
    result = Array.from(value, (entry, index) => cloneData(entry, `${path}[${index}]`, ancestors));
  } else {
    const copy: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (unsafeKeys.has(key)) throw new Error(`Unsafe JSON key at "${path}.${key}".`);
      // Optional TypeScript properties may be explicitly undefined.
      if (entry !== undefined) copy[key] = cloneData(entry, `${path}.${key}`, ancestors);
    }
    result = copy;
  }
  ancestors.delete(value);
  return result as T;
}

function freezeData<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freezeData(child);
    Object.freeze(value);
  }
  return value;
}

function scopeBinding(path: string, scope?: string): string {
  assertBindingPath(path);
  return scope ? `${scope}.${path}` : path;
}

function mapCondition(condition: Condition, resolve: (path: string) => string): Condition {
  if (!condition || typeof condition !== "object" || Array.isArray(condition)) throw new Error("Invalid portable condition.");
  if ("binding" in condition) {
    if (typeof condition.binding !== "string" || (!("equals" in condition) && !("present" in condition && condition.present === true))) {
      throw new Error("A binding condition needs equals or present: true.");
    }
    return { ...condition, binding: resolve(condition.binding) };
  }
  if ("all" in condition && Array.isArray(condition.all)) return { all: condition.all.map((item) => mapCondition(item, resolve)) };
  if ("any" in condition && Array.isArray(condition.any)) return { any: condition.any.map((item) => mapCondition(item, resolve)) };
  if ("not" in condition) return { not: mapCondition(condition.not, resolve) };
  throw new Error("Invalid portable condition.");
}

function conditionBindings(condition: Condition): string[] {
  if ("binding" in condition) return [condition.binding];
  if ("not" in condition) return conditionBindings(condition.not);
  return ("all" in condition ? condition.all : condition.any).flatMap(conditionBindings);
}

function assertCapability(reference: { readonly capability: string }, name: string): void {
  if (!reference || typeof reference !== "object" || typeof reference.capability !== "string" || !reference.capability) {
    throw new Error(`"${name}" needs a named capability reference.`);
  }
}

function assertNode(node: PortableNode): void {
  if (!["form", "page", "section", "field"].includes(node.role)) throw new Error(`Node "${node.id}" has an invalid role.`);
  if (node.bind !== undefined) assertBindingPath(node.bind);
  if (node.validate !== undefined) assertCapability(node.validate, `${node.id}.validate`);
  if (node.parse !== undefined) assertCapability(node.parse, `${node.id}.parse`);
  if (node.required !== undefined && typeof node.required !== "boolean") mapCondition(node.required, (path) => path);
  if (node.applicable !== undefined) mapCondition(node.applicable, (path) => path);
  if (node.contract) {
    if (node.contract.enum !== undefined && !Array.isArray(node.contract.enum)) throw new Error(`Node "${node.id}" has an invalid contract enum.`);
    if (node.contract.type !== undefined && !["string", "number", "boolean", "object", "array"].includes(node.contract.type)) {
      throw new Error(`Node "${node.id}" has an invalid value contract type.`);
    }
    if (node.contract.minLength !== undefined && (!Number.isInteger(node.contract.minLength) || node.contract.minLength < 0)) {
      throw new Error(`Node "${node.id}" has an invalid minimum length.`);
    }
    if (node.contract.pattern !== undefined) {
      try { new RegExp(node.contract.pattern); } catch { throw new Error(`Node "${node.id}" has an invalid contract pattern.`); }
    }
  }
  if (node.choices?.capability !== undefined) assertCapability({ capability: node.choices.capability }, `${node.id}.choices`);
  if (node.choices?.options !== undefined) {
    if (!Array.isArray(node.choices.options)) throw new Error(`Node "${node.id}" has invalid choice options.`);
    const optionValues = new Set<string>();
    for (const option of node.choices.options) {
      if (!option || typeof option.value !== "string" || typeof option.label !== "string") throw new Error(`Node "${node.id}" has an invalid choice option.`);
      if (optionValues.has(option.value)) throw new Error(`Node "${node.id}" has duplicate choice value "${option.value}".`);
      optionValues.add(option.value);
    }
  }
  if (node.composition) {
    if (!node.bind) throw new Error(`Composed node "${node.id}" needs a value binding.`);
    if (!Array.isArray(node.composition.segments)) throw new Error(`Node "${node.id}" needs composition segments.`);
    if (node.composition.parse !== undefined) assertCapability(node.composition.parse, `${node.id}.composition.parse`);
    for (const segment of node.composition.segments) {
      const kinds = ["literal", "binding", "context", "input"].filter((key) => key in segment);
      if (kinds.length !== 1 || ("input" in segment ? segment.input !== true : typeof segment[kinds[0] as "literal"] !== "string")) {
        throw new Error(`Node "${node.id}" has an invalid composition segment.`);
      }
      if (segment.transform !== undefined) {
        if (segment.binding === undefined && segment.context === undefined) throw new Error(`Node "${node.id}" can only transform a binding or context segment.`);
        assertCapability(segment.transform, `${node.id}.composition.transform`);
      }
      if (segment.context !== undefined) assertBindingPath(segment.context);
    }
    if (node.composition.segments.filter((segment) => segment.input).length > 1 && !node.composition.parse) {
      throw new Error(`Field "${node.id}": multiple input segments require an explicit composition parser.`);
    }
  }
  const actions = new Set<string>();
  for (const action of node.actions ?? []) {
    assertIdentity(action.id);
    assertCapability(action, `${node.id}.actions.${action.id}`);
    if (actions.has(action.id)) throw new Error(`Duplicate action "${action.id}" on node "${node.id}".`);
    actions.add(action.id);
    if (action.when !== undefined) mapCondition(action.when, (path) => path);
  }
}

/**
 * Expand pleasant hierarchical authoring into one immutable portable graph.
 * Containment never changes bindings. Explicit scopes prefix local bindings.
 * Reusable subtrees namespace descendant IDs by their instance ID. A `use` with
 * an explicit role may identify an already-expanded definition from a TS host.
 */
export function normalizeGraph(authoring: AuthorNode, definitions: DefinitionLibrary = {}): NormalizedGraph {
  const input = cloneData(authoring);
  const library = cloneData(definitions, "definitions");
  const nodes: Record<string, PortableNode> = {};
  const relations: GraphRelation[] = [];
  const dependencyNamespaces = new Map<string, string | undefined>();
  const bindings = new Map<string, string>();

  function expand(node: NodeDefinition, stack: readonly string[]): { node: NodeDefinition; stack: readonly string[]; expanded: boolean } {
    if (node.use === undefined) return { node, stack, expanded: false };
    if (typeof node.use !== "string" || !node.use) throw new Error("A reusable definition reference must be a non-empty string.");
    const template = Object.hasOwn(library, node.use) ? library[node.use] : undefined;
    if (!template) {
      if (node.role === undefined) throw new Error(`Unknown reusable definition: "${node.use}".`);
      return { node, stack, expanded: false };
    }
    if (stack.includes(node.use)) throw new Error(`Cyclic reusable definition: "${[...stack, node.use].join(" -> ")}".`);
    const inherited = expand(template, [...stack, node.use]);
    return { node: { ...inherited.node, ...node }, stack: inherited.stack, expanded: true };
  }

  function visit(authored: AuthorNode, parent?: string, namespace?: string, inheritedScope?: string, stack: readonly string[] = []): string {
    assertIdentity(authored.id);
    const expanded = expand(authored, stack);
    const source = expanded.node as AuthorNode;
    const id = namespace ? `${namespace}/${authored.id}` : authored.id;
    if (Object.hasOwn(nodes, id)) throw new Error(`Duplicate node identity: "${id}".`);
    const scope = source.scope === undefined ? inheritedScope : scopeBinding(source.scope, inheritedScope);
    const resolve = (path: string) => scopeBinding(path, scope);
    const { children, scope: _scope, ...semantic } = source;
    if (children !== undefined && !Array.isArray(children)) throw new Error(`Node "${id}" has invalid children.`);
    const node: PortableNode = {
      ...semantic,
      id,
      role: source.role ?? "field",
      ...(source.bind !== undefined ? { bind: resolve(source.bind) } : {}),
      ...(typeof source.required === "object" ? { required: mapCondition(source.required, resolve) } : {}),
      ...(source.applicable !== undefined ? { applicable: mapCondition(source.applicable, resolve) } : {}),
      ...(source.choices ? { choices: { ...source.choices, ...(source.choices.dependencies ? { dependencies: source.choices.dependencies.map(resolve) } : {}) } } : {}),
      ...(source.composition ? { composition: { ...source.composition, segments: source.composition.segments.map((segment) => segment.binding !== undefined ? { ...segment, binding: resolve(segment.binding) } : segment) } } : {}),
      ...(source.actions ? { actions: source.actions.map((action) => action.when ? { ...action, when: mapCondition(action.when, resolve) } : action) } : {}),
    };
    assertNode(node);
    nodes[id] = node;
    if (node.bind !== undefined) {
      for (const [binding] of bindings) {
        if (binding === node.bind || binding.startsWith(`${node.bind}.`) || node.bind.startsWith(`${binding}.`)) {
          throw new Error(`Duplicate or overlapping value bindings: "${binding}" and "${node.bind}".`);
        }
      }
      bindings.set(node.bind, id);
    }
    if (parent) relations.push([parent, "contains", id]);
    const childNamespace = expanded.expanded && children?.length ? id : namespace;
    dependencyNamespaces.set(id, childNamespace);
    for (const child of children ?? []) visit(child, id, childNamespace, scope, expanded.stack);
    return id;
  }

  const root = visit(input);
  const relationKeys = new Set<string>();
  function dependency(source: string, target: string): void {
    if (!Object.hasOwn(nodes, target)) throw new Error(`Node "${source}" depends on missing node "${target}".`);
    const key = JSON.stringify([source, target]);
    if (!relationKeys.has(key)) {
      relationKeys.add(key);
      relations.push([source, "dependsOn", target]);
    }
  }
  function bindingOwner(path: string, source: string): string {
    assertBindingPath(path);
    const owner = bindings.get(path) ?? [...bindings].find(([binding]) => path.startsWith(`${binding}.`))?.[1];
    if (!owner) throw new Error(`Node "${source}" references missing value binding "${path}".`);
    return owner;
  }
  for (const node of Object.values(nodes)) {
    const namespace = dependencyNamespaces.get(node.id);
    const resolvedDependencies = (node.dependsOn ?? []).map((target) => {
      assertIdentity(target);
      const scopedTarget = namespace ? `${namespace}/${target}` : target;
      return Object.hasOwn(nodes, scopedTarget) ? scopedTarget : target;
    });
    if (node.dependsOn !== undefined) nodes[node.id] = { ...node, dependsOn: resolvedDependencies };
    resolvedDependencies.forEach((target) => dependency(node.id, target));
    for (const binding of node.choices?.dependencies ?? []) dependency(node.id, bindingOwner(binding, node.id));
    for (const segment of node.composition?.segments ?? []) {
      if (segment.binding !== undefined) dependency(node.id, bindingOwner(segment.binding, node.id));
    }
    const conditions = [typeof node.required === "object" ? node.required : undefined, node.applicable, ...(node.actions ?? []).map((action) => action.when)];
    for (const condition of conditions) {
      if (condition) conditionBindings(condition).forEach((path) => bindingOwner(path, node.id));
    }
  }

  const edges = new Map<string, string[]>();
  for (const [from, _kind, to] of relations) edges.set(from, [...(edges.get(from) ?? []), to]);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function checkCycles(id: string): void {
    if (visiting.has(id)) throw new Error(`Cyclic graph dependency at node "${id}".`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const target of edges.get(id) ?? []) checkCycles(target);
    visiting.delete(id);
    visited.add(id);
  }
  Object.keys(nodes).forEach(checkCycles);
  return freezeData({ version: 1, root, nodes, relations });
}
