/// <reference types="vite/client" />
import commonFields from "../declarations/common-fields.ts?raw";
import declaration from "../declarations/control-gallery.ts?raw";
import composition from "../compositions/control-gallery.tsx?raw";
import controlMap from "../lib/formulate-config.ts?raw";
import textControls from "../components/formulate/controls.tsx?raw";
import choiceControls from "../components/formulate/choice-controls.tsx?raw";
import groupControls from "../components/formulate/group-controls.tsx?raw";
import calendarControls from "../components/formulate/calendar-controls.tsx?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const controlsGuide = {
  capability: "Change the control without changing the field contract",
  summary: "A field's value and validation rules can stay the same when its control changes. Here, one reusable country definition is rendered with several local shadcn controls, each with its usual appearance and behavior.",
  prompt: "Load the sample, choose different countries with Select, RadioGroup and Combobox, then save. Each control still submits a two-letter country code.",
  steps: [
    {
      id: "define-country",
      title: "Keep value rules on the field",
      explanation: "The reusable country field owns the value schema and default. Its Combobox is only a presentation default that each use can replace.",
      filename: "declarations/common-fields.ts",
      code: sourceExcerpt(commonFields, "export const Country = defineField({", "const requiredDate = (message: string) => z.date().nullable().refine((date) => date !== null, message);"),
    },
    {
      id: "choose-control",
      title: "Choose a control at each use",
      explanation: "Select, RadioGroup and Combobox use the same country value rules while choosing their own local controls and props.",
      filename: "declarations/control-gallery.ts",
      code: sourceExcerpt(declaration, "  select: field(CountryChoice, {", "  command: field(CountryChoice, {"),
    },
    {
      id: "register-local-controls",
      title: "Bind the app's own controls",
      explanation: "The component map connects field names to this app's shadcn controls. The controls retain their styling while Formulate supplies their value bindings.",
      filename: "lib/formulate-config.ts",
      code: sourceExcerpt(controlMap, "    select: SelectControl,", "    slider: SliderControl,"),
    },
  ],
  completeSources: [
    { label: "Gallery declaration", filename: "declarations/control-gallery.ts", code: declaration.trim() },
    { label: "Reusable field definitions", filename: "declarations/common-fields.ts", code: commonFields.trim() },
    { label: "Control map", filename: "lib/formulate-config.ts", code: controlMap.trim() },
    { label: "Composition", filename: "compositions/control-gallery.tsx", code: composition.trim() },
    { label: "Input, checkbox, select, textarea, switch and OTP bindings", filename: "components/formulate/controls.tsx", code: textControls.trim() },
    { label: "Combobox and Command bindings", filename: "components/formulate/choice-controls.tsx", code: choiceControls.trim() },
    { label: "Radio, Toggle Group and Slider bindings", filename: "components/formulate/group-controls.tsx", code: groupControls.trim() },
    { label: "Calendar and Date Picker bindings", filename: "components/formulate/calendar-controls.tsx", code: calendarControls.trim() },
  ],
} satisfies FocusedGuide;
