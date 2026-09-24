import { createChoiceStore } from "../choices/store.js";
import type { BoundChoice, ChoiceRule, ChoiceView, ResolvedChoice } from "../choices/definition.js";
import { createStringComposer } from "../fields/string-composition.js";
import type { BoundStringComposition, StringComposition } from "../fields/string-composition.js";
import type { JsonValue, NormalizedGraph, PortableNode } from "./model.js";
import { assertBindingPath } from "./normalize.js";
import { conditionMatches, DEPENDENCY_BLOCKED_MESSAGE, isEmptyValue as empty } from "./conditions.js";

export type InteractionState = { readonly values: Readonly<Record<string, JsonValue>> };
/** validate(value, nestedValues, context) returns a message, issues, or undefined.
 * parse(value, nestedValues, context) returns a JSON value (undefined omits a
 * bound optional value). choices(nestedValues,
 * selection, context) returns the existing ResolvedChoice contract. Composition
 * transforms/parsers retain their existing createStringComposer signatures.
 * Validation and value parsing may return promises. Choice resolution and
 * composition transforms/parsers stay synchronous; choice loaders are async. */
export type GraphCapabilities = Readonly<Record<string, (...args: any[]) => any>>;
export type GraphStatus = "missing" | "invalid" | "blocked" | "pending" | "unresolved" | "complete";
export type GraphActionInspection = {
  readonly id: string;
  readonly capability: string;
  readonly status: "available" | "unavailable" | "unresolved";
  readonly issues: readonly string[];
};
export type GraphValidationIssue = {
  /** Absolute editing path, independent of the node's presentation location. */
  readonly path: readonly (string | number)[];
  readonly message: string;
};
export type GraphNodeInspection = {
  readonly status: GraphStatus;
  readonly applicable: boolean;
  readonly issues: readonly string[];
  readonly validationIssues?: readonly GraphValidationIssue[];
  readonly value?: JsonValue;
  readonly choices?: ChoiceView;
  readonly actions?: readonly GraphActionInspection[];
};
export type GraphSnapshot = {
  readonly state: InteractionState;
  readonly nodes: Readonly<Record<string, GraphNodeInspection>>;
  readonly status: GraphStatus;
  readonly payload?: JsonValue;
};
export type GraphRuntimeOptions = {
  capabilities?: GraphCapabilities;
  state?: InteractionState;
  context?: unknown;
  /** React can wait until mount before starting external requests. */
  deferChoices?: boolean;
};

function pathKeys(path: string) {
  assertBindingPath(path);
  const keys = path.split(".");
  if (keys.some((key) => !key || ["__proto__", "constructor", "prototype"].includes(key))) throw new Error(`Unsafe value binding: "${path}".`);
  return keys;
}

function readPath(value: unknown, path: string): unknown {
  return pathKeys(path).reduce<unknown>((current, key) => current !== null && typeof current === "object" && Object.hasOwn(current, key) ? (current as Record<string, unknown>)[key] : undefined, value);
}

function writePath(target: Record<string, any>, path: string, value: unknown) {
  const keys = pathKeys(path);
  let current = target;
  for (const key of keys.slice(0, -1)) {
    const existing = current[key];
    current[key] = existing !== null && typeof existing === "object" && !Array.isArray(existing) ? { ...existing } : {};
    current = current[key];
  }
  current[keys.at(-1)!] = value;
}

function omitPath(target: Record<string, any>, path: string) {
  const keys = pathKeys(path);
  let current = target;
  for (const key of keys.slice(0, -1)) {
    if (current[key] === null || typeof current[key] !== "object") return;
    current = current[key];
  }
  delete current[keys.at(-1)!];
}

function jsonCopy(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return Array.from(value, jsonCopy);
  if (value !== null && typeof value === "object" && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonCopy(item)]));
  }
  throw new Error("Interaction values and capability outputs must be JSON-serialisable.");
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

/** Expand binding paths without coupling them to the containment tree. */
export function expandGraphValues(values: Readonly<Record<string, JsonValue>>): Record<string, any> {
  const nested: Record<string, any> = {};
  for (const [binding, value] of Object.entries(values).sort(([a], [b]) => a.split(".").length - b.split(".").length)) writePath(nested, binding, jsonCopy(value));
  return nested;
}

/** Only declared bindings cross into interaction state; structured values remain atomic. */
export function flattenGraphValues(graph: NormalizedGraph, nestedValues: unknown): Record<string, JsonValue> {
  return Object.fromEntries(Object.values(graph.nodes).flatMap((node) => {
    const value = node.bind === undefined ? undefined : readPath(nestedValues, node.bind);
    return node.bind !== undefined && value !== undefined ? [[node.bind, jsonCopy(value)]] : [];
  }));
}

function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  // Choice retry callbacks are behavior, not validation evidence.
  if (typeof a === "function" && typeof b === "function") return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) return false;
  const entries = Object.entries(a);
  return entries.length === Object.keys(b).length && entries.every(([key, value]) => Object.hasOwn(b, key) && equal(value, (b as Record<string, unknown>)[key]));
}

function isPromise(value: unknown): value is PromiseLike<unknown> {
  return value !== null && typeof value === "object" && "then" in value && typeof value.then === "function";
}

function synchronous(value: unknown): unknown {
  if (isPromise(value)) {
    // A rejected unsupported async capability must not create an unhandled rejection.
    void Promise.resolve(value).catch(() => {});
    throw new Error("Async choice resolution and composition require a host capability with a synchronous contract.");
  }
  return value;
}

function message(error: unknown) { return error instanceof Error ? error.message : String(error); }
const statusOrder: readonly GraphStatus[] = ["unresolved", "invalid", "pending", "missing", "blocked", "complete"];
function aggregate(statuses: readonly GraphStatus[]): GraphStatus { return statusOrder.find((status) => statuses.includes(status)) ?? "complete"; }

/** One evaluator for renderers, payload construction, and machine updates. */
export function createGraphRuntime(graph: NormalizedGraph, options: GraphRuntimeOptions = {}) {
  graph = freeze(jsonCopy(graph) as unknown as NormalizedGraph);
  const capabilities = options.capabilities ?? {};
  const nodes = Object.values(graph.nodes);
  const bindings = new Map(nodes.filter((node) => node.bind !== undefined).map((node) => [node.bind!, node]));
  const children = new Map<string, string[]>();
  const dependencies = new Map<string, string[]>();
  const parents = new Map<string, string>();
  for (const [source, relation, target] of graph.relations) {
    const map = relation === "contains" ? children : dependencies;
    map.set(source, [...map.get(source) ?? [], target]);
    if (relation === "contains") parents.set(target, source);
  }
  const listeners = new Set<() => void>();
  const choiceStore = createChoiceStore();
  let synchronizedChoices = new Map<string, BoundChoice>();
  const compositionIssues = new Map<string, string>();
  const compositions: BoundStringComposition[] = [];
  type CapabilityResult = { status: "pending" } | { status: "fulfilled"; value: unknown } | { status: "rejected"; error: unknown };
  const capabilityResults = new Map<string, CapabilityResult>();
  const validationWaiters = new Set<(snapshot: GraphSnapshot) => void>();
  let previousInputs: { values: Record<string, JsonValue>; context: unknown; nested: Record<string, any> } | undefined;
  let context = options.context;
  let choicesEnabled = !options.deferChoices;
  let disposed = false;
  let evaluating = false;
  let inputRevision = 0;
  let snapshot: GraphSnapshot;
  let values: Record<string, JsonValue> = {};

  function capability(name: string) {
    const fn = Object.hasOwn(capabilities, name) ? capabilities[name] : undefined;
    if (typeof fn !== "function") throw new Error(`Missing host capability: "${name}".`);
    return fn;
  }

  function invoke(key: string, name: string, ...args: unknown[]): CapabilityResult {
    const cached = capabilityResults.get(key);
    if (cached) return cached;
    try {
      const value = capability(name)(...args);
      if (!isPromise(value)) {
        const result: CapabilityResult = { status: "fulfilled", value };
        capabilityResults.set(key, result);
        return result;
      }
      const pending: CapabilityResult = { status: "pending" };
      capabilityResults.set(key, pending);
      void Promise.resolve(value).then(
        (value) => {
          if (disposed || capabilityResults.get(key) !== pending) return;
          capabilityResults.set(key, { status: "fulfilled", value });
          evaluate();
        },
        (error) => {
          if (disposed || capabilityResults.get(key) !== pending) return;
          capabilityResults.set(key, { status: "rejected", error });
          evaluate();
        },
      );
      return pending;
    } catch (error) {
      const result: CapabilityResult = { status: "rejected", error };
      capabilityResults.set(key, result);
      return result;
    }
  }

  function settleValidationWaiters() {
    if (!disposed && [...capabilityResults.values()].some((result) => result.status === "pending")) return;
    for (const resolve of validationWaiters) resolve(snapshot);
    validationWaiters.clear();
  }

  for (const node of nodes) {
    if (!node.composition || !node.bind) continue;
    try {
      const segments = node.composition.segments.map((segment) => {
        if (!segment.transform) return segment;
        const transform = capability(segment.transform.capability);
        return { ...segment, transform: (value: unknown) => synchronous(transform(value)) as string };
      });
      const parse = node.composition.parse ? capability(node.composition.parse.capability) : undefined;
      compositions.push({ name: node.bind, composition: { segments, ...(parse ? { parse: (...args: Parameters<NonNullable<StringComposition["parse"]>>) => synchronous(parse(...args)) as readonly string[] } : {}) } as StringComposition });
    } catch (error) { compositionIssues.set(node.id, message(error)); }
  }
  const composer = createStringComposer(compositions);

  function checkedValues(input: InteractionState["values"], replace = false) {
    const next: Record<string, JsonValue> = {};
    for (const [binding, value] of Object.entries(input)) {
      const node = bindings.get(binding);
      if (!node) throw new Error(`Unknown value binding: "${binding}".`);
      if (!replace && node.composition && !node.composition.segments.some((segment) => segment.input)) throw new Error(`Derived value "${binding}" cannot be edited.`);
      next[binding] = jsonCopy(value);
    }
    return next;
  }

  function defaults() {
    return Object.fromEntries(nodes.flatMap((node) => node.bind && node.defaultValue !== undefined ? [[node.bind, jsonCopy(node.defaultValue)]] : node.bind && node.composition ? [[node.bind, ""]] : []));
  }

  function assertActive() { if (disposed) throw new Error("This graph runtime has been disposed."); }

  function evaluate(syncChoices = true, fresh = false, notify = true) {
    if (evaluating || disposed) return;
    evaluating = true;
    let changed = false;
    try {
      const errors = new Map(compositionIssues);
      let nested = expandGraphValues(values);
      try {
        const composed = composer.compose(nested, context, fresh);
        nested = composed.values;
        for (const { name, value } of composed.changes) values[name] = value;
      } catch (error) {
        for (const node of nodes) if (node.composition) errors.set(node.id, message(error));
      }
      if (previousInputs && equal(previousInputs.values, values) && Object.is(previousInputs.context, context)) {
        nested = previousInputs.nested;
      } else {
        capabilityResults.clear();
        previousInputs = { values: jsonCopy(values) as Record<string, JsonValue>, context, nested };
        inputRevision++;
      }
      const applicability = new Map<string, boolean>();
      function applicable(id: string): boolean {
        if (applicability.has(id)) return applicability.get(id)!;
        const node = graph.nodes[id]!;
        const parent = parents.get(id);
        const active = (!parent || applicable(parent)) && (!node.applicable || conditionMatches(node.applicable, nested));
        applicability.set(id, active);
        return active;
      }
      let payload: Record<string, any> = {};
      for (const node of nodes) if (applicable(node.id) && node.bind && !children.get(node.id)?.length && Object.hasOwn(values, node.bind)) writePath(payload, node.bind, jsonCopy(values[node.bind]));
      const choiceBindings = new Map<string, BoundChoice>();
      const choiceErrors = new Map<string, string>();

      function inspectNodes(withChoices: boolean) {
        const results: Record<string, GraphNodeInspection> = {};
        const visiting = new Set<string>();
        function inspectNode(id: string): GraphNodeInspection {
          if (Object.hasOwn(results, id)) return results[id]!;
          const node = graph.nodes[id]!;
          const value = node.bind ? readPath(nested, node.bind) as JsonValue | undefined : undefined;
          const active = applicable(id);
          const validationIssues: GraphValidationIssue[] = [];
          const actions: GraphActionInspection[] | undefined = node.actions?.map((action) => {
            if (!active || (action.when && !conditionMatches(action.when, nested))) return { id: action.id, capability: action.capability, status: "unavailable", issues: [] };
            try { capability(action.capability); return { id: action.id, capability: action.capability, status: "available", issues: [] }; }
            catch (error) { return { id: action.id, capability: action.capability, status: "unresolved", issues: [message(error)] }; }
          });
          const result = (status: GraphStatus, issues: string[] = [], choices?: ChoiceView): GraphNodeInspection => results[id] = { status, applicable: active, issues, ...(validationIssues.length ? { validationIssues: validationIssues.filter((issue) => issues.includes(issue.message)) } : {}), ...(value !== undefined ? { value } : {}), ...(choices ? { choices } : {}), ...(actions ? { actions } : {}) };
          if (!active) return result("complete");
          if (visiting.has(id)) return result("unresolved", ["Cyclic evaluation dependency."]);
          visiting.add(id);
          const dependencyStates = (dependencies.get(id) ?? []).map(inspectNode);
          const childStates = (children.get(id) ?? []).map(inspectNode);
          visiting.delete(id);
          if (dependencyStates.some((state) => state.status !== "complete")) return result("blocked", [DEPENDENCY_BLOCKED_MESSAGE]);
          if (errors.has(id)) return result("unresolved", [errors.get(id)!]);
          if (withChoices && choiceErrors.has(id)) return result("unresolved", [choiceErrors.get(id)!]);
          const required = typeof node.required === "boolean" ? node.required : node.required ? conditionMatches(node.required, nested) : false;
          const ownValue = node.bind ? readPath(payload, node.bind) : payload;
          const issues: string[] = [];
          let validationRejected = false;
          let status: GraphStatus = required && empty(ownValue) ? "missing" : "complete";
          if (status === "missing") issues.push(node.requiredMessage ?? `${node.label ?? node.bind ?? node.id} is required.`);
          const contract = node.contract;
          // Exported schema descriptions inform inspection. Rechecking them
          // would narrow transforms, coercion, and other host schema behavior.
          if (contract && !node.validate && ownValue !== undefined && status !== "missing") {
            const type = Array.isArray(ownValue) ? "array" : ownValue === null ? "null" : typeof ownValue;
            if (contract.type && contract.type !== type) issues.push(`Expected ${contract.type}.`);
            if (contract.enum && !contract.enum.some((option) => equal(option, ownValue))) issues.push("Choose an allowed value.");
            if (typeof ownValue === "string") {
              if (contract.minLength !== undefined && ownValue.length < contract.minLength) issues.push(`Use at least ${contract.minLength} characters.`);
              if (contract.pattern && !new RegExp(contract.pattern).test(ownValue)) issues.push("Value does not match the required pattern.");
            }
          }
          if (node.validate && status !== "missing" && childStates.every((child) => child.status === "complete")) {
            try {
              const previousIssueCount = issues.length;
              const validationResult = invoke(`validate:${id}`, node.validate.capability, ownValue, nested, context);
              if (validationResult.status === "rejected") throw validationResult.error;
              if (validationResult.status === "pending") status = "pending";
              const validation = validationResult.status === "fulfilled" ? validationResult.value : undefined;
              if (typeof validation === "string") issues.push(validation);
              else if (Array.isArray(validation)) {
                for (const issue of validation) {
                  if (typeof issue === "string") { issues.push(issue); continue; }
                  if (!issue || typeof issue.message !== "string" || (issue.path !== undefined && (!Array.isArray(issue.path) || issue.path.some((part: unknown) => typeof part !== "string" && typeof part !== "number")))) throw new Error("Structured validation issues need a message and an optional string/number path.");
                  issues.push(issue.message);
                  validationIssues.push({ path: [...node.bind?.split(".") ?? [], ...issue.path ?? []], message: issue.message });
                }
              }
              else if (validation !== undefined) throw new Error("A validation capability must return a message, issues, or undefined.");
              validationRejected = issues.length > previousIssueCount;
            } catch (error) { return result("unresolved", [message(error)]); }
          }
          if (node.parse) {
            try { capability(node.parse.capability); } catch (error) { return result("unresolved", [message(error)]); }
          }
          let choices: ChoiceView | undefined;
          if (withChoices && node.choices) {
            if (node.choices.options && !node.choices.capability) {
              const valid = empty(value) || node.choices.options.some((option) => option.value === value);
              const validationMessage = valid ? undefined : "Choose an available value.";
              choices = { status: "ready", options: node.choices.options, revision: 0, validationMessage, retry() {} };
              if (validationMessage) issues.push(validationMessage);
            } else {
              const binding = choiceBindings.get(id);
              if (binding) {
                try {
                  const previous = synchronizedChoices.get(id);
                  const current = previous?.requestKey === binding.requestKey && previous?.loader === binding.loader && previous?.rule === binding.rule;
                  const view = current ? choiceStore.get(binding.choiceId, binding.rule as ChoiceRule<any, any, any>) : undefined;
                  choices = view ? { ...view, options: view.options.map((option) => jsonCopy(option) as typeof option) } : undefined;
                  if (binding.requestKey === null) return result("blocked", [binding.messages.missing], choices);
                  if (!choices || choices.status === "pending" || choices.status === "idle") return result("pending", [binding.messages.pending], choices);
                  const validationMessage = choices.status === "failed" ? binding.messages.failed : synchronous(binding.validateSelection(choices.options));
                  if (validationMessage !== undefined && typeof validationMessage !== "string") throw new Error("Choice selection validation must return a message or undefined.");
                  choices = { ...choices, validationMessage };
                  if (validationMessage && status !== "missing") issues.push(validationMessage);
                } catch (error) { return result("unresolved", [message(error)]); }
              }
            }
          }
          if (issues.length && status !== "missing") status = validationRejected && node.bind && empty(ownValue) ? "missing" : "invalid";
          return result(aggregate([status, ...childStates.map((child) => child.status)]), issues, choices);
        }
        nodes.forEach((node) => inspectNode(node.id));
        return results;
      }

      for (const node of nodes) {
        if (!node.choices?.capability || !applicable(node.id)) continue;
        try {
          const resolved = synchronous(capability(node.choices.capability)(nested, node.bind ? readPath(nested, node.bind) : undefined, context)) as ResolvedChoice;
          if (!resolved || typeof resolved.loader !== "function" || typeof resolved.validateSelection !== "function" || !resolved.messages || (resolved.requestKey !== null && typeof resolved.requestKey !== "string")) throw new Error("A choices capability must return a ResolvedChoice.");
          choiceBindings.set(node.id, { ...resolved, choiceId: node.id, fieldPath: node.bind ?? node.id });
        } catch (error) { choiceErrors.set(node.id, message(error)); }
      }
      if (syncChoices && choicesEnabled) {
        const beforeRequests = inspectNodes(true);
        const enabled = [...choiceBindings.entries()].filter(([id]) => (dependencies.get(id) ?? []).every((dependency) => beforeRequests[dependency]?.status === "complete"));
        synchronizedChoices = new Map(enabled);
        choiceStore.syncBindings(enabled.map(([, binding]) => binding));
      }
      let inspections = inspectNodes(true);
      let status = inspections[graph.root]!.status;
      let output: JsonValue | undefined;
      if (status === "complete") {
        const ordered: PortableNode[] = [];
        function order(id: string) { (children.get(id) ?? []).forEach(order); ordered.push(graph.nodes[id]!); }
        order(graph.root);
        for (const node of ordered) {
          if (!applicable(node.id) || !node.parse) continue;
          try {
            if (!node.bind && node.id !== graph.root) throw new Error("A non-root parsing capability needs an explicit value binding.");
            const parsedResult = invoke(`parse:${node.id}`, node.parse.capability, node.bind ? readPath(payload, node.bind) : payload, nested, context);
            if (parsedResult.status === "rejected") throw parsedResult.error;
            if (parsedResult.status === "pending") {
              inspections[node.id] = { ...inspections[node.id]!, status: "pending" };
              let parent = parents.get(node.id);
              while (parent) { inspections[parent] = { ...inspections[parent]!, status: "pending" }; parent = parents.get(parent); }
              status = "pending";
              break;
            }
            const parsedValue = parsedResult.value;
            if (parsedValue === undefined && node.bind) { omitPath(payload, node.bind); continue; }
            const parsed = jsonCopy(parsedValue);
            if (node.bind) writePath(payload, node.bind, parsed);
            else if (node.id === graph.root) { output = parsed; }
          } catch (error) {
            const parseStatus = message(error).startsWith("Async ") || message(error).includes("needs an explicit value binding") ? "unresolved" : "invalid";
            inspections[node.id] = { ...inspections[node.id]!, status: parseStatus, issues: [message(error)] };
            let parent = parents.get(node.id);
            while (parent) { inspections[parent] = { ...inspections[parent]!, status: parseStatus }; parent = parents.get(parent); }
            status = parseStatus;
            break;
          }
        }
        if (status === "complete" && output === undefined) output = jsonCopy(payload);
      }
      const next = { state: { values: jsonCopy(values) as Record<string, JsonValue> }, nodes: inspections, status, ...(status === "complete" ? { payload: output } : {}) };
      if (!snapshot || !equal(snapshot, next)) {
        snapshot = freeze(next);
        changed = true;
      }
    } finally { evaluating = false; }
    if (notify && changed) for (const listener of listeners) listener();
    settleValidationWaiters();
  }

  values = { ...defaults(), ...checkedValues(options.state?.values ?? {}, true) };
  const unsubscribeChoices = choiceStore.subscribe(() => evaluate(true));
  evaluate(true, true, false);

  return {
    /** The existing composer is also used by React's fragment editors. */
    composer,
    getSnapshot: () => snapshot,
    inspect: () => snapshot,
    getChoice<Values, Selection, Services, Option>(nodeId: string, rule: ChoiceRule<Values, Selection, Services, Option>): ChoiceView<Option> | undefined {
      if (synchronizedChoices.get(nodeId)?.rule !== rule) return undefined;
      return snapshot.nodes[nodeId]?.choices as ChoiceView<Option> | undefined;
    },
    subscribe(listener: () => void) { assertActive(); listeners.add(listener); return () => { listeners.delete(listener); }; },
    // Settling validation of the same input is not a new submit intent. Choice
    // evidence, edited values, context, and a new runtime lifetime still are.
    getValidationRevision: () => `${inputRevision}:${choiceStore.getValidationRevision()}`,
    waitForValidation(): Promise<GraphSnapshot> {
      assertActive();
      if (![...capabilityResults.values()].some((result) => result.status === "pending")) return Promise.resolve(snapshot);
      return new Promise((resolve) => validationWaiters.add(resolve));
    },
    update(patch: Readonly<Record<string, JsonValue>>) {
      assertActive();
      values = { ...values, ...checkedValues(patch) };
      evaluate();
      return snapshot;
    },
    replace(state: InteractionState, replaceOptions: { fresh?: boolean } = {}) {
      assertActive();
      values = { ...defaults(), ...checkedValues(state.values, true) };
      choicesEnabled = true;
      evaluate(true, replaceOptions.fresh);
      return snapshot;
    },
    setContext(nextContext: unknown) { assertActive(); context = nextContext; evaluate(); },
    start() { assertActive(); choicesEnabled = true; evaluate(); },
    clearRequests() { assertActive(); choicesEnabled = false; synchronizedChoices.clear(); choiceStore.clearRequests(); },
    retry(nodeId: string) {
      assertActive();
      if (!Object.hasOwn(graph.nodes, nodeId)) throw new Error(`Unknown node: "${nodeId}".`);
      snapshot.nodes[nodeId]?.choices?.retry();
    },
    dispose() { if (disposed) return; disposed = true; unsubscribeChoices(); choiceStore.clearRequests(); listeners.clear(); settleValidationWaiters(); },
  };
}

export type GraphRuntime = ReturnType<typeof createGraphRuntime>;
