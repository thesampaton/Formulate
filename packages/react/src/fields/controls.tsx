"use client";

import type { ComponentPropsWithoutRef, ComponentType } from "react";
import { useFieldControl } from "./field-context.js";

// A type-only marker retains the editing contract through a heterogeneous map.
declare const editingValue: unique symbol;
export type FieldControlComponent<Value, Props extends object> = ComponentType<Props> & {
  readonly [editingValue]: Value;
};
export type ControlValue<Component> = Component extends { readonly [editingValue]: infer Value } ? Value : never;

/** Declare a connected component's editing contract once, alongside its UI. */
export function defineFieldControl<Value>() {
  return function define<Props extends object>(component: ComponentType<Props>) {
    return component as FieldControlComponent<Value, Props>;
  };
}

// These props belong to the binding and cannot be replaced through configuration.
type NativeControlProps = Omit<ComponentPropsWithoutRef<"input">,
  "value" | "defaultValue" | "checked" | "defaultChecked" | "name" | "id" |
  "onChange" | "onBlur" | "disabled" | "aria-invalid" | "aria-describedby" | "type"
>;
export type InputControlProps = NativeControlProps & {
  type?: "text" | "email" | "password" | "search" | "tel" | "url";
};
export type NumberControlProps = NativeControlProps;
export type CheckboxControlProps = NativeControlProps;

export const InputControl = defineFieldControl<string>()(function InputControl(props: InputControlProps) {
  const field = useFieldControl<string>();
  if (typeof field.value !== "string") throw new Error(`Field "${field.name}": InputControl requires a string editing value.`);
  return <input type="text" {...props} {...field} onChange={(event) => field.onChange(event.target.value)} />;
});

export const NumberControl = defineFieldControl<number>()(function NumberControl(props: NumberControlProps) {
  const field = useFieldControl<number>();
  if (typeof field.value !== "number") throw new Error(`Field "${field.name}": NumberControl requires a number editing value.`);
  return <input {...props} {...field} type="number" value={Number.isNaN(field.value) ? "" : field.value}
    onChange={(event) => field.onChange(event.target.valueAsNumber)} />;
});

export const CheckboxControl = defineFieldControl<boolean>()(function CheckboxControl(props: CheckboxControlProps) {
  const { value, onChange, ...field } = useFieldControl<boolean>();
  if (typeof value !== "boolean") throw new Error(`Field "${field.name}": CheckboxControl requires a boolean editing value.`);
  return <input {...props} {...field} type="checkbox" checked={value}
    onChange={(event) => onChange(event.target.checked)} />;
});
