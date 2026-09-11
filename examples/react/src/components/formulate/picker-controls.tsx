import type { ComponentProps } from "react";
import { cn } from "cn";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { defineFieldControl, useCompoundFieldBinding } from "@/lib/formulate";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Current shadcn Content owns its Portal internally. Use the underlying primitive
// only for an explicit destination; consumers do not need to patch installed UI.
function PickerContent({ container, ...props }: ComponentProps<typeof PopoverContent> & { container?: HTMLElement | null }) {
  if (container === undefined) return <PopoverContent {...props} />;
  // A null destination is still mounting; never temporarily escape a modal/theme.
  if (container === null) return null;
  return <PopoverPrimitive.Portal container={container}>
    <PopoverPrimitive.Content {...props} data-slot="popover-content" sideOffset={4}
      className={cn("z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none", props.className)} />
  </PopoverPrimitive.Portal>;
}

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
    <PopoverTrigger asChild>
      <Button variant="outline" type="button" {...field.triggerProps} aria-labelledby={`${field.triggerProps.id}-label ${valueId}`} className={cn("w-full justify-start font-normal", className)}>
        <CalendarIcon aria-hidden="true" /><span id={valueId}>{label}</span>
      </Button>
    </PopoverTrigger>
    <PickerContent container={field.portalContainer} {...field.contentProps} align="start" className={cn("w-auto p-0", contentClassName)}>
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
    <PopoverTrigger asChild>
      <Button type="button" variant="outline" {...field.triggerProps} aria-labelledby={`${field.triggerProps.id}-label ${valueId}`} className={cn("w-full justify-between font-normal", className)}>
        <span id={valueId} className="truncate">{field.value.length ? field.value.map((value) => options.find((option) => option.value === value)?.label ?? value).join(", ") : placeholder}</span>
        <ChevronDownIcon aria-hidden="true" />
      </Button>
    </PopoverTrigger>
    <PickerContent container={field.portalContainer} {...field.contentProps} align="start" className={cn("w-72 space-y-3", contentClassName)}>
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
