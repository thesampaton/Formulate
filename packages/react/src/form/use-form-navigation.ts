"use client";

import { useEffect, useRef, useState } from "react";
import { get } from "react-hook-form";
import type { FieldErrors, FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import type { FormScope } from "./form.js";

type FieldDestinationTarget<Values extends FieldValues> = {
  /** Explicit RHF path of the editor to focus. */
  name: FieldPath<Values>;
  scope?: never;
} | {
  /** Error and focus paths from a bound or composed reusable unit. */
  scope: FormScope<Values>;
  name?: never;
};

export type FieldDestination<Values extends FieldValues, Page extends string> = FieldDestinationTarget<Values> & {
  /** Host-owned page that renders this editor. */
  page: Page;
  /** Synchronously reveal the editor before React commits navigation and focus. */
  reveal?: () => void;
};

export type FormNavigationOptions<Values extends FieldValues, Page extends string> = {
  /** The existing form runtime. Set shouldFocusError: false when navigation coordinates error focus. */
  form: Pick<UseFormReturn<Values>, "setFocus">;
  /** Initial location for this mounted hook. Later prop changes do not navigate. */
  initialPage: Page;
  /** Ordered field destinations, independent of mounted editors and the current action scope. */
  destinations: readonly FieldDestination<Values, Page>[];
};

export type FormNavigation<Values extends FieldValues, Page extends string> = {
  /** Current host-owned page. Pass comparisons to Page.active. */
  page: Page;
  /** Changes on every navigation, including same-page visits. Use as Form scopedAction.id to invalidate older checks. */
  revision: number;
  /** Navigate freely and replace any pending focus request. Optional focus runs once after the destination commits. */
  goToPage: (page: Page, focusAfterCommit?: () => void) => void;
  /** Reveal a mapped editor and request focus after navigation commits. Returns false if the path is unmapped. */
  goToField: (fieldPath: FieldPath<Values>) => boolean;
  /** Request navigation to the first error in destination/focus-path order. Returns false if none is mapped; true does not guarantee focus. */
  goToFirstError: (errors: FieldErrors<Values>) => boolean;
};

/** Coordinates page location and editor focus. The host defines actions and their destinations. */
export function useFormNavigation<Values extends FieldValues, Page extends string>({
  form,
  initialPage,
  destinations,
}: FormNavigationOptions<Values, Page>): FormNavigation<Values, Page> {
  const nextNavigationRevision = useRef(0);
  const focusedRevision = useRef(0);
  const [navigationState, setNavigationState] = useState<{
    page: Page;
    revision: number;
    focusAfterCommit?: () => void;
  }>({
    page: initialPage,
    revision: 0,
  });

  /** Navigate freely, replacing any pending focus request. Focus runs after the destination commits. */
  function goToPage(page: Page, focusAfterCommit?: () => void) {
    setNavigationState({ page, revision: ++nextNavigationRevision.current, focusAfterCommit });
  }

  function getDestinationFocusPaths(destination: FieldDestination<Values, Page>) {
    return destination.scope
      ? destination.scope.focusPaths ?? destination.scope.errorPaths
      : [destination.name];
  }

  /** Open a mapped editor, including disclosure. Useful for edit links on a review page. */
  function goToField(fieldPath: FieldPath<Values>): boolean {
    const destination = destinations.find((candidate) => getDestinationFocusPaths(candidate).includes(fieldPath));
    if (!destination) return false;
    destination.reveal?.();
    goToPage(destination.page, () => form.setFocus(fieldPath));
    return true;
  }

  /** Reveal and focus the first mapped error. Returns false for unmapped/form-level errors so the host can provide a fallback. */
  function goToFirstError(errors: FieldErrors<Values>): boolean {
    for (const destination of destinations) {
      const errorPath = getDestinationFocusPaths(destination).find((fieldPath) => get(errors, fieldPath));
      if (errorPath) return goToField(errorPath);
    }
    return false;
  }

  // Focus needs the editor's committed ref. Consuming each request once also
  // prevents unrelated rerenders and Strict Mode effect replay from stealing focus.
  useEffect(() => {
    if (focusedRevision.current === navigationState.revision) return;
    focusedRevision.current = navigationState.revision;
    navigationState.focusAfterCommit?.();
  }, [navigationState]);

  return {
    page: navigationState.page,
    revision: navigationState.revision,
    goToPage,
    goToField,
    goToFirstError,
  };
}
