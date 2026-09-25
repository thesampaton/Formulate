/// <reference types="vite/client" />
import name from "../declarations/name.tsx?raw";
import composition from "../compositions/profile.tsx?raw";
import demo from "../responsive-layout.tsx?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const layoutGuide = {
  capability: "Override layout without changing values",
  summary: "A reusable section can supply its own presentation, while the form that uses it can choose another layout. Field paths, rules and entered values stay the same. The Name section shows this with a responsive grid and a stacked override.",
  prompt: "Enter a first name, switch “Stack name fields” on and off, then narrow the form with the width slider. Watch the layout change while your answer stays put.",
  steps: [
    {
      id: "define-name-section",
      title: "Define values independently of layout",
      explanation: "Name owns firstName and lastName and their validation. In Profile their paths remain name.firstName and name.lastName with either layout.",
      filename: "declarations/name.tsx",
      code: sourceExcerpt(name, "export const Name = defineSection({", "function NameFields({ title, layout, bodyClassName }: SectionPresentationProps) {"),
    },
    {
      id: "default-name-grid",
      title: "Supply a default presentation",
      explanation: "The section uses its responsive grid when no override is supplied. LayoutBody applies the host's alternative when present.",
      filename: "declarations/name.tsx",
      code: sourceExcerpt(name, "    <LayoutBody layout={layout} bodyClassName={bodyClassName}>", "  </FieldSet>;"),
    },
    {
      id: "override-name-layout",
      title: "Override presentation at the use",
      explanation: "The host supplies FieldGroup for stacked mode or leaves the default grid in place. It does not redefine fields or values.",
      filename: "compositions/profile.tsx",
      code: sourceExcerpt(composition, "  return <Profile.Form form={form} onSubmit={onSave}>", "}"),
    },
  ],
  completeSources: [
    { label: "Reusable section", filename: "declarations/name.tsx", code: name.trim() },
    { label: "Form composition", filename: "compositions/profile.tsx", code: composition.trim() },
    { label: "Interactive demo", filename: "responsive-layout.tsx", code: demo.trim() },
  ],
} satisfies FocusedGuide;
