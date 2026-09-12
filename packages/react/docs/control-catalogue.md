# Local shadcn control bindings

The `@formulate/shadcn-bindings` source item supplies the following controls through `@/lib/formulate-config`, targeting shadcn's **Base UI** components (`base-nova` in this example). These are application-owned React bindings; the primitive taxonomy and reusable field definitions remain independent of their UI implementations.

| Control key | Export / source module | Editing value | Configuration |
| --- | --- | --- | --- |
| `input` | `InputControl` / `controls` | `string`, empty `""` | Native input props; text, email, password, search, tel, url, date, time or datetime-local. Date/time inputs here retain strings. |
| `textarea` | `TextareaControl` / `controls` | `string`, empty `""` | Textarea props including rows, placeholder and className. |
| `checkbox` | `CheckboxControl` / `controls` | `boolean` | Two states; no indeterminate value. |
| `switch` | `SwitchControl` / `controls` | `boolean` | Local Switch props including size. |
| `select` | `SelectControl` / `controls` | `string`, empty `""` | Required options; placeholder, size and className. Base UI null selections map to `""`; reset/setValue can clear. |
| `radioGroup` | `RadioGroupControl` / `group-controls` | `string`, empty `""` | Required options; orientation, required, readOnly, className and itemClassName. |
| `combobox` | `ComboboxControl` / `choice-controls` | `string`, empty `""` | Required options; searchable suggestions, placeholder, emptyMessage, className, contentClassName and showClear (default true). UI null selections map to `""`. |
| `command` | `CommandControl` / `choice-controls` | `string`, empty `""` | Required options; inline search, placeholder, emptyMessage and className. Only clicking/activating an option commits a value. |
| `toggleGroup` | `ToggleGroupControl` / `group-controls` | `string`, empty `""` | Required options; single selection, pressing the selected toggle clears it. Variant, size, spacing, orientation and loop props. |
| `multiToggleGroup` | `MultiToggleGroupControl` / `group-controls` | `string[]`, empty `[]` | Multiple-selection ToggleGroup with the same configuration as the single-selection binding. |
| `slider` | `SliderControl` / `group-controls` | `number` | One thumb; min, max, step and orientation. Supply a finite starting value within the displayed range. |
| `calendar` | `CalendarControl` / `calendar-controls` | `Date \| null` | Inline single-date calendar; defaultMonth, startMonth/endMonth, locale, weekStartsOn, numberOfMonths, captionLayout, showOutsideDays, disabledDates and className. |
| `datePicker` | `DatePickerControl` / `calendar-controls` | `Date \| null` | Popup single-date calendar with the same date configuration; placeholder, trigger className, calendarClassName and contentClassName. Includes a clear action. |
| `inputOTP` | `InputOTPControl` / `controls` | `string`, empty `""` | maxLength (positive integer, default 6), pattern, inputMode and other OTP input props; containerClassName, groupClassName and slotClassName. Defaults to digits and one-time-code autocomplete. |
| `number`, `currencyInput` | `NumberControl` / `controls` | `number` | Numeric Input, using `NaN` for an empty editing value. `currencyInput` is the existing local numeric binding; add formatted money UI locally if needed. |

Source modules live under `@/components/formulate`. Every binding's props type is exported alongside it. Select, radio, combobox, command and toggle options have the same shape: `{ value: string, label: string, disabled?: boolean }`. Use unique, nonempty option values. These adapters display the supplied options; membership, presence and eligibility still belong to schemas and the existing dependent-choice rules.

Single and multiple toggle groups have separate keys so TypeScript can check their value contracts. Calendar and DatePicker both edit one nullable Date. The existing optional `@formulate/pickers` item supplies `DateRangeControl` and `MultiSelectControl` for structured range/array values. No control silently changes a field's primitive or schema.

## Use the configured map

```tsx
import { defineForm, field } from "@/lib/formulate-config";
import { Country, Percentage } from "@/lib/formulate-fields/common-fields";
import { z } from "zod";

const countries = [
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
];
const Preferences = defineForm({
  country: field(Country, { componentProps: { options: countries } }),
  countryRadio: field(Country, { component: "radioGroup", componentProps: { options: countries } }),
  percentage: field(Percentage, { component: "slider", componentProps: { min: 0, max: 100, step: 1 } }),
  date: {
    primitive: "date", schema: z.date().nullable(), defaultValue: null,
    label: "Visit date", component: "datePicker",
  },
});
```

The complete map includes the full control catalogue. Applications needing fewer controls can import only the desired bindings and pass a smaller map to the existing `createFormulate` API. The HTML defaults exported directly by `@formulate/react` remain input, number and checkbox.

## Interaction contracts

Formulate owns values, change/blur callbacks, disabled state, labels, errors and correction focus. Adapter props exclude those managed properties and Base UI's render/ref/state-callback APIs. Radio/toggle groups validate on blur only when focus leaves the entire group. Radio option labels are distinct from the field's group label. Inline Calendar focuses its current keyboard day on validation; the Slider binding targets the native range input generated by shadcn's Base UI Slider. That DOM detail stays local to this binding.

Combobox search and Command search/highlight are UI state, separate from the selected string stored in RHF. Their named native inputs also carry the selected value rather than search text. Command is a field picker, not an action dispatcher. Enter activates an option without submitting the enclosing form; the committed selection is shown below the list. Clear selection preserves focus on its action button. Schemas still decide whether clearing is valid.

DatePicker, Select and Combobox use the existing compound binding: closing validates on blur, Escape restores focus, Activity closes retained popups, and disabled forms close popups and disable their triggers. DatePicker supports `FormulatePortalProvider`, using the same source-owned Base UI Popover content adapter as the range and multi-select pickers. Select and Combobox currently use their installed shadcn content's default portal.

Calendar/DatePicker values remain Dates in RHF; `null` is an explicit empty editor state. Put required-date validation or conversion to an API's string/date format in the schema. OTP preserves leading zeroes. Its input restriction and slot count do not replace a schema rule such as `z.string().regex(/^\d{6}$/)`, and completion does not submit automatically.

All UI source comes from shadcn's Base UI catalogue. Its [Command](https://ui.shadcn.com/docs/components/base/command), [Calendar](https://ui.shadcn.com/docs/components/base/calendar) and [InputOTP](https://ui.shadcn.com/docs/components/base/input-otp) still use cmdk, React DayPicker and input-otp respectively. These implementation dependencies belong to source-installed UI, not Formulate core or common fields.

## Future bindings

Radix and React Aria implementations are future work. A future local binding can keep the same editing types and control keys while translating its own change events, focus refs, disabled semantics, popup lifecycle and portal API. The compound hook exposes `canRestoreFocus()` as a plain policy; this Base UI adapter passes it to `finalFocus`. No UI event object is required by core. Base UI's array-shaped single ToggleGroup value is also translated locally to the field's scalar string.

Configure the registry consumer with a `base-*` shadcn style for the current bindings. Changing `components.json` to a different backend does not automatically make its prop APIs compatible. There is no runtime backend selector or speculative shared widget interface.

The [control gallery](../../../examples/react/src/compositions/control-gallery.tsx) demonstrates every key, loading sample data, reset and typed submission. Interaction/type tests cover validation focus, keyboard changes, grouped blur, disabled editors and retained popup state.
