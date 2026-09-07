// Compile-time API checks, included in pnpm typecheck; never rendered.
import { createFormulate, defaultComponents, defineFieldControl, Field, useFieldControl } from "@formulate/react";
import type { Control } from "react-hook-form";

const Choice = defineFieldControl<string>()(function Choice({ options }: { options: string[] }) {
  const field = useFieldControl<string>();
  return <select {...field} onChange={(event) => field.onChange(event.target.value)}>{options.map((value) => <option key={value}>{value}</option>)}</select>;
});
const custom = createFormulate({ components: { ...defaultComponents, choice: Choice } });

export function checkFieldTypes(control: Control<{ email: string; enabled: boolean; count: number }, unknown>) {
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
