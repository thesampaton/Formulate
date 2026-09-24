import { z } from "zod";
import type { $ZodType, $ZodTypes } from "zod/v4/core";
import type { JsonValue, ValueContract } from "./model.js";

/** A description for inspection, never a replacement for the schema capability. */
export type SchemaDescription = {
  readonly contract?: ValueContract;
  readonly input?: JsonValue;
  /** Whether the input property may be omitted, not whether an empty value is valid. */
  readonly required?: boolean;
  /** Some behavior cannot be described faithfully; resolve the named capability. */
  readonly opaque: boolean;
};

const lengthCheckWhen = z.minLength(0)._zod.def.when;

function primitive(schema: $ZodType): boolean {
  const def = (schema as $ZodTypes)._zod.def;
  return ["string", "number", "boolean", "null", "enum", "literal"].includes(def.type);
}

function inputSchema(schema: $ZodType) {
  return z.toJSONSchema(schema, {
    io: "input", unrepresentable: "throw", cycles: "throw", metadata: z.registry(),
    override: ({ zodSchema, jsonSchema }) => {
      const def = (zodSchema as $ZodTypes)._zod.def;
      if (def.type !== "pipe") return;
      const { $schema: _inputVersion, ...before } = inputSchema(def.in);
      const { $schema: _outputVersion, ...after } = inputSchema(def.out);
      // A primitive pipeline validates the same value twice. Preserve both
      // sets of constraints; collapse a redundant base type for readability.
      const combined = Object.keys(before).length === 1 && before.type === after.type
        ? after : { allOf: [before, after] };
      for (const key of Object.keys(jsonSchema)) delete jsonSchema[key];
      Object.assign(jsonSchema, combined);
    },
  });
}

/**
 * Zod's converter intentionally omits some executable behavior. In particular,
 * overwrites, coercion and regex flags can make its input description narrower
 * than the real input. Recognize a conservative subset before converting it.
 * The discrimination API is documented at https://zod.dev/packages/core.
 */
function describable(schema: $ZodType, ancestors = new Set<$ZodType>()): boolean {
  if (ancestors.has(schema)) return false;
  const next = new Set(ancestors).add(schema);
  const def = (schema as $ZodTypes)._zod.def;
  if ("coerce" in def && def.coerce) return false;
  for (const check of def.checks ?? []) {
    const rule = check._zod.def;
    if (rule.when && rule.when !== lengthCheckWhen) return false;
    switch (rule.check) {
      case "min_length":
      case "max_length":
      case "length_equals":
      case "greater_than":
      case "less_than":
      case "number_format":
      case "multiple_of":
        break;
      case "string_format": {
        const format = rule as { format?: string; pattern?: RegExp };
        if (format.format !== "regex" || !format.pattern || format.pattern.flags) return false;
        break;
      }
      default:
        return false;
    }
  }
  const child = (item: $ZodType) => describable(item, next);
  switch (def.type) {
    case "string":
      // Specialized formats may implement a check outside def.checks.
      return !("format" in def);
    case "number":
    case "boolean":
    case "null":
    case "enum":
    case "literal":
    case "unknown":
    case "any":
    case "never":
      return true;
    case "optional":
    case "nullable":
    case "nonoptional":
      return child(def.innerType);
    case "array":
      return child(def.element);
    case "object":
      return Object.values(def.shape).every(child) && (!def.catchall || child(def.catchall));
    case "union":
      return def.options.every(child);
    case "intersection":
      return child(def.left) && child(def.right);
    case "pipe":
      return primitive(def.in) && primitive(def.out) && child(def.in) && child(def.out);
    default:
      // Do not evaluate default factories, refinements, transforms, lazy
      // factories, or parsers merely to describe a definition.
      return false;
  }
}

/**
 * Ordinary constraints come from the original definition, with no annotations.
 * Input mode preserves optionality and accepting extra object properties. An
 * empty metadata registry prevents .meta() from overriding validation keywords.
 * Even a successful conversion describes inputs only: host validation/parsing
 * remains authoritative for messages, object stripping, and output behavior.
 */
export function describeSchema(schema: z.ZodType): SchemaDescription {
  if (!describable(schema)) return { opaque: true };
  try {
    const description = inputSchema(z.object({ value: schema }));
    const input = description.properties?.value;
    if (!input || typeof input !== "object") return { opaque: true };
    const contract: ValueContract = {
      ...(["string", "number", "boolean", "array", "object"].includes(String(input.type)) ? { type: input.type as ValueContract["type"] } : {}),
      ...(input.enum ? { enum: input.enum as JsonValue[] } : "const" in input ? { enum: [input.const as JsonValue] } : {}),
      ...(input.minLength !== undefined ? { minLength: input.minLength } : {}),
      ...(input.pattern !== undefined ? { pattern: input.pattern } : {}),
    };
    return {
      ...(Object.keys(contract).length ? { contract } : {}),
      input: JSON.parse(JSON.stringify(input)) as JsonValue,
      required: description.required?.includes("value") ?? false,
      opaque: false,
    };
  } catch {
    // Non-JSON literals and unsupported Zod features stay named capabilities.
    return { opaque: true };
  }
}
