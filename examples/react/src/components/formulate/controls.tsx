import type { ComponentProps } from "react";
import { cn } from "cn";
import { defineFieldControl, useFieldControl } from "@/lib/formulate";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// UI props come from the installed shadcn exports. Formulate reserves binding props.
type BindingProps = "ref" | "id" | "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "disabled" | "aria-invalid" | "aria-describedby";
export type InputControlProps = Omit<ComponentProps<typeof Input>, BindingProps | "type" | "checked" | "defaultChecked"> & {
  type?: "text" | "email" | "password" | "search" | "tel" | "url" | "date";
};
export type NumberControlProps = Omit<InputControlProps, "type">;
export type CheckboxControlProps = Omit<ComponentProps<typeof Checkbox>, BindingProps | "checked" | "defaultChecked" | "onCheckedChange" | "type"> & {
  onValueChange?: (value: boolean) => void;
};
export type SelectControlProps = Omit<ComponentProps<typeof SelectTrigger>, BindingProps | "children" | "type"> & {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  onValueChange?: (value: string) => void;
};

export const InputControl = defineFieldControl<string>()(function InputControl(props: InputControlProps) {
  const field = useFieldControl<string>();
  if (typeof field.value !== "string") throw new Error(`Field "${field.name}": InputControl requires a string editing value.`);
  return <Input type="text" {...props} {...field} onChange={(event) => field.onChange(event.target.value)} />;
});

export const NumberControl = defineFieldControl<number>()(function NumberControl(props: NumberControlProps) {
  const field = useFieldControl<number>();
  if (typeof field.value !== "number") throw new Error(`Field "${field.name}": NumberControl requires a number editing value.`);
  return <Input {...props} {...field} type="number" value={Number.isNaN(field.value) ? "" : field.value}
    onChange={(event) => field.onChange(event.target.valueAsNumber)} />;
});

export const CheckboxControl = defineFieldControl<boolean>()(function CheckboxControl({ onValueChange, ...props }: CheckboxControlProps) {
  const { value, onChange, ...field } = useFieldControl<boolean>();
  if (typeof value !== "boolean") throw new Error(`Field "${field.name}": CheckboxControl requires a boolean editing value.`);
  return <Checkbox {...props} {...field} checked={value} onCheckedChange={(checked) => {
    const next = checked === true;
    onChange(next);
    onValueChange?.(next);
  }} />;
});

export const SelectControl = defineFieldControl<string>()(function SelectControl({ options, placeholder, onValueChange, ...props }: SelectControlProps) {
  const { value, onChange, name, disabled, ...trigger } = useFieldControl<string>();
  if (typeof value !== "string") throw new Error(`Field "${name}": SelectControl requires a string editing value.`);
  return <Select name={name} disabled={disabled} value={value} onValueChange={(next) => {
    // Radix items cannot be empty. Its native form bridge can emit an empty
    // change as Activity reconnects effects; clearing is owned by RHF setValue/reset.
    if (next === "") return;
    onChange(next);
    onValueChange?.(next);
  }}>
    <SelectTrigger {...props} {...trigger} className={cn("w-full", props.className)}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
    </SelectContent>
  </Select>;
});
