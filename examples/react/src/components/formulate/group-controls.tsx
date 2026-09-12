import { useLayoutEffect, useRef } from "react";
import type { ComponentProps } from "react";
import { cn } from "cn";
import { defineFieldControl, useFieldBinding } from "@/lib/formulate";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { blurOutside } from "./control-utils";
import type { ControlOption } from "./control-utils";

export type RadioGroupControlProps = Pick<ComponentProps<typeof RadioGroup>, "required" | "readOnly"> & {
  className?: string;
  orientation?: "horizontal" | "vertical";
  options: readonly ControlOption[];
  itemClassName?: string;
};
export const RadioGroupControl = defineFieldControl<string>()(function RadioGroupControl({ options, itemClassName, orientation = "vertical", className, ...props }: RadioGroupControlProps) {
  const field = useFieldBinding<string>();
  if (typeof field.value !== "string") throw new Error(`Field "${field.name}": RadioGroupControl requires a string editing value.`);
  const selected = options.findIndex((option) => option.value === field.value && !option.disabled);
  const primary = selected >= 0 ? selected : options.findIndex((option) => !option.disabled);
  return <RadioGroup {...props} name={field.name} value={field.value} onValueChange={field.onChange} disabled={field.disabled}
    aria-orientation={orientation} className={cn(orientation === "horizontal" && "flex flex-wrap gap-4", className)}
    aria-labelledby={`${field.id}-label`} aria-describedby={field["aria-describedby"]} aria-invalid={field["aria-invalid"]}
    onBlur={(event) => blurOutside(event, field.onBlur)}>
    {options.map((option, index) => {
      const id = index === primary ? field.id : `${field.id}-${index}`;
      const labelId = `${field.id}-option-${index}-label`;
      return <div key={option.value} className="flex items-center gap-2">
        <RadioGroupItem id={id} ref={index === primary ? field.ref : undefined} value={option.value} disabled={option.disabled}
          aria-labelledby={labelId} aria-invalid={field["aria-invalid"]} aria-describedby={field["aria-describedby"]} className={itemClassName} />
        <Label id={labelId} htmlFor={id}>{option.label}</Label>
      </div>;
    })}
  </RadioGroup>;
});

export type ToggleGroupControlProps = Pick<ComponentProps<typeof ToggleGroup>, "orientation" | "variant" | "size" | "spacing"> & {
  className?: string;
  loop?: boolean;
  options: readonly ControlOption[];
  itemClassName?: string;
};
function ToggleItems({ options, itemClassName }: Pick<ToggleGroupControlProps, "options" | "itemClassName">) {
  const field = useFieldBinding<string | string[]>();
  const values = Array.isArray(field.value) ? field.value : [field.value];
  const selected = options.findIndex((option) => values.includes(option.value) && !option.disabled);
  const primary = selected >= 0 ? selected : options.findIndex((option) => !option.disabled);
  return options.map((option, index) => <ToggleGroupItem key={option.value} value={option.value} disabled={option.disabled}
    id={index === primary ? field.id : `${field.id}-${index}`} ref={index === primary ? field.ref : undefined}
    aria-label={option.label} aria-invalid={field["aria-invalid"]} aria-describedby={field["aria-describedby"]} className={itemClassName}>
    {option.label}
  </ToggleGroupItem>);
}
export const ToggleGroupControl = defineFieldControl<string>()(function ToggleGroupControl({ options, itemClassName, loop = true, ...props }: ToggleGroupControlProps) {
  const field = useFieldBinding<string>();
  if (typeof field.value !== "string") throw new Error(`Field "${field.name}": ToggleGroupControl requires a string editing value.`);
  return <ToggleGroup {...props} multiple={false} loopFocus={loop} value={field.value ? [field.value] : []}
    onValueChange={(values) => field.onChange(values[0] ?? "")} disabled={field.disabled}
    aria-labelledby={`${field.id}-label`} onBlur={(event) => blurOutside(event, field.onBlur)}>
    <ToggleItems options={options} itemClassName={itemClassName} />
  </ToggleGroup>;
});
export const MultiToggleGroupControl = defineFieldControl<string[]>()(function MultiToggleGroupControl({ options, itemClassName, loop = true, ...props }: ToggleGroupControlProps) {
  const field = useFieldBinding<string[]>();
  if (!Array.isArray(field.value) || field.value.some((value) => typeof value !== "string")) throw new Error(`Field "${field.name}": MultiToggleGroupControl requires a string array editing value.`);
  return <ToggleGroup {...props} multiple loopFocus={loop} value={field.value} onValueChange={field.onChange} disabled={field.disabled}
    aria-labelledby={`${field.id}-label`} onBlur={(event) => blurOutside(event, field.onBlur)}>
    <ToggleItems options={options} itemClassName={itemClassName} />
  </ToggleGroup>;
});

export type SliderControlProps = Pick<ComponentProps<typeof Slider>, "min" | "max" | "step" | "orientation"> & { className?: string };
export const SliderControl = defineFieldControl<number>()(function SliderControl(props: SliderControlProps) {
  const field = useFieldBinding<number>();
  const root = useRef<HTMLDivElement | null>(null);
  const { id, ref, disabled, "aria-invalid": invalid, "aria-describedby": describedBy } = field;
  // shadcn exposes only the Slider root. Base UI puts keyboard focus on the
  // thumb's native range input; this lookup stays inside the local adapter.
  useLayoutEffect(() => {
    const thumb = root.current?.querySelector<HTMLInputElement>('input[type="range"]');
    if (!thumb) return;
    const attributes = { id, "aria-describedby": describedBy, "aria-invalid": invalid ? "true" : undefined };
    const previous = Object.keys(attributes).map((name) => [name, thumb.getAttribute(name)] as const);
    for (const [name, value] of Object.entries(attributes)) {
      if (value === undefined) thumb.removeAttribute(name); else thumb.setAttribute(name, value);
    }
    ref(thumb);
    return () => {
      for (const [name, value] of previous) {
        if (value === null) thumb.removeAttribute(name); else thumb.setAttribute(name, value);
      }
      ref(null);
    };
  }, [id, ref, disabled, invalid, describedBy]);
  if (!Number.isFinite(field.value)) throw new Error(`Field "${field.name}": SliderControl requires a finite number editing value.`);
  return <Slider {...props} ref={root} name={field.name} disabled={field.disabled} value={[field.value]}
    aria-labelledby={`${field.id}-label`}
    onValueChange={(value) => { field.onChange(typeof value === "number" ? value : value[0]!); }} onBlur={(event) => blurOutside(event, field.onBlur)} />;
});
