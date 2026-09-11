import { MultiPageProfile } from "@/declarations/multi-page-profile";

// The same bound uses drive presentation, Continue, correction and indicators.
export const profileSections = {
  name: MultiPageProfile.bindSection("name"),
  address: MultiPageProfile.bindSection("address"),
  notifications: MultiPageProfile.bindSection("notifications"),
};
export const profilePages = [
  { id: "profile", title: "Profile", fields: [...profileSections.name.fields, "email"], correction: [...profileSections.name.correction, "email"] },
  { id: "delivery", title: "Delivery", fields: profileSections.address.fields, correction: profileSections.address.correction },
  { id: "notifications", title: "Notifications", fields: profileSections.notifications.fields, correction: profileSections.notifications.correction },
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
