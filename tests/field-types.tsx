// Compile-time API checks, included in pnpm typecheck; never rendered.
import { createFormulate, defaultComponents, defineFieldControl, defineForm, defineSection, Field, useFieldControl, useFormulate, useFormNavigation } from "@formulate/react";
import type { FormNavigationAction } from "@formulate/react";
import type { Control } from "react-hook-form";
import { z } from "zod";
import { Email } from "../examples/react/src/declarations/email";
import { EmailConfirmation } from "../examples/react/src/declarations/email-confirmation";
import { nestedEmailConfirmationSchema } from "./fixtures/nested-email-confirmation";
import { Address } from "../examples/react/src/declarations/address";
import type { SectionBindings } from "@formulate/react";
import type { AddressValues } from "../examples/react/src/declarations/address";
import { customerSchema } from "../examples/react/src/declarations/customer";
import type { CustomerValues } from "../examples/react/src/declarations/customer";

const Choice = defineFieldControl<string>()(function Choice({ options }: { options: string[] }) {
  const field = useFieldControl<string>();
  return <select {...field} onChange={(event) => field.onChange(event.target.value)}>{options.map((value) => <option key={value}>{value}</option>)}</select>;
});
const custom = createFormulate({ components: { ...defaultComponents, choice: Choice } });

export function checkFieldTypes(control: Control<{ email: string; enabled: boolean; count: number }, unknown>) {
  <Field name="email" label="Email" component="input" />;
  <Field control={control} name="email" label="Email" component="input" componentProps={{ type: "email" }} />;
  <custom.Field control={control} name="email" label="Email" component="choice" componentProps={{ options: ["a", "b"] }} />;
  // @ts-expect-error Unknown component keys must fail.
  <Field control={control} name="email" label="Email" component="missing" />;
  // @ts-expect-error A boolean control cannot edit a string field.
  <Field control={control} name="email" label="Email" component="checkbox" />;
  // @ts-expect-error A number field cannot use the text input editing contract.
  <Field control={control} name="count" label="Count" component="input" />;
  // @ts-expect-error Required adapter props must be supplied.
  <custom.Field control={control} name="email" label="Email" component="choice" />;
  // @ts-expect-error Component props must match the selected adapter.
  <Field control={control} name="email" label="Email" component="input" componentProps={{ options: [] }} />;
  // @ts-expect-error Binding cannot be overridden through presentation props.
  <Field control={control} name="email" label="Email" component="input" componentProps={{ value: "other" }} />;
  // @ts-expect-error Use either the map or child composition.
  <Field control={control} name="email" label="Email" component="input"><span /></Field>;
  // @ts-expect-error Field names must belong to this form.
  <Field control={control} name="missing" label="Missing" component="input" />;
}

const Details = defineForm({
  email: { schema: z.email(), defaultValue: "", label: "Email", component: "input", componentProps: { type: "email" } },
  count: { schema: z.string().transform(Number), defaultValue: "0", label: "Count", component: "input" },
});

export function DefinitionTypes() {
  const form = Details.useForm({ defaultValues: { email: "person@example.com" } });
  const explicit = useFormulate(Details, { defaultValues: { email: "person@example.com" } });
  const explicitCount: string = explicit.getValues("count");
  const email: string = form.getValues("email");
  const editingCount: string = form.getValues("count");
  form.handleSubmit((values) => {
    const parsedCount: number = values.count;
    return Promise.resolve(parsedCount);
  });
  <Details.Field name="email" componentProps={{ autoComplete: "email" }} />;
  <Details.Fields />;
  // @ts-expect-error Typed definitions check field names even without explicit control.
  <Details.Field name="missing" />;
  // @ts-expect-error Per-use props belong to the declared control.
  <Details.Field name="email" componentProps={{ options: [] }} />;
  // @ts-expect-error A definition does not permit presentation-time binding changes.
  <Details.Field name="email" componentProps={{ name: "count" }} />;
  // @ts-expect-error Defaults use the editing type, not the parsed output type.
  defineForm({ count: { schema: z.string().transform(Number), defaultValue: 0, label: "Count", component: "input" } });
  // @ts-expect-error Component contracts must match the schema editing type.
  defineForm({ enabled: { schema: z.boolean(), defaultValue: false, label: "Enabled", component: "input" } });
  // @ts-expect-error Components are checked against the configured catalogue.
  defineForm({ email: { schema: z.string(), defaultValue: "", label: "Email", component: "missing" } });
  // @ts-expect-error Controls with required props must receive them in the declaration.
  custom.defineForm({ choice: { schema: z.string(), defaultValue: "", label: "Choice", component: "choice" } });
  custom.defineForm({ choice: { schema: z.string(), defaultValue: "a", label: "Choice", component: "choice", componentProps: { options: ["a", "b"] } } });
  // @ts-expect-error Every possible editing value must be supported, including undefined.
  defineForm({ email: { schema: z.string().optional(), defaultValue: undefined, label: "Email", component: "input" } });
  // @ts-expect-error Prefills must use editing types, even when output is numeric.
  Details.useForm({ defaultValues: { count: 2 } });
  // @ts-expect-error The definition-bound hook checks prefill keys.
  Details.useForm({ defaultValues: { missing: "value" } });
  return <p>{email}{editingCount}{explicitCount}</p>;
}

export function PressureTestTypes() {
  const flat = EmailConfirmation.useForm();
  const nested = useFormulate(nestedEmailConfirmationSchema);
  <EmailConfirmation.Field control={flat.control} name="confirmEmail" componentProps={{ autoComplete: "off" }} />;
  <Field control={nested.control} name="contact.email" label={Email.label} component={Email.component} componentProps={Email.componentProps} />;
  flat.handleSubmit((values) => { const email: string = values.confirmEmail; void email; });
  nested.handleSubmit((values) => { const email: string = values.contact.email; void email; });
  // @ts-expect-error Reuse still validates the editing default against the email schema.
  defineForm({ email: { ...Email, defaultValue: false } });
  // @ts-expect-error Reuse still validates the control's editing contract.
  defineForm({ email: { ...Email, component: "checkbox" } });
  // @ts-expect-error Explicit bindings check the nested path.
  <Field control={nested.control} name="contact.missing" label="Email" component="input" />;
  // @ts-expect-error Explicit bindings check the nested editing type.
  <Field control={nested.control} name="contact.email" label="Email" component="number" />;
  // @ts-expect-error Refining a definition does not remove editing-type checks.
  EmailConfirmation.useForm({ defaultValues: { confirmEmail: 4 } });
  return null;
}

export function NavigationTypes() {
  const form = Details.useForm();
  type Editing = z.input<typeof Details.schema>;
  const navigation = useFormNavigation<Editing, "details" | "review">({
    form, initialPage: "details", destinations: [{ name: "email", page: "details" }],
  });
  navigation.goTo("review");
  navigation.goToField("email");
  const action: FormNavigationAction<Editing> = {
    id: navigation.revision, fields: ["email", "count"], onValid: () => navigation.goTo("review"),
  };
  // @ts-expect-error Host page names remain typed.
  navigation.goTo("missing");
  // @ts-expect-error Editor destinations use editing paths.
  navigation.goToField("missing");
  // @ts-expect-error Scopes cannot reference unknown paths.
  const wrongScope: FormNavigationAction<Editing> = { ...action, fields: ["missing"] };
  // @ts-expect-error A scoped action cannot claim to receive validated form output.
  const wrongHandler: FormNavigationAction<Editing> = { ...action, onValid: (values: z.output<typeof Details.schema>) => { void values; } };
  void wrongScope; void wrongHandler;
  return null;
}
export function CustomerTypes() {
  const form = useFormulate(customerSchema);
  const billingBindings = { street: "billingAddress.street", countryCode: "billingAddress.countryCode", postcode: "billingAddress.postcode" } as const;
  <Address.Bind control={form.control} bindings={billingBindings} title="Billing" />;
  // Reuse also accepts unrelated, flat caller paths.
  const flat = useFormulate(z.object({ street: z.string(), country: z.string(), postal: z.string() }));
  <Address.Bind control={flat.control} bindings={{ street: "street", countryCode: "country", postcode: "postal" }} title="Address" />;
  // @ts-expect-error Reusable group members cannot bind to a boolean editor.
  const wrongType: SectionBindings<AddressValues, CustomerValues> = { ...billingBindings, street: "deliverySameAsBilling" };
  // @ts-expect-error Reusable group members must name existing editing paths.
  const wrongPath: SectionBindings<AddressValues, CustomerValues> = { ...billingBindings, postcode: "billingAddress.missing" };
  form.handleSubmit((payload) => {
    const country: "AU" | "US" = payload.deliveryAddress.countryCode;
    // @ts-expect-error Parsed payload excludes the applicability toggle.
    payload.deliverySameAsBilling;
    void country;
  });
  void wrongType; void wrongPath;
  return null;
}

const TypedAddress = defineSection({
  street: { schema: z.string(), defaultValue: "", label: "Street", component: "input" },
  visits: { schema: z.string().transform(Number), defaultValue: "0", label: "Visits", component: "input" },
});
const TypedDetails = defineSection({ address: TypedAddress });
const TypedCustomer = defineForm({ details: TypedDetails, enabled: { schema: z.boolean(), defaultValue: false, label: "Enabled", component: "checkbox" } }, {
  schema: (schema) => schema.transform(({ details }) => ({ saved: details })),
});

export function SectionTypes() {
  const form = TypedCustomer.useForm();
  <TypedCustomer.Form form={form} layout={null} onSubmit={(values) => {
    const visits: number = values.saved.address.visits;
    // @ts-expect-error The definition's Form also exposes only parsed output.
    values.enabled;
    void visits;
  }} />;
  // @ts-expect-error Layouts are components, not string registry keys.
  <TypedCustomer.Form form={form} onSubmit={() => undefined} layout="stack" />;
  // @ts-expect-error A layout must work with children alone.
  <TypedCustomer.Section name="details" layout={(_: { required: string }) => null} />;
  <TypedCustomer.Section name="details"><TypedDetails.Subsection name="address"><TypedAddress.Field name="street" /></TypedDetails.Subsection></TypedCustomer.Section>;
  // @ts-expect-error Sections are not single writable fields.
  <TypedCustomer.Field name="details" />;
  // @ts-expect-error A scalar field is not a section.
  <TypedCustomer.Section name="enabled" />;
  // @ts-expect-error A section member inherits its runtime at the section boundary.
  <TypedAddress.Field name="street" control={form.control} />;
  // @ts-expect-error Local field names remain typed.
  <TypedAddress.Field name="missing" />;
  // @ts-expect-error Local field controls retain their editing props.
  <TypedAddress.Field name="street" componentProps={{ options: ["x"] }} />;
  // @ts-expect-error Local references cannot use host paths.
  TypedAddress.useWatch("details.address.street");
  // @ts-expect-error Checks use existing local paths.
  TypedAddress.useTrigger()("missing");
  // @ts-expect-error Nested defaults use editing types, not parsed numbers.
  TypedCustomer.useForm({ defaultValues: { details: { address: { visits: 2 } } } });
  // @ts-expect-error Schema customization must preserve the editing shape.
  defineForm({ name: { schema: z.string(), defaultValue: "", label: "Name", component: "input" } }, { schema: () => z.object({ other: z.string() }) });
  form.handleSubmit((values) => {
    const visits: number = values.saved.address.visits;
    // @ts-expect-error The customized output omits editing-only fields.
    values.enabled;
    void visits;
  });
  const host = useFormulate(z.object({ narrow: z.literal("fixed"), street: z.string(), count: z.number() }));
  // @ts-expect-error A general string editor cannot write to a literal-only host binding.
  <TypedAddress.Bind control={host.control} bindings={{ street: "narrow", visits: "street" }} />;
  // @ts-expect-error Binding uses editing string, not transformed number.
  <TypedAddress.Bind control={host.control} bindings={{ street: "street", visits: "count" }} />;
  return null;
}
