import { z } from "zod";
import { createFormulate, defineField } from "@/lib/formulate";
import { DateRange } from "./common-fields";
import { ShadcnField } from "@/components/formulate/field-presentation";
import { DateRangeControl, MultiSelectControl } from "@/components/formulate/picker-controls";
import { FieldGroup } from "@/components/ui/field";

const { defineForm, field } = createFormulate({
  fieldPresentation: ShadcnField,
  components: { dateRange: DateRangeControl, multiSelect: MultiSelectControl },
});
const dateOnly = (date: Date | null) => date ? [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-") : "";
const TravelDates = defineField({
  ...DateRange,
  schema: DateRange.schema.transform(({ from, to }) => ({ from: dateOnly(from), to: dateOnly(to) })),
});

export const Booking = defineForm({
  dates: field(TravelDates, {
    label: "Travel dates",
    description: "Choose a start and end date. Escape closes the calendar.",
  }),
  activities: {
    primitive: "multiChoice",
    schema: z.array(z.enum(["walking", "museum", "food"])).min(1, "Choose at least one activity."),
    defaultValue: [], label: "Activities", component: "multiSelect",
    description: "Choose any activities you enjoy.",
    componentProps: { options: [{ value: "walking", label: "Walking" }, { value: "museum", label: "Museums" }, { value: "food", label: "Food" }] },
  },
}, { layout: FieldGroup });
export type BookingOutput = z.output<typeof Booking.schema>;
