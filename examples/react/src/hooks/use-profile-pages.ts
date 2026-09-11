import { useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import type { DefaultValues, FieldErrors } from "react-hook-form";
import { useFormNavigation } from "@/lib/formulate";
import { MultiPageProfile } from "@/declarations/multi-page-profile";
import type { MultiPageProfilePayload, MultiPageProfileValues } from "@/declarations/multi-page-profile";
import { profileCompletion, profilePages } from "./profile-pages";
import type { ProfilePage } from "./profile-pages";

export type ProfileFormProps = {
  onSave: (payload: MultiPageProfilePayload) => void | Promise<void>;
  defaultValues?: DefaultValues<MultiPageProfileValues>;
};

export function useProfilePages({ onSave, defaultValues }: ProfileFormProps) {
  const form = MultiPageProfile.useForm({ defaultValues, shouldFocusError: false });
  const values = useWatch({ control: form.control });
  const completion = profileCompletion(values);
  const completeCount = completion.filter((page) => page.complete).length;
  const navigation = useFormNavigation<MultiPageProfileValues, ProfilePage>({
    form, initialPage: "profile",
    destinations: profilePages.map((page) => ({ scope: page, page: page.id })),
  });
  const currentPageIndex = profilePages.findIndex((page) => page.id === navigation.page);
  const currentPage = profilePages[currentPageIndex];
  const reviewHeadingRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState<MultiPageProfilePayload | null>(null);
  const parsedValues = saved ? MultiPageProfile.schema.safeParse(values) : null;
  const savedCurrent = parsedValues?.success && JSON.stringify(parsedValues.data) === JSON.stringify(saved);

  const navigateToPage = (page: ProfilePage) => {
    const destination = profilePages.find((entry) => entry.id === page);
    if (destination) {
      navigation.goToField(destination.focusPaths[0]!);
    } else {
      navigation.goToPage("review", () => reviewHeadingRef.current?.focus());
    }
  };
  const scopedAction = currentPage ? {
    id: navigation.revision, scope: currentPage,
    onValid: () => navigateToPage(profilePages[currentPageIndex + 1]?.id ?? "review"),
  } : undefined;
  const handleInvalid = (errors: FieldErrors<MultiPageProfileValues>) => {
    if (!navigation.goToFirstError(errors)) {
      form.setError("root.submit", { message: "Review the form errors before saving." });
    }
  };
  const handleSubmit = async (payload: MultiPageProfilePayload) => {
    setSaved(null);
    await onSave(payload);
    setSaved(payload);
  };
  const tabs = [
    ...completion.map(({ id, title, complete }) => ({ id, label: title, status: complete ? "complete" as const : "incomplete" as const })),
    { id: "review" as const, label: "Review", status: completeCount === 3 ? "ready" as const : "pending" as const },
  ];
  return { form, navigation, navigateToPage, scopedAction, handleInvalid, handleSubmit, tabs, completeCount, reviewHeadingRef, saved, savedCurrent };
}
