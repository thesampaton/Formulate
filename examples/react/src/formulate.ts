import { createFormulate } from "@formulate/react";
import { CheckboxControl, InputControl, NumberControl, SelectControl } from "./controls";

// The application's control catalogue. Replace an entry with a local connected
// control to change its UI everywhere without editing individual fields.
export const { Field, defineForm, defineSection } = createFormulate({
  components: {
    input: InputControl,
    number: NumberControl,
    checkbox: CheckboxControl,
    select: SelectControl,
  },
});
