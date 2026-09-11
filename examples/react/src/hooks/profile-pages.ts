import { MultiPageProfile } from "@/declarations/multi-page-profile";

// The same bound sections drive presentation, Continue, error focus and indicators.
export const profileSections = {
  name: MultiPageProfile.bindSection("name"),
  address: MultiPageProfile.bindSection("address"),
  notifications: MultiPageProfile.bindSection("notifications"),
};
export const profilePages = [
  { id: "profile", title: "Profile", errorPaths: [...profileSections.name.errorPaths, "email"], focusPaths: [...profileSections.name.focusPaths, "email"] },
  { id: "delivery", title: "Delivery", errorPaths: profileSections.address.errorPaths, focusPaths: profileSections.address.focusPaths },
  { id: "notifications", title: "Notifications", errorPaths: profileSections.notifications.errorPaths, focusPaths: profileSections.notifications.focusPaths },
] as const;
export type ProfilePage = (typeof profilePages)[number]["id"] | "review";

// Synchronous demo rules: use the same schema as submission, including conditional
// requirements. RHF's displayed errors/touched state are not completion evidence.
export function profileCompletion(values: unknown) {
  const result = MultiPageProfile.schema.safeParse(values);
  const issues = result.success ? [] : result.error.issues;
  return profilePages.map((page) => {
    const hasPageErrors = issues.some((issue) => {
      const errorPath = issue.path.join(".");
      return errorPath === "" || page.errorPaths.some((path) =>
        path === errorPath || path.startsWith(`${errorPath}.`) || errorPath.startsWith(`${path}.`),
      );
    });
    return { ...page, complete: !hasPageErrors };
  });
}
