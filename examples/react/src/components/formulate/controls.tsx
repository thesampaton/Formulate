import type { ComponentProps } from "react";
import { cn } from "cn";
import { defineFieldControl, useCompoundFieldBinding, useFieldBinding } from "@/lib/formulate";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import type { BindingProps, ControlOption } from "./control-utils";

// UI props come from the installed shadcn exports. Formulate reserves binding props.
export type InputControlProps = Omit<ComponentProps<typeof Input>, BindingProps | "type" | "checked" | "defaultChecked"> & {
  type?: "text" | "email" | "password" | "search" | "tel" | "url" | "date" | "time" | "datetime-local";
};
export type NumberControlProps = Omit<InputControlProps, "type">;
export type CheckboxControlProps = Pick<ComponentProps<typeof Checkbox>, "required" | "readOnly"> & {
  className?: string;
  onValueChange?: (value: boolean) => void;
};
export type SelectControlProps = Pick<ComponentProps<typeof SelectTrigger>, "size"> & {
  className?: string;
  options: readonly ControlOption[];
  placeholder?: string;
  onValueChange?: (value: string) => void;
};

export const InputControl = defineFieldControl<string>()(function InputControl(props: InputControlProps) {
  const field = useFieldBinding<string>();
  if (typeof field.value !== "string") {
    throw new Error(`Field "${field.name}": InputControl requires a string editing value.`);
  }
  return <Input type="text" {...props} {...field} onChange={(event) => field.onChange(event.target.value)} />;
});

export const NumberControl = defineFieldControl<number>()(function NumberControl(props: NumberControlProps) {
  const field = useFieldBinding<number>();
  if (typeof field.value !== "number") {
    throw new Error(`Field "${field.name}": NumberControl requires a number editing value.`);
  }
  return <Input {...props} {...field} type="number" value={Number.isNaN(field.value) ? "" : field.value}
    onChange={(event) => field.onChange(event.target.valueAsNumber)} />;
});

export const CheckboxControl = defineFieldControl<boolean>()(function CheckboxControl({ onValueChange, ...props }: CheckboxControlProps) {
  const { value, onChange, ...field } = useFieldBinding<boolean>();
  if (typeof value !== "boolean") {
    throw new Error(`Field "${field.name}": CheckboxControl requires a boolean editing value.`);
  }
  return <Checkbox {...props} {...field} checked={value} onCheckedChange={(checked) => {
    const next = checked === true;
    onChange(next);
    onValueChange?.(next);
  }} />;
});

export const SelectControl = defineFieldControl<string>()(function SelectControl({ options, placeholder, onValueChange, ...props }: SelectControlProps) {
  const field = useCompoundFieldBinding<string>();
  const { name, ...trigger } = field.triggerProps;
  if (typeof field.value !== "string") {
    throw new Error(`Field "${name}": SelectControl requires a string editing value.`);
  }
  return <Select name={name} disabled={field.disabled} value={field.value || null} items={options}
    open={field.open} onOpenChange={field.onOpenChange} onValueChange={(next) => {
    const value = next ?? "";
    field.onChange(value);
    onValueChange?.(value);
  }}>
    <SelectTrigger {...props} {...trigger} className={cn("w-full", props.className)}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent {...field.contentProps} finalFocus={field.canRestoreFocus}>
      {options.map(({ value, label, disabled }) => <SelectItem key={value} value={value} disabled={disabled}>{label}</SelectItem>)}
    </SelectContent>
  </Select>;
});

export type TextareaControlProps = Omit<ComponentProps<typeof Textarea>, BindingProps>;
export const TextareaControl = defineFieldControl<string>()(function TextareaControl(props: TextareaControlProps) {
  const field = useFieldBinding<string>();
  if (typeof field.value !== "string") throw new Error(`Field "${field.name}": TextareaControl requires a string editing value.`);
  return <Textarea {...props} {...field} onChange={(event) => field.onChange(event.target.value)} />;
});

export type SwitchControlProps = Pick<ComponentProps<typeof Switch>, "size" | "required" | "readOnly"> & { className?: string };
export const SwitchControl = defineFieldControl<boolean>()(function SwitchControl(props: SwitchControlProps) {
  const { value, onChange, ...field } = useFieldBinding<boolean>();
  if (typeof value !== "boolean") throw new Error(`Field "${field.name}": SwitchControl requires a boolean editing value.`);
  return <Switch {...props} {...field} checked={value} onCheckedChange={onChange} />;
});

export type InputOTPControlProps = Omit<ComponentProps<typeof InputOTP>, BindingProps | "children" | "render" | "maxLength"> & {
  maxLength?: number;
  groupClassName?: string;
  slotClassName?: string;
};
export const InputOTPControl = defineFieldControl<string>()(function InputOTPControl({
  maxLength = 6, groupClassName, slotClassName, ...props
}: InputOTPControlProps) {
  const field = useFieldBinding<string>();
  if (typeof field.value !== "string") throw new Error(`Field "${field.name}": InputOTPControl requires a string editing value.`);
  if (!Number.isInteger(maxLength) || maxLength < 1) throw new Error("InputOTPControl maxLength must be a positive integer.");
  return <InputOTP autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]*" {...props} {...field} maxLength={maxLength}>
    <InputOTPGroup className={groupClassName}>
      {Array.from({ length: maxLength }, (_, index) => <InputOTPSlot key={index} index={index} className={slotClassName} aria-invalid={field["aria-invalid"]} />)}
    </InputOTPGroup>
  </InputOTP>;
});
