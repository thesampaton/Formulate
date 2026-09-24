import type { Condition } from "./model.js";
import { assertBindingPath } from "./normalize.js";

export const DEPENDENCY_BLOCKED_MESSAGE = "Complete this node\'s dependencies first.";

export function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0);
}
function read(value: unknown, path: string): unknown {
  assertBindingPath(path);
  return path.split(".").reduce<unknown>((current, key) => current !== null && typeof current === "object" && Object.hasOwn(current, key) ? (current as Record<string, unknown>)[key] : undefined, value);
}
function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const entries = Object.entries(a);
  return entries.length === Object.keys(b).length && entries.every(([key, value]) => Object.hasOwn(b, key) && equal(value, (b as Record<string, unknown>)[key]));
}
/** One evaluator for schema applicability, graph inspection and action guards. */
export function conditionMatches(condition: Condition, values: unknown): boolean {
  if ("binding" in condition) {
    const value = read(values, condition.binding);
    return "equals" in condition ? equal(value, condition.equals) : !isEmptyValue(value);
  }
  if ("all" in condition) return condition.all.every((item) => conditionMatches(item, values));
  if ("any" in condition) return condition.any.some((item) => conditionMatches(item, values));
  return !conditionMatches(condition.not, values);
}
