import type { FieldPath, FieldValues } from "react-hook-form";

type FixedOptions = { readonly?: true };
type Transform = { transform?: (value: unknown) => string };

/** Keep composition independent of React while retaining existing field-path reads. */
function readValue(object: unknown, path: string): unknown {
  if (!path || object === null || typeof object !== "object" || Array.isArray(object) || object instanceof Date) return undefined;
  const keys = path.split(/[.[\]'"]/).filter(Boolean);
  if (keys.some((key) => ["__proto__", "constructor", "prototype"].includes(key))) return undefined;
  const result = keys.reduce<unknown>((value, key) => value == null ? undefined : (value as Record<string, unknown>)[key], object);
  return result === undefined || result === object ? (object as Record<string, unknown>)[path] : result;
}

/** Sources are read-only here. Only input segments are authored by this editor. */
export type ValueSegment<Values extends FieldValues = FieldValues> =
  | ({ literal: string; binding?: never; context?: never; input?: never; transform?: never } & FixedOptions)
  | ({ binding: FieldPath<Values>; literal?: never; context?: never; input?: never } & FixedOptions & Transform)
  | ({ context: string; literal?: never; binding?: never; input?: never } & FixedOptions & Transform)
  | { input: true; label?: string; placeholder?: string; literal?: never; binding?: never; context?: never; transform?: never; readonly?: never };

export type ResolvedValueSegment =
  | { kind: "literal" | "binding" | "context"; value: string }
  | { kind: "input"; value: string; label?: string; placeholder?: string };

export type StringComposition<Values extends FieldValues = FieldValues> = {
  segments: readonly ValueSegment<Values>[];
  /** Required for multiple inputs. Return editable strings in input order.
   * Must invert concatenation for the values your editor accepts. */
  parse?: (value: string, segments: readonly ResolvedValueSegment[]) => readonly string[];
};

/** A declaration bound to paths in its owning form. Sections remap both ends. */
export type BoundStringComposition = {
  name: string;
  composition: StringComposition;
};

export function bindStringCompositions(compositions: readonly BoundStringComposition[], resolvePath: (path: string) => string): BoundStringComposition[] {
  return compositions.map(({ name, composition }) => ({
    name: resolvePath(name),
    composition: {
      ...composition,
      segments: composition.segments.map((segment) => segment.binding !== undefined
        ? { ...segment, binding: resolvePath(segment.binding) }
        : segment),
    },
  }));
}

function scalarText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return String(value);
  throw new Error("A composed binding needs a scalar value or a transform returning a string.");
}

function resolveSegments(composition: StringComposition, values: FieldValues, context: unknown): ResolvedValueSegment[] {
  return composition.segments.map((segment) => {
    if (segment.input) return { kind: "input", value: "", label: segment.label, placeholder: segment.placeholder };
    if (segment.literal !== undefined) return { kind: "literal", value: segment.literal };
    const value: unknown = segment.binding !== undefined ? readValue(values, segment.binding) : readValue(context, segment.context!);
    const text = segment.transform ? segment.transform(value) : scalarText(value);
    if (typeof text !== "string") throw new Error("A composed binding transform must return a string.");
    return { kind: segment.binding !== undefined ? "binding" : "context", value: text };
  });
}

function readInputs(value: string, composition: StringComposition, segments: readonly ResolvedValueSegment[]): readonly string[] {
  const count = segments.filter((segment) => segment.kind === "input").length;
  if (count === 0) return [];
  if (value === "") return Array<string>(count).fill("");
  if (composition.parse) {
    const inputs = composition.parse(value, segments);
    if (inputs.length !== count || inputs.some((input) => typeof input !== "string")) {
      throw new Error("A composition parser must return one string per input segment.");
    }
    return inputs;
  }
  const index = segments.findIndex((segment) => segment.kind === "input");
  const prefix = segments.slice(0, index).map((segment) => segment.value).join("");
  const suffix = segments.slice(index + 1).map((segment) => segment.value).join("");
  // A canonical value (or the empty seed) is the normal input. Preserve malformed
  // external text as editable content instead of silently discarding it.
  const start = value.startsWith(prefix) ? prefix.length : 0;
  const end = suffix && value.endsWith(suffix) && value.length - suffix.length >= start ? value.length - suffix.length : value.length;
  return [value.slice(start, end)];
}

function withInputs(segments: readonly ResolvedValueSegment[], inputs: readonly string[]): ResolvedValueSegment[] {
  let index = 0;
  return segments.map((segment) => segment.kind === "input" ? { ...segment, value: inputs[index++]! } : segment);
}

/** Clone only ancestors of a changed scalar; never mutate caller-owned defaults. */
function setValueAtPath(values: FieldValues, path: string, value: string): FieldValues {
  const keys = path.split(".");
  const root = { ...values };
  let target: any = root;
  let source: any = values;
  for (const key of keys.slice(0, -1)) {
    source = source?.[key];
    target[key] = Array.isArray(source) ? [...source] : { ...source };
    target = target[key];
  }
  target[keys.at(-1)!] = value;
  return root;
}

/** Order derived fields before their consumers; reject feedback instead of looping. */
function orderedCompositions(compositions: readonly BoundStringComposition[]) {
  const ordered: BoundStringComposition[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const names = new Set<string>();
  for (const { name, composition } of compositions) {
    if (names.has(name)) throw new Error(`Duplicate composed field: "${name}".`);
    names.add(name);
    if (composition.segments.filter((segment) => segment.input).length > 1 && !composition.parse) {
      throw new Error(`Field "${name}": multiple input segments require an explicit composition parser.`);
    }
  }
  function visit(item: BoundStringComposition) {
    if (visiting.has(item.name)) throw new Error(`Cyclic composed value binding at "${item.name}".`);
    if (visited.has(item.name)) return;
    visiting.add(item.name);
    for (const segment of item.composition.segments) {
      if (segment.binding === undefined) continue;
      for (const dependency of compositions) {
        if (segment.binding === dependency.name || segment.binding.startsWith(`${dependency.name}.`) || dependency.name.startsWith(`${segment.binding}.`)) visit(dependency);
      }
    }
    visiting.delete(item.name);
    visited.add(item.name);
    ordered.push(item);
  }
  compositions.forEach(visit);
  return ordered;
}

type Snapshot = { value: string; segments: readonly ResolvedValueSegment[] };

/** Cached affixes let source changes retain authored text. The scalar is still
 * authoritative: reset/setValue are decoded again, never shadowed by local state. */
export function createStringComposer(compositions: readonly BoundStringComposition[]) {
  const ordered = orderedCompositions(compositions);
  const snapshots = new Map<string, Snapshot>();
  const defaults = new Map<string, { value: string; inputs: readonly string[] }>();
  const definitions = new Map(compositions.map((item) => [item.name, item.composition]));

  function compose(values: FieldValues, context: unknown, fresh = false) {
    let next = values;
    const changes: { name: string; value: string }[] = [];
    for (const { name, composition } of ordered) {
      const value: unknown = readValue(next, name);
      if (typeof value !== "string") throw new Error(`Field "${name}": composition requires a string editing value.`);
      const resolved = resolveSegments(composition, next, context);
      const previous = snapshots.get(name);
      const baseline = defaults.get(name);
      const inputs = previous?.value === value
        ? previous.segments.filter((segment) => segment.kind === "input").map((segment) => segment.value)
        : baseline?.value === value ? baseline.inputs : readInputs(value, composition, resolved);
      if (fresh) defaults.set(name, { value, inputs });
      const segments = withInputs(resolved, inputs);
      const canonical = segments.map((segment) => segment.value).join("");
      snapshots.set(name, { value: canonical, segments });
      if (canonical !== value) {
        next = setValueAtPath(next, name, canonical);
        changes.push({ name, value: canonical });
      }
    }
    return { values: next, changes };
  }

  function view(name: string, value: string): readonly ResolvedValueSegment[] {
    const snapshot = snapshots.get(name);
    const composition = definitions.get(name);
    if (!snapshot || !composition) throw new Error(`Field "${name}" needs a composition in its owning form definition.`);
    return snapshot.value === value ? snapshot.segments : withInputs(snapshot.segments, readInputs(value, composition, snapshot.segments));
  }

  function edit(name: string, value: string, index: number, input: string) {
    const segments = view(name, value);
    if (segments[index]?.kind !== "input") throw new Error("Only input segments can be edited.");
    const next = segments.map((segment, position) => position === index ? { ...segment, value: input } : segment);
    const canonical = next.map((segment) => segment.value).join("");
    // Retain the user's partition while editing even when a delimiter makes the
    // temporary string invalid. Parsing is for external scalar rehydration.
    snapshots.set(name, { value: canonical, segments: next });
    return canonical;
  }

  return { compose, view, edit };
}
