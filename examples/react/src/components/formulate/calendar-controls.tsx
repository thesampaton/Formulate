import type { ComponentProps } from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "cn";
import { defineFieldControl, useCompoundFieldBinding, useFieldBinding } from "@/lib/formulate";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { PickerContent } from "./picker-content";
import { blurOutside } from "./control-utils";

export type CalendarControlProps = Pick<ComponentProps<typeof Calendar>,
  "className" | "defaultMonth" | "startMonth" | "endMonth" | "locale" | "weekStartsOn" | "captionLayout" | "showOutsideDays" | "numberOfMonths"
> & { disabledDates?: ComponentProps<typeof Calendar>["disabled"] };

function BoundCalendarDay(props: ComponentProps<typeof CalendarDayButton>) {
  const field = useFieldBinding<Date | null>();
  return <CalendarDayButton {...props} id={props.tabIndex === 0 ? field.id : undefined}
    aria-invalid={field["aria-invalid"]} aria-describedby={field["aria-describedby"]} />;
}
const calendarComponents = { DayButton: BoundCalendarDay };

export const CalendarControl = defineFieldControl<Date | null>()(function CalendarControl({ disabledDates, ...props }: CalendarControlProps) {
  const field = useFieldBinding<Date | null>();
  if (field.value !== null && !(field.value instanceof Date)) throw new Error(`Field "${field.name}": CalendarControl requires Date or null.`);
  return <fieldset ref={field.ref} disabled={field.disabled} tabIndex={-1} aria-labelledby={`${field.id}-label`}
    onFocus={(event) => {
      // Resolve the current day even after calendar-owned month navigation.
      if (event.target === event.currentTarget) event.currentTarget.querySelector<HTMLButtonElement>('button[tabindex="0"]:not([disabled])')?.focus();
    }}
    aria-describedby={field["aria-describedby"]} aria-invalid={field["aria-invalid"]} onBlur={(event) => blurOutside(event, field.onBlur)}>
    <Calendar {...props} mode="single" selected={field.value ?? undefined} onSelect={(date) => field.onChange(date ?? null)}
      defaultMonth={props.defaultMonth ?? field.value ?? undefined} disabled={field.disabled || disabledDates} components={calendarComponents} />
  </fieldset>;
});

export type DatePickerControlProps = CalendarControlProps & { placeholder?: string; contentClassName?: string; calendarClassName?: string };
export const DatePickerControl = defineFieldControl<Date | null>()(function DatePickerControl({
  className, contentClassName, calendarClassName, placeholder = "Choose a date", disabledDates, ...props
}: DatePickerControlProps) {
  const field = useCompoundFieldBinding<Date | null>();
  if (field.value !== null && !(field.value instanceof Date)) throw new Error(`Field "${field.triggerProps.name}": DatePickerControl requires Date or null.`);
  const valueId = `${field.triggerProps.id}-value`;
  return <Popover open={field.open} onOpenChange={field.onOpenChange}>
    <PopoverTrigger render={<Button type="button" variant="outline" />} {...field.triggerProps} aria-labelledby={`${field.triggerProps.id}-label ${valueId}`}
        className={cn("w-full justify-start font-normal", className)}>
        <CalendarIcon aria-hidden="true" /><span id={valueId}>{field.value?.toLocaleDateString() ?? placeholder}</span>
    </PopoverTrigger>
    <PickerContent container={field.portalContainer} {...field.contentProps} finalFocus={field.canRestoreFocus} align="start" className={cn("w-auto p-0", contentClassName)}>
      <Calendar {...props} className={calendarClassName} mode="single" selected={field.value ?? undefined} autoFocus
        defaultMonth={props.defaultMonth ?? field.value ?? undefined} disabled={field.disabled || disabledDates}
        onSelect={(date) => { field.onChange(date ?? null); field.onOpenChange(false); }} />
      <div className="border-t p-3">
        <Button type="button" variant="ghost" size="sm" disabled={field.disabled} onClick={() => { field.onChange(null); field.onOpenChange(false); }}>Clear date</Button>
      </div>
    </PickerContent>
  </Popover>;
});
