/// <reference types="vite/client" />
import composition from "./compositions/request-settings.tsx?raw";
import declaration from "./declarations/request-settings.ts?raw";
import type { FocusedGuide } from "./focused-example";
import { sourceExcerpt } from "./source-excerpt";

export const advancedGuide = {
  capability: "Validate the current step before continuing",
  summary: "A multi-step form can check only the fields on the current step when you continue, then validate the full form on submission. Request settings uses this to keep later fields out of the way until their step is active.",
  prompt: "Leave Request URL blank and choose Next: destination; Settings can pass without it. On Destination, try Review settings before filling the URL. After reaching Review, choose Edit retries, enter 11, and try continuing.",
  steps: [
    {
      id: "check-current-page",
      title: "Scope Continue to the current step",
      explanation: "The scoped action names the paths to validate for Settings or Destination. Review has no scoped action, so its button submits the full form.",
      filename: "compositions/request-settings.tsx",
      code: sourceExcerpt(composition, "  const scopedAction: ScopedFormAction<Settings> | undefined =", "  return ("),
    },
    {
      id: "connect-step-action",
      title: "Use one form for Continue and Save",
      explanation: "The same Form receives the step action while continuing and the final submit callback on Review. Invalid results navigate to their fields for correction.",
      filename: "compositions/request-settings.tsx",
      code: sourceExcerpt(composition, "    <RequestSettings.Form form={form} scopedAction={scopedAction}", '      <p className="step-indicator" aria-live="polite">'),
    },
    {
      id: "route-step-errors",
      title: "Return to fields across steps",
      explanation: "The navigation map knows which step owns each field. Editing retries from Review reveals its optional section and returns to that control.",
      filename: "compositions/request-settings.tsx",
      code: sourceExcerpt(composition, "    destinations: [", "  const { page } = navigation;"),
    },
  ],
  completeSources: [
    { label: "Composition", filename: "compositions/request-settings.tsx", code: composition.trim() },
    { label: "Declaration", filename: "declarations/request-settings.ts", code: declaration.trim() },
  ],
} satisfies FocusedGuide;
