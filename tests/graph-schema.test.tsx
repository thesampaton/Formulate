import { expect, it, vi } from "vitest";
import { z } from "zod";
import { describeSchema } from "../packages/react/src/graph/schema.js";

it("derives ordinary string constraints from the authoritative schema", () => {
  const description = describeSchema(z.string().min(2).max(12).regex(/^[a-z]+$/));
  expect(description).toEqual({
    input: { type: "string", minLength: 2, maxLength: 12, pattern: "^[a-z]+$" },
    contract: { type: "string", minLength: 2, pattern: "^[a-z]+$" },
    required: true,
    opaque: false,
  });
  expect(JSON.parse(JSON.stringify(description))).toEqual(description);
});

it("describes enum, numeric, boolean and nested value contracts", () => {
  expect(describeSchema(z.enum(["AU", "NZ"]))).toMatchObject({ contract: { type: "string", enum: ["AU", "NZ"] }, opaque: false });
  expect(describeSchema(z.number().int().min(1).max(10))).toMatchObject({ input: { type: "integer", minimum: 1, maximum: 10 }, opaque: false });
  expect(describeSchema(z.boolean())).toMatchObject({ contract: { type: "boolean" }, opaque: false });
  expect(describeSchema(z.array(z.object({ name: z.string().min(1), enabled: z.boolean().optional() })).min(1))).toMatchObject({
    input: { type: "array", minItems: 1, items: { type: "object", properties: { name: { type: "string", minLength: 1 }, enabled: { type: "boolean" } }, required: ["name"] } },
    opaque: false,
  });
});

it("retains ordinary primitive pipeline constraints without inventing a second enum", () => {
  expect(describeSchema(z.string().pipe(z.enum(["A", "B"])))).toMatchObject({
    input: { type: "string", enum: ["A", "B"] }, contract: { type: "string", enum: ["A", "B"] }, opaque: false,
  });
  expect(describeSchema(z.string().min(2).pipe(z.string().max(5)))).toMatchObject({
    input: { allOf: [{ type: "string", minLength: 2 }, { type: "string", maxLength: 5 }] }, opaque: false,
  });
  // Object pipelines can strip data before the second schema sees it.
  expect(describeSchema(z.object({ name: z.string() }).pipe(z.object({ name: z.string() })))).toEqual({ opaque: true });
});

it("keeps optionality, nullability and object input acceptance intact", () => {
  expect(describeSchema(z.string().optional())).toMatchObject({ required: false, input: { type: "string" } });
  expect(describeSchema(z.string().nullable())).toEqual({ required: true, input: { type: ["string", "null"] }, opaque: false });
  expect(describeSchema(z.string().min(2).nullable()).contract).toBeUndefined();
  expect(describeSchema(z.object({ name: z.string() })).input).not.toHaveProperty("additionalProperties");
  expect(describeSchema(z.strictObject({ name: z.string() })).input).toHaveProperty("additionalProperties", false);
  // A string property is required to exist, but '' is still valid. Consumers
  // must never interpret this description as Formulate's required-empty rule.
  expect(z.string().safeParse("").success).toBe(true);
});

it("does not mistake Zod metadata for validation rules", () => {
  expect(describeSchema(z.string().min(2).meta({ type: "number", minLength: 100, execute: () => undefined }))).toEqual({
    input: { type: "string", minLength: 2 }, contract: { type: "string", minLength: 2 }, required: true, opaque: false,
  });
});

it("keeps coercion, transforms, overwrites and regex flags behind capabilities", () => {
  const schemas = [
    z.coerce.string(),
    z.coerce.number(),
    z.string().trim().min(2),
    z.string().toLowerCase().regex(/^[a-z]+$/),
    z.string().transform((value) => value.length),
    z.string().regex(/^abc$/i),
    z.string().catch("fallback"),
    z.array(z.coerce.number()),
    z.object({ name: z.string().trim() }),
  ];
  for (const schema of schemas) expect(describeSchema(schema)).toEqual({ opaque: true });
  expect(schemas[3]!.safeParse("ABC").success).toBe(true);
  expect(schemas[5]!.safeParse("ABC").success).toBe(true);
});

it("does not execute custom behavior or claim refinements were converted", () => {
  const refine = vi.fn(() => true);
  const defaultValue = vi.fn(() => "generated");
  const lazy = vi.fn(() => z.string());
  const schemas = [z.string().refine(refine), z.string().default(defaultValue), z.lazy(lazy), z.custom(refine), z.date(), z.literal(1n)];
  for (const schema of schemas) expect(describeSchema(schema)).toEqual({ opaque: true });
  expect(refine).not.toHaveBeenCalled();
  expect(defaultValue).not.toHaveBeenCalled();
  expect(lazy).not.toHaveBeenCalled();
});
