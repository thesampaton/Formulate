import { z } from "zod";

// Reuse schemas across ordinary and composed fields. Patterns validate their full
// canonical strings; composition and presentation do not own another validator.
export const slugSchema = z.string().regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Use lowercase letters or digits separated by single hyphens.",
);

// A pattern stored as a string uses normal JavaScript RegExp syntax and escaping.
export const customerReferencePatternSource = String.raw`^CUS-[A-Z]{2}-\d{4}$`;
export const customerReferenceSchema = z.string().regex(
  new RegExp(customerReferencePatternSource),
  "Use CUS-, a two-letter region, and four digits (for example CUS-AU-0042).",
);

// Flags belong to the RegExp. Case-insensitive validation preserves entered case.
export const skuSchema = z.string().regex(
  new RegExp("^SKU-[a-z0-9]{4,12}$", "i"),
  "Use SKU- followed by four to twelve letters or digits.",
);
