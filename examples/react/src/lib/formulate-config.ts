import { createFormulate } from "@/lib/formulate";
import { ShadcnField } from "@/components/formulate/field-presentation";
import { CheckboxControl, InputControl, NumberControl, SelectControl } from "@/components/formulate/controls";

// Map declaration keys to bindings over this project's local shadcn components.
// The shadcn CLI resolves import paths at install time using components.json.
export const { Field, field, defineForm, defineSection } = createFormulate({
  fieldPresentation: ShadcnField,
  components: {
    input: InputControl,
    number: NumberControl,
    currencyInput: NumberControl,
    checkbox: CheckboxControl,
    select: SelectControl,
  },
});
