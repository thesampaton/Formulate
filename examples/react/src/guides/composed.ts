/// <reference types="vite/client" />
import declaration from "../declarations/composed-values.ts?raw";
import composition from "../compositions/composed-values.tsx?raw";
import composedControl from "../components/formulate/composed-input-control.tsx?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const composedGuide = {
  capability: "Build one canonical string from several segments",
  summary: "A field can appear as editable, fixed and derived segments while Formulate stores and validates one canonical string. Email addresses, resource names and SKUs illustrate the same pattern here.",
  prompt: "Load the sample, change Region, then switch organization and watch Resource name update. Edit the two SKU parts and save to see each composed field submit one string.",
  steps: [
    {
      id: "compose-fixed-text",
      title: "Combine an input with fixed text",
      explanation: "The user edits the username, while the field stores and validates the complete email string with its fixed domain.",
      filename: "declarations/composed-values.ts",
      code: sourceExcerpt(declaration, "  email: {", "  url: {"),
    },
    {
      id: "compose-bound-values",
      title: "Read other fields and context",
      explanation: "The resource name combines the organization from context with the current environment, region, and an editable middle segment.",
      filename: "declarations/composed-values.ts",
      code: sourceExcerpt(declaration, "  resourceName: {", "  customerReference: {"),
    },
    {
      id: "supply-composition-context",
      title: "Supply application context",
      explanation: "The form receives the current organization outside its submitted values. Switching organization recomposes affected strings.",
      filename: "compositions/composed-values.tsx",
      code: sourceExcerpt(composition, '  const [organization, setOrganization] = useState<keyof typeof contexts>("acme");', "  return <ComposedValues.Form form={form} onSubmit={onSave}>"),
    },
    {
      id: "parse-multiple-inputs",
      title: "Reopen two editable parts",
      explanation: "The SKU is still one string. A parser recovers its style and size inputs when a saved value is loaded again.",
      filename: "declarations/composed-values.ts",
      code: sourceExcerpt(declaration, "      segments: [", '    componentProps: { autoCapitalize: "characters", spellCheck: false },'),
    },
  ],
  completeSources: [
    { label: "Composed field declaration", filename: "declarations/composed-values.ts", code: declaration.trim() },
    { label: "Composition", filename: "compositions/composed-values.tsx", code: composition.trim() },
    { label: "Composed input control", filename: "components/formulate/composed-input-control.tsx", code: composedControl.trim() },
  ],
} satisfies FocusedGuide;
