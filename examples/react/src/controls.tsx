import {
  CheckboxControl as BaseCheckboxControl,
  InputControl as BaseInputControl,
  NumberControl as BaseNumberControl,
  defineFieldControl,
  useFieldControl,
} from "@formulate/react";
import type { CheckboxControlProps, InputControlProps, NumberControlProps } from "@formulate/react";
import { twMerge } from "tailwind-merge";

// Application-owned presentation defaults. A local shadcn control can occupy
// this same boundary, including its usual className merging.
const inputClasses = "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50";

export const InputControl = defineFieldControl<string>()(function InputControl({ className, ...props }: InputControlProps) {
  return <BaseInputControl {...props} className={twMerge(inputClasses, className)} />;
});

export const NumberControl = defineFieldControl<number>()(function NumberControl({ className, ...props }: NumberControlProps) {
  return <BaseNumberControl {...props} className={twMerge(inputClasses, "h-11", className)} />;
});

export const CheckboxControl = defineFieldControl<boolean>()(function CheckboxControl({ className, ...props }: CheckboxControlProps) {
  return <BaseCheckboxControl {...props} className={twMerge(
    "col-start-1 row-start-1 m-0 size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",
    className,
  )} />;
});

export const SelectControl = defineFieldControl<string>()(function SelectControl({ options, onValueChange }: {
  options: readonly { value: string; label: string }[];
  onValueChange?: (value: string) => void;
}) {
  const field = useFieldControl<string>();
  if (typeof field.value !== "string") throw new Error(`Field "${field.name}": SelectControl requires a string editing value.`);
  return <select {...field} className={inputClasses} onChange={(event) => {
    field.onChange(event.target.value);
    onValueChange?.(event.target.value);
  }}>{options.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>;
});

export const PolicyCheckboxControl = defineFieldControl<boolean>()(function PolicyCheckboxControl({ onValueChange }: {
  onValueChange: (value: boolean) => void;
}) {
  const { value, onChange, ...field } = useFieldControl<boolean>();
  if (typeof value !== "boolean") throw new Error(`Field "${field.name}": PolicyCheckboxControl requires a boolean editing value.`);
  return <input {...field} type="checkbox" checked={value} className="col-start-1 row-start-1 m-0 size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50" onChange={(event) => {
    onChange(event.target.checked);
    onValueChange(event.target.checked);
  }} />;
});
