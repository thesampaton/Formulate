import { MultiPageProfile } from "@/declarations/multi-page-profile";

// These scopes drive both Continue validation and the tab indicators.
export const profilePages = [
  { id: "profile", title: "Profile", fields: MultiPageProfile.fieldNames.filter((name) => name.startsWith("name.") || name === "email") },
  { id: "delivery", title: "Delivery", fields: MultiPageProfile.fieldNames.filter((name) => name.startsWith("address.")) },
  { id: "notifications", title: "Notifications", fields: MultiPageProfile.fieldNames.filter((name) => name.startsWith("notifications.")) },
] as const;
export type ProfilePage = (typeof profilePages)[number]["id"] | "review";

// Synchronous demo rules: use the same schema as submission, including conditional
// requirements. RHF's displayed errors/touched state are not completion evidence.
export function profileCompletion(values: unknown) {
  const result = MultiPageProfile.schema.safeParse(values);
  const issues = result.success ? [] : result.error.issues;
  return profilePages.map((page) => ({ ...page, complete: !issues.some((issue) => {
    const path = issue.path.join(".");
    return path === "" || page.fields.some((name) => name === path || name.startsWith(`${path}.`) || path.startsWith(`${name}.`));
  }) }));
}
