"use client";

import { useEffect, useMemo, useRef, useTransition } from "react";
import type { ComponentPropsWithoutRef, FormEvent } from "react";
import { FormProvider, set } from "react-hook-form";
import type { FieldErrors, FieldPath, FieldValues, SubmitErrorHandler, SubmitHandler, UseFormReturn } from "react-hook-form";
import { FormActionStatusContext } from "./form-action-status.js";
import { ChoiceRuntimeContext } from "../choices/context.js";
import type { ChoiceController, ChoiceRuntimeContextValue } from "../choices/context.js";
import { LayoutBody } from "../presentation/layout.js";
import type { LayoutProps } from "../presentation/layout.js";

export type FormNavigationAction<Input extends FieldValues> = {
  /** Identity of this page visit/action. Change it to cancel a previous check; use useFormNavigation().revision. */
  id: string | number;
  /** Runs after this scope passes. Receives no payload: scoped validity does not prove the whole form's parsed output. */
  onValid: () => Promise<void> | void;
} & ({
  /** Only errors at these RHF paths gate this action. The resolver still evaluates the form schema. */
  fields: readonly FieldPath<Input>[];
  scope?: never;
} | {
  /** A reusable unit's bound error-path scope. The resolver still evaluates the form schema. */
  scope: FormScope<Input>;
  fields?: never;
});

/** Error paths for a scoped action, with an optional ordered editor map for correction. */
export type FormScope<Input extends FieldValues> = {
  /** Error paths that gate the action. Object paths include their descendants. */
  readonly fields: readonly FieldPath<Input>[];
  /** Ordered focusable editor paths for correction; defaults to fields. */
  readonly correction?: readonly FieldPath<Input>[];
};

export type FormProps<Input extends FieldValues, Output extends FieldValues = Input> =
  Omit<ComponentPropsWithoutRef<"form">, "onSubmit" | "onInvalid" | "noValidate"> & LayoutProps & {
    form: UseFormReturn<Input, unknown, Output>;
    onSubmit: SubmitHandler<Output>;
    onInvalid?: SubmitErrorHandler<Input>;
    /** When present, submit/Enter checks this navigation scope instead of invoking the final onSubmit handler. */
    navigation?: FormNavigationAction<Input>;
    /** Read a stable revision of additional external validation evidence. Choice-aware form runtimes
     * install theirs automatically. A changed live revision cancels callbacks from a pending check. */
    getValidationRevision?: () => string | number;
    submissionErrorMessage?: string;
  };

export function Form<Input extends FieldValues, Output extends FieldValues = Input>({
  form,
  onSubmit,
  onInvalid,
  navigation,
  getValidationRevision,
  submissionErrorMessage = "Unable to submit. Please try again.",
  children,
  layout,
  ...props
}: FormProps<Input, Output>) {
  const installedValidationRevision = (form as typeof form & {
    getValidationRevision?: () => string | number;
  }).getValidationRevision;
  const installedChoices = (form as typeof form & { choices?: ChoiceController }).choices;
  const resolvedValidationRevision = getValidationRevision ?? installedValidationRevision;
  const choiceRuntime = useMemo(() => installedChoices ? {
    control: form.control,
    choices: installedChoices,
  } as ChoiceRuntimeContextValue : null, [form.control, installedChoices]);
  const pending = useRef(false);
  const [isPending, startTransition] = useTransition();
  const epoch = useRef(0);
  const live = useRef(false);
  const subscription = useRef<(() => void) | undefined>(undefined);
  const validationSource = useRef(resolvedValidationRevision);
  useEffect(() => { validationSource.current = resolvedValidationRevision; }, [resolvedValidationRevision]);
  const { errors } = form.formState;
  const navigationFields = navigation ? (navigation.scope?.fields ?? navigation.fields) : undefined;
  const scopeKey = JSON.stringify(navigation ? { fields: navigationFields, correction: navigation.scope?.correction } : undefined);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      epoch.current++;
      subscription.current?.();
    };
  }, [form.control, navigation?.id, scopeKey]);

  // React requires a new transition for state updates made after an awaited check.
  // Keep rejection in submit's error handler while awaiting the callback.
  function continueAction(callback: () => unknown) {
    return new Promise<void>((resolve, reject) => startTransition(async () => {
      try { await callback(); resolve(); } catch (error) { reject(error); }
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Close the gap before React renders pending state, including async validation.
    if (pending.current) return;
    pending.current = true;
    const attempt = epoch.current;
    const validationRevision = validationSource.current?.();
    let changed = false;
    let handlerStarted = false;
    const current = () => live.current && epoch.current === attempt && !changed &&
      Object.is(validationRevision, validationSource.current?.());
    const unsubscribe = form.subscribe({ formState: { values: true }, callback: () => { changed = true; } });
    subscription.current = unsubscribe;
    form.clearErrors("root.submit");
    try {
      if (navigation) {
        const fields = [...navigationFields!];
        const valid = fields.length === 0 || await form.trigger(fields, { shouldFocus: false });
        if (!current()) return;
        if (valid) {
          handlerStarted = true;
          await continueAction(navigation.onValid);
        }
        else {
          const scopedErrors: FieldErrors<Input> = {};
          for (const name of fields) {
            const error = form.getFieldState(name).error;
            if (error) set(scopedErrors, name, error);
          }
          if (onInvalid) await continueAction(() => onInvalid(scopedErrors, event));
          else {
            const first = fields.find((name) => form.getFieldState(name).invalid);
            if (first) form.setFocus(first);
          }
        }
      } else {
        await form.handleSubmit(
          async (values) => {
            if (!current()) return;
            handlerStarted = true;
            await continueAction(() => onSubmit(values, event));
          },
          async (invalid) => { if (current() && onInvalid) await continueAction(() => onInvalid(invalid, event)); },
        )(event);
      }
    } catch {
      if (handlerStarted ? live.current && epoch.current === attempt : current()) {
        form.setError("root.submit", { type: "submission", message: submissionErrorMessage });
      }
    } finally {
      unsubscribe();
      if (subscription.current === unsubscribe) subscription.current = undefined;
      pending.current = false;
    }
  }

  return (
    <ChoiceRuntimeContext value={choiceRuntime}>
      <FormProvider {...form}>
        <FormActionStatusContext value={{ isPending }}>
          <form {...props} noValidate onSubmit={(event) => startTransition(() => submit(event))} aria-busy={isPending} data-formulate="form">
            <LayoutBody layout={layout}>{children}</LayoutBody>
            {errors.root?.submit?.message ? (
              <p role="alert" data-formulate="submission-error">{errors.root.submit.message}</p>
            ) : null}
          </form>
        </FormActionStatusContext>
      </FormProvider>
    </ChoiceRuntimeContext>
  );
}
