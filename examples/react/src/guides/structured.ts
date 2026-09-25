/// <reference types="vite/client" />
import declaration from "../declarations/structured-editing.ts?raw";
import commonFields from "../declarations/common-fields.ts?raw";
import pickerControls from "../components/formulate/picker-controls.tsx?raw";
import composition from "../structured-editing.tsx?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const structuredGuide = {
  capability: "Edit a structured value through one field",
  summary: "A control can have several interactive parts while its field keeps one value and one validation result. In this visit form, a calendar edits a date-range object and an activity picker edits an array.",
  prompt: "Save with an empty date range to see its field error. Choose both dates and an activity, then save to see the range and activity list submitted as two field values.",
  steps: [
    {
      id: "declare-compound-fields",
      title: "Declare one field per value",
      explanation: "The form has one date-range field and one activities field. Their controls edit an object and an array without splitting either into separate registered fields.",
      filename: "declarations/structured-editing.ts",
      code: sourceExcerpt(declaration, "export const Booking = defineForm({", "export type BookingOutput = z.output<typeof Booking.schema>;"),
    },
    {
      id: "bind-compound-picker",
      title: "Connect the editor to that field",
      explanation: "The compound binding gives the picker one field value and change handler. Its trigger carries the field's label and error state into the popup control.",
      filename: "components/formulate/picker-controls.tsx",
      code: sourceExcerpt(pickerControls, "  const field = useCompoundFieldBinding<DateRangeValue>();", '      <Calendar mode="range" selected={selectedRange}'),
    },
    {
      id: "update-compound-range",
      title: "Update the whole value together",
      explanation: "The calendar writes the complete { from, to } object through one change handler. A partial range remains an editing state until both dates are chosen.",
      filename: "components/formulate/picker-controls.tsx",
      code: sourceExcerpt(pickerControls, '      <Calendar mode="range" selected={selectedRange}', '      <div className="flex justify-between gap-2 border-t p-3">'),
    },
    {
      id: "parse-travel-dates",
      title: "Shape the submitted value",
      explanation: "Dates remain Date objects while editing. The field schema converts them to date-only strings in the submitted output.",
      filename: "declarations/structured-editing.ts",
      code: sourceExcerpt(declaration, "function dateOnly(date: Date | null) {", "export const Booking = defineForm({"),
    },
  ],
  completeSources: [
    { label: "Booking declaration", filename: "declarations/structured-editing.ts", code: declaration.trim() },
    { label: "Reusable date range", filename: "declarations/common-fields.ts", code: commonFields.trim() },
    { label: "Picker controls", filename: "components/formulate/picker-controls.tsx", code: pickerControls.trim() },
    { label: "Composition", filename: "structured-editing.tsx", code: composition.trim() },
  ],
} satisfies FocusedGuide;
