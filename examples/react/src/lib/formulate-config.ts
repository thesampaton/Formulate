import { createFormulate } from "@/lib/formulate";
import { ShadcnField } from "@/components/formulate/field-presentation";
import { CheckboxControl, InputControl, InputOTPControl, NumberControl, SelectControl, SwitchControl, TextareaControl } from "@/components/formulate/controls";
import { MultiToggleGroupControl, RadioGroupControl, SliderControl, ToggleGroupControl } from "@/components/formulate/group-controls";
import { ComboboxControl, CommandControl } from "@/components/formulate/choice-controls";
import { CalendarControl, DatePickerControl } from "@/components/formulate/calendar-controls";

// Map declaration keys to bindings over this project's local shadcn components.
// The shadcn CLI resolves import paths at install time using components.json.
export const { Field, field, defineForm, defineSection } = createFormulate({
  fieldPresentation: ShadcnField,
  components: {
    input: InputControl,
    textarea: TextareaControl,
    number: NumberControl,
    currencyInput: NumberControl,
    checkbox: CheckboxControl,
    switch: SwitchControl,
    select: SelectControl,
    radioGroup: RadioGroupControl,
    combobox: ComboboxControl,
    command: CommandControl,
    toggleGroup: ToggleGroupControl,
    multiToggleGroup: MultiToggleGroupControl,
    slider: SliderControl,
    calendar: CalendarControl,
    datePicker: DatePickerControl,
    inputOTP: InputOTPControl,
  },
});
