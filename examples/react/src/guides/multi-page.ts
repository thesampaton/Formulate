/// <reference types="vite/client" />
import declaration from "../declarations/multi-page-profile.ts?raw";
import composition from "../compositions/multi-page-form.tsx?raw";
import pageRules from "../hooks/profile-pages.ts?raw";
import pageState from "../hooks/use-profile-pages.ts?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const multiPageGuide = {
  capability: "Derive page completion and correction from one schema",
  summary: "A multi-page form can use its submission schema to show which pages are complete and route errors back to their fields. This profile maps one schema across tabs: Continue checks the current page, while Save checks all values and opens the page that needs correction.",
  prompt: "Load sample data, clear the Delivery postcode, then open Review. Delivery becomes incomplete because its schema rule fails. Select Save profile to return to the postcode on the hidden tab.",
  steps: [
    {
      id: "compose-profile-schema",
      title: "Keep one schema across the pages",
      explanation: "The profile's Name, Email, Address and Notifications definitions form one value and validation contract, even though the fields appear on separate tabs.",
      filename: "declarations/multi-page-profile.ts",
      code: sourceExcerpt(declaration, "export const MultiPageProfile = defineForm({", "export type MultiPageProfileValues = z.input<typeof MultiPageProfile.schema>;"),
    },
    {
      id: "bind-profile-pages",
      title: "Map fields to their pages",
      explanation: "Each page lists the paths for its completion indicator and error focus. Continue uses the same page scope. The Profile page includes Email alongside the bound Name section.",
      filename: "hooks/profile-pages.ts",
      code: sourceExcerpt(pageRules, "export const profileSections = {", 'export type ProfilePage = (typeof profilePages)[number]["id"] | "review";'),
    },
    {
      id: "derive-profile-completion",
      title: "Derive completion from the full schema",
      explanation: "The current values are checked against the submission schema. Each page indicator reflects its schema issues, including conditional requirements, instead of whether a field was touched.",
      filename: "hooks/profile-pages.ts",
      code: sourceExcerpt(pageRules, "  const result = MultiPageProfile.schema.safeParse(values);", "}"),
    },
    {
      id: "correct-profile-errors",
      title: "Return to a field on another page",
      explanation: "Continue validates the current page's scope. Save checks every page, then navigates to the first invalid field even when its tab was hidden.",
      filename: "hooks/use-profile-pages.ts",
      code: sourceExcerpt(pageState, "  const scopedAction = currentPage ? {", "  const handleSubmit = async (payload: MultiPageProfilePayload) => {"),
    },
  ],
  completeSources: [
    { label: "Form schema", filename: "declarations/multi-page-profile.ts", code: declaration.trim() },
    { label: "Page scopes and completion", filename: "hooks/profile-pages.ts", code: pageRules.trim() },
    { label: "Page state", filename: "hooks/use-profile-pages.ts", code: pageState.trim() },
    { label: "Composition", filename: "compositions/multi-page-form.tsx", code: composition.trim() },
  ],
} satisfies FocusedGuide;
