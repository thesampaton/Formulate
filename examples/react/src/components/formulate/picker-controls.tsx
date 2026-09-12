import { cn } from "cn";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { defineFieldControl, useCompoundFieldBinding } from "@/lib/formulate";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { PickerContent } from "./picker-content";

type PickerProps = {
  className?: string;
  contentClassName?: string;
  placeholder?: string;
};
/** Dates remain Dates while editing. Partial ranges are valid editor states. */
export type DateRangeValue = { from: Date | null; to: Date | null };
export const DateRangeControl = defineFieldControl<DateRangeValue>()(function DateRangeControl({
  className, contentClassName, placeholder = "Choose dates",
}: PickerProps) {
  const field = useCompoundFieldBinding<DateRangeValue>();
  const valueId = `${field.triggerProps.id}-value`;
  const label = field.value?.from
    ? `${field.value.from.toLocaleDateString()} – ${field.value.to?.toLocaleDateString() ?? "…"}`
    : placeholder;
  return <Popover open={field.open} onOpenChange={field.onOpenChange}>
    <PopoverTrigger render={<Button variant="outline" type="button" />} {...field.triggerProps} aria-labelledby={`${field.triggerProps.id}-label ${valueId}`} className={cn("w-full justify-start font-normal", className)}>
        <CalendarIcon aria-hidden="true" /><span id={valueId}>{label}</span>
    </PopoverTrigger>
    <PickerContent container={field.portalContainer} {...field.contentProps} finalFocus={field.canRestoreFocus} align="start" className={cn("w-auto p-0", contentClassName)}>
      <Calendar mode="range" selected={field.value.from ? { from: field.value.from, to: field.value.to ?? undefined } : undefined}
        onSelect={(range) => field.onChange({ from: range?.from ?? null, to: range?.to ?? null })}
        defaultMonth={field.value.from ?? undefined} autoFocus disabled={field.disabled} />
      <div className="flex justify-between gap-2 border-t p-3">
        <Button type="button" variant="ghost" size="sm" disabled={field.disabled} onClick={() => field.onChange({ from: null, to: null })}>Clear dates</Button>
        <Button type="button" size="sm" onClick={() => field.onOpenChange(false)}>Done</Button>
      </div>
    </PickerContent>
  </Popover>;
});

export type MultiSelectControlProps = PickerProps & {
  options: readonly { value: string; label: string; disabled?: boolean }[];
};
export const MultiSelectControl = defineFieldControl<string[]>()(function MultiSelectControl({
  options, className, contentClassName, placeholder = "Choose options",
}: MultiSelectControlProps) {
  const field = useCompoundFieldBinding<string[]>();
  const valueId = `${field.triggerProps.id}-value`;
  const selected = new Set(field.value);
  return <Popover open={field.open} onOpenChange={field.onOpenChange}>
    <PopoverTrigger render={<Button type="button" variant="outline" />} {...field.triggerProps} aria-labelledby={`${field.triggerProps.id}-label ${valueId}`} className={cn("w-full justify-between font-normal", className)}>
        <span id={valueId} className="truncate">{field.value.length ? field.value.map((value) => options.find((option) => option.value === value)?.label ?? value).join(", ") : placeholder}</span>
        <ChevronDownIcon aria-hidden="true" />
    </PopoverTrigger>
    <PickerContent container={field.portalContainer} {...field.contentProps} finalFocus={field.canRestoreFocus} align="start" className={cn("w-72 space-y-3", contentClassName)}>
      <div role="group" aria-labelledby={field.contentProps["aria-labelledby"]} className="space-y-3">
        {options.map((option, index) => {
          const id = `${field.triggerProps.id}-option-${index}`;
          return <div key={option.value} className="flex items-center gap-2">
            <Checkbox id={id} checked={selected.has(option.value)} disabled={field.disabled || option.disabled}
              aria-invalid={field.triggerProps["aria-invalid"]} aria-describedby={field.triggerProps["aria-describedby"]}
              onCheckedChange={(checked) => field.onChange(checked === true
                ? [...field.value.filter((value) => value !== option.value), option.value]
                : field.value.filter((value) => value !== option.value))} />
            <Label htmlFor={id}>{option.label}</Label>
          </div>;
        })}
      </div>
      <div className="flex justify-between gap-2 border-t pt-3">
        <Button type="button" variant="ghost" size="sm" disabled={field.disabled} onClick={() => field.onChange([])}>Clear selection</Button>
        <Button type="button" size="sm" onClick={() => field.onOpenChange(false)}>Done</Button>
      </div>
    </PickerContent>
  </Popover>;
});
