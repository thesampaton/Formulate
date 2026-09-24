import { z } from "zod";

type SchemaResult = ReturnType<z.ZodType["safeParse"]>;

/**
 * Zod's v4 extension runner keeps synchronous schemas synchronous and returns
 * a promise only when a schema needs one. Unlike probing safeParse then
 * retrying safeParseAsync, this executes refinements and transforms once.
 * Finalization follows Zod's own safeParseAsync, including configured messages.
 */
export function parseDefinitionSchema(schema: z.ZodType, value: unknown): SchemaResult | Promise<SchemaResult> {
  const context = { async: true };
  const finish = (result: z.core.ParsePayload<unknown>): SchemaResult => result.issues.length
    ? { success: false, error: new z.ZodError(result.issues.map((issue) => z.core.util.finalizeIssue(issue, context, z.core.config()))) }
    : { success: true, data: result.value };
  const result = schema._zod.run({ value, issues: [] }, context);
  return result instanceof Promise ? result.then(finish) : finish(result);
}
