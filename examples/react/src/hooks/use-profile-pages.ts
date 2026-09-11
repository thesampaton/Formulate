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
  const currentIndex = profilePages.findIndex((page) => page.id === navigation.page);
  const current = profilePages[currentIndex];
  const reviewHeading = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState<MultiPageProfilePayload | null>(null);
  const parsed = saved ? MultiPageProfile.schema.safeParse(values) : null;
  const savedCurrent = parsed?.success && JSON.stringify(parsed.data) === JSON.stringify(saved);

  const navigateToPage = (page: ProfilePage) => {
    const destination = profilePages.find((entry) => entry.id === page);
    if (destination) navigation.goToField(destination.correction[0]!);
    else navigation.goTo("review", () => reviewHeading.current?.focus());
  };
  const step = current ? {
    id: navigation.revision, scope: current,
    onValid: () => navigateToPage(profilePages[currentIndex + 1]?.id ?? "review"),
  } : undefined;
  const correct = (errors: FieldErrors<MultiPageProfileValues>) => {
    if (!navigation.correct(errors)) form.setError("root.submit", { message: "Review the form errors before saving." });
  };
  const submit = async (payload: MultiPageProfilePayload) => {
    setSaved(null);
    await onSave(payload);
    setSaved(payload);
  };
  const tabs = [
    ...completion.map(({ id, title, complete }) => ({ id, label: title, status: complete ? "complete" as const : "incomplete" as const })),
    { id: "review" as const, label: "Review", status: completeCount === 3 ? "ready" as const : "pending" as const },
  ];
  return { form, navigation, navigateToPage, step, correct, submit, tabs, completeCount, reviewHeading, saved, savedCurrent };
}
