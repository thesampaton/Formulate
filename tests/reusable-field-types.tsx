// Compile-time API checks, included in pnpm typecheck; never rendered.
import { createFormulate, defaultComponents, defineField, defineFieldControl, defineForm, defineSection, field } from "@formulate/react";
import type { PrimitiveFieldType } from "@formulate/react";
import { z } from "zod";
import { Country, Currency, DateRange, Email } from "../examples/react/src/declarations/common-fields";

const Select = defineFieldControl<string>()((_: { options: readonly string[]; placeholder?: string }) => null);
const Switch = defineFieldControl<boolean>()((_: { size?: "small" | "large" }) => null);
const Range = defineFieldControl<{ from: Date | null; to: Date | null }>()(() => null);
const ui = createFormulate({ components: { ...defaultComponents, select: Select, switch: Switch, dateRange: Range } });
const Enabled = defineField({ primitive: "boolean", schema: z.boolean(), defaultValue: false, label: "Enabled", component: "checkbox" });
const Supplier = defineField({ primitive: "choice", schema: z.string().min(1), defaultValue: "", label: "Supplier", component: "select", componentProps: { options: ["acme"] } });
const CountrySelect = defineField({ ...Country, component: "select" });
const Count = defineField({ primitive: "text", schema: z.string().transform(Number), defaultValue: "0", label: "Count", component: "input" });

const Contact = defineSection({ email: field(Email, { defaultValue: "person@example.com", description: "Contact address" }) });
const Details = ui.defineForm({
  contact: Contact,
  supplier: ui.field(Supplier, { componentProps: { placeholder: "Select supplier" } }),
  country: ui.field(Country, { component: "select", componentProps: { options: ["AU", "NZ"] } }),
  countryDefault: ui.field(CountrySelect, { componentProps: { options: ["AU", "NZ"] } }),
  enabled: ui.field(Enabled, { component: "switch", componentProps: { size: "large" }, defaultValue: true }),
  amount: ui.field(Currency, { component: "number" }),
  count: ui.field(Count, { defaultValue: "2" }),
  dates: ui.field(DateRange),
});

export function reusableFieldTypes() {
  const form = Details.useForm();
  const count: string = form.getValues("count");
  const amount: number = form.getValues("amount");
  const from: Date | null = form.getValues("dates.from");
  form.handleSubmit((values) => { const parsed: number = values.count; void parsed; });
  <Details.Field name="supplier" componentProps={{ options: ["other"] }} />;
  <Details.Field name="enabled" componentProps={{ size: "small" }} />;
  // @ts-expect-error Control replacement retains the replacement's props, not checkbox props.
  <Details.Field name="enabled" componentProps={{ type: "email" }} />;
  // @ts-expect-error Reuse still checks field names.
  <Details.Field name="email" />;
  // @ts-expect-error The transformed field still edits a string.
  Details.useForm({ defaultValues: { count: 3 } });
  // @ts-expect-error Primitive names describe values, not components.
  const primitive: PrimitiveFieldType = "switch";
  // @ts-expect-error A reusable field must declare its primitive semantics.
  defineField({ schema: z.string(), defaultValue: "", label: "Name", component: "input" });
  // @ts-expect-error Defaults match schema input, even before a field is used.
  defineField({ primitive: "text", schema: z.string(), defaultValue: false, label: "Bad", component: "input" });
  // @ts-expect-error Defaults match editing input, not transformed output.
  defineField({ ...Count, defaultValue: 0 });
  // @ts-expect-error Instance defaults use the editing type.
  field(Email, { defaultValue: false });
  // @ts-expect-error Undefined cannot replace a required string editing default.
  field(Email, { defaultValue: undefined });
  // @ts-expect-error Instance schema replacement must be an explicit derived defineField.
  field(Email, { schema: z.string() });
  // @ts-expect-error Instance primitive replacement is not presentation configuration.
  field(Email, { primitive: "number" });
  // @ts-expect-error Props come from the local binding.
  field(Email, { componentProps: { options: [] } });
  // @ts-expect-error Binding cannot be supplied through control configuration.
  field(Email, { componentProps: { value: "other" } });
  // @ts-expect-error A valid prop must not hide a forbidden binding override.
  field(Email, { componentProps: { type: "email", value: "other" } });
  // @ts-expect-error Replacement props receive the same exact checks.
  field(Email, { component: "input", componentProps: { type: "email", onChange: () => {} } });
  // @ts-expect-error Field bindings are supplied by the form member key.
  field(Email, { label: "Email", name: "other" });
  // @ts-expect-error Required control props cannot be cleared through a partial override.
  ui.field(Supplier, { componentProps: { options: undefined } });
  // @ts-expect-error Missing control names fail at the consuming map boundary.
  field(Currency);
  // @ts-expect-error The replacement must belong to the local map.
  field(Email, { component: "missing" });
  // @ts-expect-error A string field cannot switch to a boolean control.
  field(Email, { component: "checkbox" });
  // @ts-expect-error Replacement controls require their props.
  ui.field(Email, { component: "select" });
  // @ts-expect-error Explicit selection replaces props, including when the key is unchanged.
  ui.field(Supplier, { component: "select" });
  // @ts-expect-error Invalid replacement props cannot be inferred away.
  ui.field(Email, { component: "select", componentProps: { options: [1] } });
  // @ts-expect-error Inline primitive annotations must use the same taxonomy.
  defineForm({ email: { ...Email, primitive: "input" } });
  // @ts-expect-error Direct definition use still checks the local control map.
  defineForm({ currency: Currency });
  // @ts-expect-error A portable definition's invalid UI is checked on consumption.
  field(defineField({ ...Email, component: "checkbox" }));
  // @ts-expect-error Required props are not silently supplied by a reusable definition.
  ui.field(defineField({ primitive: "choice", schema: z.string(), defaultValue: "", label: "Missing options", component: "select" }));
  void count; void amount; void from; void primitive;
}
