import { z } from "zod";
import { createFormulate } from "@/lib/formulate";
import { ShadcnField } from "@/components/formulate/field-presentation";
import { DateRangeControl, MultiSelectControl } from "@/components/formulate/picker-controls";
import { Stack } from "@/components/formulate/layouts";

const { defineForm } = createFormulate({
  fieldPresentation: ShadcnField,
  components: { dateRange: DateRangeControl, multiSelect: MultiSelectControl },
});
const requiredDate = (message: string) => z.date().nullable().refine((date): date is Date => date !== null, message);
const dateOnly = (date: Date | null) => date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-") : "";

export const Booking = defineForm({
  dates: {
    schema: z.object({ from: requiredDate("Choose a start date."), to: requiredDate("Choose an end date.") })
      .refine(({ from, to }) => !from || !to || to >= from, { message: "End date must follow the start date.", path: ["to"] })
      .transform(({ from, to }) => ({ from: dateOnly(from), to: dateOnly(to) })),
    defaultValue: { from: null, to: null }, label: "Travel dates", component: "dateRange",
    description: "Choose a start and end date. Escape closes the calendar.",
  },
  activities: {
    schema: z.array(z.enum(["walking", "museum", "food"])).min(1, "Choose at least one activity."),
    defaultValue: [], label: "Activities", component: "multiSelect",
    description: "Choose any activities you enjoy.",
    componentProps: { options: [{ value: "walking", label: "Walking" }, { value: "museum", label: "Museums" }, { value: "food", label: "Food" }] },
  },
}, { layout: Stack });
export type BookingOutput = z.output<typeof Booking.schema>;
