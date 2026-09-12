// Compile-time contract assertions; included by pnpm typecheck.
import { z } from "zod";
import { defineForm } from "../examples/react/src/lib/formulate-config";
import { ComposedValues } from "../examples/react/src/declarations/composed-values";

export function composedControlTypes() {
  const form = ComposedValues.useForm();
  const value: string = form.getValues("sku");
  <ComposedValues.Field name="sku" componentProps={{ className: "max-w-md", inputClassName: "font-mono", segmentClassName: "text-muted-foreground", autoComplete: "off" }} />;
  // @ts-expect-error ComposedInput edits strings, not numbers.
  defineForm({ reference: { schema: z.number(), defaultValue: 0, label: "Reference", component: "composedInput" } });
  // @ts-expect-error Native fragment names cannot create extra submitted fields.
  <ComposedValues.Field name="sku" componentProps={{ name: "style" }} />;
  // @ts-expect-error The canonical field binding manages editor changes.
  <ComposedValues.Field name="sku" componentProps={{ onChange: () => {} }} />;
  // @ts-expect-error The canonical field binding manages logical blur.
  <ComposedValues.Field name="sku" componentProps={{ onBlur: () => {} }} />;
  // @ts-expect-error Form disabled state applies to every fragment.
  <ComposedValues.Field name="sku" componentProps={{ disabled: true }} />;
  // @ts-expect-error The binding derives editable fragments from the canonical value.
  <ComposedValues.Field name="sku" componentProps={{ value: "TEE" }} />;
  // @ts-expect-error Pattern validation applies to the final string in its schema.
  <ComposedValues.Field name="sku" componentProps={{ pattern: "[A-Z]+" }} />;
  // @ts-expect-error Native email/URL validation would validate a fragment instead of the final value.
  <ComposedValues.Field name="email" componentProps={{ type: "email" }} />;
  void value;
}
