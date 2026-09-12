// Compile-time checks for scalar composition; included in pnpm typecheck.
import { createFormulate, defaultComponents, defineFieldControl, useComposedFieldBinding } from "@formulate/react";
import type { StringComposition, ValueSegment } from "@formulate/react";
import { z } from "zod";

const ComposedControl = defineFieldControl<string>()(function ComposedControl() {
  const field = useComposedFieldBinding();
  const scalar: string = field.value;
  field.onInputChange(0, "edited");
  // @ts-expect-error Editable fragments are strings.
  field.onInputChange(0, 4);
  // @ts-expect-error The canonical field binding remains scalar.
  field.onChange(["prefix", "edited"]);
  return <span>{scalar}</span>;
});
const { defineForm } = createFormulate({ components: { ...defaultComponents, composed: ComposedControl } });
const Example = defineForm({
  region: { schema: z.string(), defaultValue: "AU", label: "Region", component: "input" },
  reference: { schema: z.string().transform((value) => ({ id: value })), defaultValue: "", label: "Reference", component: "composed",
    composition: { segments: [{ literal: "CUS-" }, { binding: "region", readonly: true }, { literal: "-" }, { input: true }] } },
});

export function checkComposedValues() {
  const form = Example.useForm({ compositionContext: { organization: { slug: "acme" } } });
  const editing: string = form.getValues("reference");
  form.handleSubmit((values) => {
    const output: { id: string } = values.reference;
    // @ts-expect-error Composed editing remains distinct from parsed output.
    const raw: string = values.reference;
    void output; void raw;
  });
  // @ts-expect-error Only canonical scalars are accepted as prefills.
  Example.useForm({ defaultValues: { reference: ["CUS-", "AU", "-", "42"] } });
  // @ts-expect-error Runtime writes use the scalar editing type.
  form.setValue("reference", { id: "CUS-AU-42" });
  // @ts-expect-error Composition metadata cannot be replaced at presentation time.
  <Example.Field name="reference" composition={{ segments: [{ input: true }] }} />;
  void editing;
}

const binding: ValueSegment<{ organization: { slug: string }; sequence: number }> = { binding: "organization.slug", transform: (value) => String(value).toLowerCase() };
const composition: StringComposition<{ sequence: number }> = { segments: [{ literal: "CUS-" }, { binding: "sequence" }, { context: "organization.slug" }, { input: true }] };
// @ts-expect-error A segment has exactly one source.
const mixed: ValueSegment = { literal: "fixed", input: true };
// @ts-expect-error Bound segments cannot become writable aliases.
const writableBinding: ValueSegment = { binding: "region", readonly: false };
// @ts-expect-error Binding paths must exist in the declared values.
const missing: ValueSegment<{ region: string }> = { binding: "organization.slug" };
// @ts-expect-error Transforms return strings for concatenation.
const invalidTransform: ValueSegment = { binding: "sequence", transform: () => 42 };
// @ts-expect-error Parsers return editable strings, not parsed output objects.
const invalidParser: StringComposition = { segments: [{ input: true }], parse: () => [42] };
// @ts-expect-error Number editing fields cannot declare string composition.
defineForm({ count: { schema: z.number(), defaultValue: 0, label: "Count", component: "number", composition: { segments: [{ literal: "CUS-" }] } } });
// @ts-expect-error Inline composition bindings are checked against sibling paths.
defineForm({ reference: { schema: z.string(), defaultValue: "", label: "Reference", component: "composed", composition: { segments: [{ binding: "missing" }, { input: true }] } } });
void binding; void composition; void mixed; void writableBinding; void missing; void invalidTransform; void invalidParser;
