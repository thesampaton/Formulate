"use client";

import { useEffect, useRef, useState } from "react";
import { get } from "react-hook-form";
import type { FieldErrors, FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import type { FormScope } from "./form.js";

type DestinationTarget<Values extends FieldValues> = {
  /** Explicit RHF path of the editor to focus. */
  name: FieldPath<Values>;
  scope?: never;
} | {
  /** Validation and correction paths from a bound or composed reusable unit. */
  scope: FormScope<Values>;
  name?: never;
};

export type CorrectionDestination<Values extends FieldValues, Page extends string> = DestinationTarget<Values> & {
  /** Host-owned page that renders this editor. */
  page: Page;
  /** Synchronously reveal the editor before React commits navigation and focus. */
  reveal?: () => void;
};

export type FormNavigationOptions<Values extends FieldValues, Page extends string> = {
  /** The existing form runtime; navigation creates no value store. Set shouldFocusError: false when coordinating correction. */
  form: Pick<UseFormReturn<Values>, "setFocus">;
  /** Initial location for this mounted hook. Later prop changes do not navigate. */
  initialPage: Page;
  /** Static correction destinations, independent of mounted editors and validation scope. */
  destinations: readonly CorrectionDestination<Values, Page>[];
};

export type FormNavigation<Values extends FieldValues, Page extends string> = {
  /** Current host-owned page. Pass comparisons to Page.active. */
  page: Page;
  /** Changes on every navigation, including same-page visits. Use as Form navigation.id to invalidate older checks. */
  revision: number;
  /** Navigate freely and replace any pending focus request. Optional focus runs once after the destination commits. */
  goTo: (page: Page, focus?: () => void) => void;
  /** Reveal and focus a mapped editor, for example from a review edit link. Returns false if the path is unmapped. */
  goToField: (name: FieldPath<Values>) => boolean;
  /** Correct the first mapped error in destination order. Returns false for unmapped errors; the host owns fallback feedback. */
  correct: (errors: FieldErrors<Values>) => boolean;
};

/** Page location and correction focus only. The host defines actions; this is not a workflow graph. */
export function useFormNavigation<Values extends FieldValues, Page extends string>({
  form, initialPage, destinations,
}: FormNavigationOptions<Values, Page>): FormNavigation<Values, Page> {
  const sequence = useRef(0);
  const focused = useRef(0);
  const [location, setLocation] = useState<{ page: Page; revision: number; focus?: () => void }>({
    page: initialPage, revision: 0,
  });

  /** Navigate freely, replacing any pending focus request. Focus runs after the destination commits. */
  function goTo(page: Page, focus?: () => void) {
    setLocation({ page, revision: ++sequence.current, focus });
  }

  function destinationFields(destination: CorrectionDestination<Values, Page>) {
    return destination.scope ? destination.scope.correction ?? destination.scope.fields : [destination.name];
  }

  /** Open a mapped editor, including disclosure. Useful for edit links on a review page. */
  function goToField(name: FieldPath<Values>): boolean {
    const destination = destinations.find((candidate) => destinationFields(candidate).includes(name));
    if (!destination) return false;
    destination.reveal?.();
    goTo(destination.page, () => form.setFocus(name));
    return true;
  }

  /** Reveal and focus the first mapped error. Returns false for unmapped/form-level errors so the host can provide a fallback. */
  function correct(errors: FieldErrors<Values>): boolean {
    for (const destination of destinations) {
      const name = destinationFields(destination).find((candidate) => get(errors, candidate));
      if (name) return goToField(name);
    }
    return false;
  }

  // Focus needs the editor's committed ref. Consuming each request once also
  // prevents unrelated rerenders and Strict Mode effect replay from stealing focus.
  useEffect(() => {
    if (focused.current === location.revision) return;
    focused.current = location.revision;
    location.focus?.();
  }, [location]);

  return {
    page: location.page,
    /** Changes on every navigation, even to the same page. Use as Form navigation.id to invalidate older checks. */
    revision: location.revision,
    goTo,
    goToField,
    correct,
  };
}
