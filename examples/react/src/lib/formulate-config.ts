import { createFormulate } from "@/lib/formulate";
import { ShadcnField } from "@/components/formulate/field-presentation";
import { CheckboxControl, InputControl, NumberControl, SelectControl } from "@/components/formulate/controls";

// The application's control catalogue. Replace an entry with a local connected
// control to change its UI everywhere without editing individual fields.
export const { Field, defineForm, defineSection } = createFormulate({
  fieldPresentation: ShadcnField,
  components: {
    input: InputControl,
    number: NumberControl,
    checkbox: CheckboxControl,
    select: SelectControl,
  },
});
