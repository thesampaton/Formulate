/// <reference types="vite/client" />
import declaration from "../declarations/sign-in.ts?raw";
import composition from "../compositions/sign-in.tsx?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const simpleGuide = {
  capability: "Validate and submit values from one form definition",
  summary: "A form definition gives fields their names, rules and defaults. One instance renders those fields, reports errors and submits valid values. This sign-in is the smallest example of that path.",
  prompt: "Submit the empty form to see validation and focus move to the first error. Then enter an email and password and submit to run the valid callback.",
  steps: [
    {
      id: "define-sign-in-fields",
      title: "Define the value contract",
      explanation: "The form names its values and reuses Email and Password definitions for their rules, defaults and controls.",
      filename: "declarations/sign-in.ts",
      code: sourceExcerpt(declaration, "export const SignIn = defineForm({", "export type SignInValues = z.output<typeof SignIn.schema>;"),
    },
    {
      id: "submit-sign-in",
      title: "Render, validate and submit",
      explanation: "useForm creates the editing instance. Form renders its fields and validates them before calling onSignIn with the parsed values.",
      filename: "compositions/sign-in.tsx",
      code: sourceExcerpt(composition, "  const form = SignIn.useForm();", "}"),
    },
  ],
  completeSources: [
    { label: "Declaration", filename: "declarations/sign-in.ts", code: declaration.trim() },
    { label: "Composition", filename: "compositions/sign-in.tsx", code: composition.trim() },
  ],
} satisfies FocusedGuide;
