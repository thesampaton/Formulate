import { z } from "zod";
import type { ChoiceRule } from "../choices/definition.js";
import type { StringComposition } from "../fields/string-composition.js";
import type { AuthorNode, Condition, NormalizedGraph, PortableAction, PortableNode, PortableStringComposition } from "./model.js";
import { normalizeGraph } from "./normalize.js";
import type { GraphCapabilities } from "./runtime.js";
import { describeSchema } from "./schema.js";
import { parseDefinitionSchema } from "../definitions/schema-parse.js";

/** Semantics declared once, on the reusable definition itself. */
export type DefinitionSemantics = {
  readonly id?: string;
  readonly definitionId?: string;
  readonly applicable?: Condition;
  readonly dependsOn?: readonly string[];
  readonly actions?: readonly PortableAction[];
};

/** Presentation containment references declared members without rebinding them. */
export type DefinitionLayout = string | {
  readonly id: string;
  readonly role: "page" | "section";
  readonly label?: string;
  readonly children: readonly DefinitionLayout[];
};

/** Validate containment once for normal rendering and export. */
export function validateDefinitionLayout(memberNames: readonly string[], children: readonly DefinitionLayout[] | undefined, id = "definition"): void {
  if (!children) return;
  const declared = new Set(memberNames);
  const used = new Set<string>();
  function visit(item: DefinitionLayout) {
    if (typeof item !== "string") { item.children.forEach(visit); return; }
    if (!declared.has(item)) throw new Error(`Unknown member "${item}" in definition "${id}" layout.`);
    if (used.has(item)) throw new Error(`Member "${item}" appears more than once in definition "${id}" layout.`);
    used.add(item);
  }
  children.forEach(visit);
  if (used.size !== declared.size) throw new Error(`Definition "${id}" layout omits members: ${memberNames.filter((name) => !used.has(name)).join(", ")}.`);
}

export type PortableExport = {
  authoring: AuthorNode;
  graph: NormalizedGraph;
  /** Host-owned functions, deliberately separate from the JSON graph. */
  capabilities: GraphCapabilities;
};
export type PortableExportOptions = { id?: string; services?: unknown };
export const portableDefinition = Symbol("portable-definition");
export type FieldSource = DefinitionSemantics & {
  readonly bind?: string;
  schema: z.ZodType;
  defaultValue?: unknown;
  label?: unknown;
  choices?: ChoiceRule<any, any, any, any>;
  composition?: StringComposition;
};
export type PortableDefinitionSource = DefinitionSemantics & {
  role: "form" | "section";
  /** Explicit placement of one reusable section instance. */
  readonly instanceId?: string;
  readonly bind?: string;
  members: Record<string, FieldSource | { [portableDefinition]: PortableDefinitionSource }>;
  children?: readonly DefinitionLayout[];
  schema: z.ZodType;
  /** A host schema builder may replace the original member contracts. */
  customized?: boolean;
};

function read(values: any, path: string) {
  return path ? path.split(".").reduce((value, key) => value?.[key], values) : values;
}
function scopeCondition(condition: Condition, prefix: string): Condition {
  if ("binding" in condition) return { ...condition, binding: prefix + condition.binding };
  if ("all" in condition) return { all: condition.all.map((item) => scopeCondition(item, prefix)) };
  if ("any" in condition) return { any: condition.any.map((item) => scopeCondition(item, prefix)) };
  return { not: scopeCondition(condition.not, prefix) };
}

/** Compile the existing definition into JSON data and references to its actual behavior. */
export function exportPortableDefinition(source: PortableDefinitionSource, options: PortableExportOptions = {}): PortableExport {
  const rootId = options.id ?? source.instanceId ?? source.id ?? source.role;
  const capabilities: Record<string, (...args: any[]) => any> = {};
  // Every inspection and payload projection reads one authoritative parse of
  // the root schema. Child schemas cannot narrow a customized root definition.
  const evaluations = new WeakMap<object, ReturnType<typeof parseDefinitionSchema>>();
  function evaluate(values: object) {
    let result = evaluations.get(values);
    if (!result) { result = parseDefinitionSchema(source.schema, values); evaluations.set(values, result); }
    return result;
  }
  function issues(values: object, prefix: string, relative = false) {
    const result = evaluate(values);
    const path = prefix.split(".").filter(Boolean);
    function collect(parsed: Awaited<ReturnType<typeof parseDefinitionSchema>>) {
      if (parsed.success) return undefined;
      return parsed.error.issues
        .filter((issue) => path.every((part, index) => String(issue.path[index]) === part))
        .map((issue) => ({ path: relative ? issue.path.slice(path.length) : issue.path, message: issue.message }));
    }
    return result instanceof Promise ? result.then(collect) : collect(result);
  }
  function register(name: string, fn: (...args: any[]) => any) {
    if (Object.hasOwn(capabilities, name)) throw new Error(`Duplicate capability: ${name}`);
    capabilities[name] = fn;
    return { capability: name };
  }
  function semantics(metadata: DefinitionSemantics, valuePrefix: string, resolveId: (id: string) => string) {
    return {
      ...(metadata.definitionId ? { use: metadata.definitionId } : {}),
      ...(metadata.dependsOn ? { dependsOn: metadata.dependsOn.map(resolveId) } : {}),
      ...(metadata.actions ? { actions: metadata.actions.map((action) => action.when ? { ...action, when: scopeCondition(action.when, valuePrefix) } : action) } : {}),
      ...(metadata.applicable ? { applicable: scopeCondition(metadata.applicable, valuePrefix) } : {}),
    };
  }
  function descriptionAt(binding: string) {
    let schema: z.ZodType = source.schema;
    for (const key of binding.split(".")) {
      if (!(schema instanceof z.ZodObject) || !Object.hasOwn(schema.shape, key)) return undefined;
      schema = schema.shape[key];
    }
    return describeSchema(schema);
  }
  function visit(definition: PortableDefinitionSource, id: string, identityPrefix: string, valuePrefix: string, parentValuePrefix = "", parentResolveId?: (id: string) => string, ancestorCustomized = false): AuthorNode {
    const customized = ancestorCustomized || !!definition.customized;
    const memberIds = new Map(Object.entries(definition.members).map(([name, member]) => [name, identityPrefix + (portableDefinition in member ? member[portableDefinition].instanceId ?? name : member.id ?? name)]));
    const resolveId = (name: string) => memberIds.get(name) ?? identityPrefix + name;
    const members = new Map(Object.entries(definition.members).map(([name, member]): [string, AuthorNode] => {
      const memberId = memberIds.get(name)!;
      if (portableDefinition in member) return [name, visit(member[portableDefinition], memberId, `${memberId}.`, `${valuePrefix}${member[portableDefinition].bind ?? name}.`, valuePrefix, resolveId, customized)];
      const binding = valuePrefix + (member.bind ?? name);
      const capabilityPrefix = `${rootId}.${memberId}`;
      const description = customized ? descriptionAt(binding) : describeSchema(member.schema);
      const validate = register(`${capabilityPrefix}.validate`, (_value, values) => issues(values, binding, true));
      let composition: PortableStringComposition | undefined;
      if (member.composition) {
        const original = member.composition;
        composition = {
          segments: original.segments.map((segment, index) => {
            const { transform, ...rest } = segment;
            return {
              ...rest,
              ...(segment.binding !== undefined ? { binding: valuePrefix + segment.binding } : {}),
              ...(transform ? { transform: register(`${capabilityPrefix}.segment.${index}.transform`, transform) } : {}),
            };
          }),
          ...(original.parse ? { parse: register(`${capabilityPrefix}.composition.parse`, original.parse) } : {}),
        } as PortableStringComposition;
      }
      const choices = member.choices ? {
        ...(member.choices.dependencies ? { dependencies: member.choices.dependencies.map((path: string) => valuePrefix + path) } : {}),
        ...register(`${capabilityPrefix}.choices`, (values, selection) => member.choices!.resolve(read(values, valuePrefix.slice(0, -1)), selection, options.services)),
      } : undefined;
      return [name, {
        id: memberId,
        role: "field",
        bind: binding,
        ...(typeof member.label === "string" ? { label: member.label } : {}),
        ...(member.defaultValue !== undefined ? { defaultValue: member.defaultValue as PortableNode["defaultValue"] } : {}),
        ...semantics(member, valuePrefix, resolveId),
        ...(description?.contract ? { contract: description.contract } : {}),
        ...(description?.input ? { valueSchema: description.input } : {}),
        validate,
        ...(choices ? { choices } : {}),
        ...(composition ? { composition } : {}),
      }];
    }));
    validateDefinitionLayout([...members.keys()], definition.children, id);
    function layout(item: DefinitionLayout): AuthorNode {
      if (typeof item === "string") return members.get(item)!;
      return { id: identityPrefix + item.id, role: item.role, ...(item.label ? { label: item.label } : {}), children: item.children.map(layout) };
    }
    const children = definition.children ? definition.children.map(layout) : [...members.values()];
    const schemaPrefix = `${rootId}.${id}.schema`;
    const validate = register(`${schemaPrefix}.validate`, (_value, values) => issues(values, valuePrefix.slice(0, -1)));
    return {
      id, role: definition.role, ...semantics(definition, parentValuePrefix, parentResolveId ?? resolveId), children, validate,
      // The exact same effective schema owns output in both projections. Parsing
      // leaves independently would apply transforms twice or lose object refinements.
      ...(!valuePrefix ? { parse: register(`${schemaPrefix}.parse`, (_value, values) => {
        const result = evaluate(values);
        function output(parsed: Awaited<ReturnType<typeof parseDefinitionSchema>>) {
          if (!parsed.success) throw parsed.error;
          return parsed.data;
        }
        return result instanceof Promise ? result.then(output) : output(result);
      }) } : {}),
    };
  }
  const authoring = visit(source, rootId, "", "");
  return { authoring, graph: normalizeGraph(authoring), capabilities: Object.freeze(capabilities) };
}
