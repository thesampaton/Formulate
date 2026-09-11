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

export type ScopedFormAction<Input extends FieldValues> = {
  /** Identity of this page visit/action. Change it to cancel a previous check; use useFormNavigation().revision. */
  id: string | number;
  /** Runs after this scope passes. Receives no payload: scoped validity does not prove the whole form's parsed output. */
  onValid: () => Promise<void> | void;
} & ({
  /** Only errors at these RHF paths gate this action. The resolver still evaluates the form schema. */
  errorPaths: readonly FieldPath<Input>[];
  scope?: never;
} | {
  /** A reusable unit's bound error-path scope. The resolver still evaluates the form schema. */
  scope: FormScope<Input>;
  errorPaths?: never;
});

/** Error paths that gate an action, with optional ordered editor paths for error navigation. */
export type FormScope<Input extends FieldValues> = {
  /** Error paths that gate the action. Object paths include their descendants. */
  readonly errorPaths: readonly FieldPath<Input>[];
  /** Ordered focusable editor paths; defaults to errorPaths when omitted. */
  readonly focusPaths?: readonly FieldPath<Input>[];
};

export type FormProps<Input extends FieldValues, Output extends FieldValues = Input> =
  Omit<ComponentPropsWithoutRef<"form">, "onSubmit" | "onInvalid" | "noValidate"> & LayoutProps & {
    form: UseFormReturn<Input, unknown, Output>;
    onSubmit: SubmitHandler<Output>;
    onInvalid?: SubmitErrorHandler<Input>;
    /** When present, submit/Enter checks this scope and calls onValid instead of the final onSubmit handler. */
    scopedAction?: ScopedFormAction<Input>;
    /** Read a stable revision of additional external validation evidence. Choice-aware form runtimes
     * install theirs automatically. A changed live revision cancels callbacks from a pending check. */
    getValidationRevision?: () => string | number;
    /** Feedback for a thrown validation check or action callback, including final submission. */
    actionErrorMessage?: string;
  };

export function Form<Input extends FieldValues, Output extends FieldValues = Input>({
  form,
  onSubmit,
  onInvalid,
  scopedAction,
  getValidationRevision,
  actionErrorMessage = "Unable to complete this action. Please try again.",
  children,
  layout,
  bodyClassName,
  ...props
}: FormProps<Input, Output>) {
  const getInstalledValidationRevision = (form as typeof form & {
    getValidationRevision?: () => string | number;
  }).getValidationRevision;
  const installedChoices = (form as typeof form & { choices?: ChoiceController }).choices;
  const readValidationRevision = getValidationRevision ?? getInstalledValidationRevision;
  const choiceRuntime = useMemo(() => {
    if (!installedChoices) return null;
    return {
      control: form.control,
      choices: installedChoices,
    } as ChoiceRuntimeContextValue;
  }, [form.control, installedChoices]);
  const isActionInFlight = useRef(false);
  const [isPending, startTransition] = useTransition();
  const actionGeneration = useRef(0);
  const isActionContextActive = useRef(false);
  const valueSubscriptionCleanup = useRef<(() => void) | undefined>(undefined);
  const validationRevisionReader = useRef(readValidationRevision);
  useEffect(() => {
    validationRevisionReader.current = readValidationRevision;
  }, [readValidationRevision]);
  const { errors } = form.formState;
  const actionErrorPaths = scopedAction
    ? scopedAction.scope?.errorPaths ?? scopedAction.errorPaths
    : undefined;
  const scopeKey = JSON.stringify(scopedAction ? {
    errorPaths: actionErrorPaths,
    focusPaths: scopedAction.scope?.focusPaths,
  } : undefined);

  useEffect(() => {
    isActionContextActive.current = true;
    return () => {
      isActionContextActive.current = false;
      actionGeneration.current++;
      valueSubscriptionCleanup.current?.();
    };
  }, [form.control, scopedAction?.id, scopeKey]);

  // React requires a new transition for state updates made after an awaited check.
  // Keep rejected callbacks in the form action's error handler.
  function runActionCallback(callback: () => unknown) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await callback();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Block duplicate actions before React renders pending state, including during async validation.
    if (isActionInFlight.current) return;
    isActionInFlight.current = true;
    const attemptGeneration = actionGeneration.current;
    const capturedValidationRevision = validationRevisionReader.current?.();
    let valuesChanged = false;
    let hasStartedSuccessHandler = false;
    const isActionContextCurrent = () =>
      isActionContextActive.current && actionGeneration.current === attemptGeneration;
    const isAttemptCurrent = () =>
      isActionContextCurrent() &&
      !valuesChanged &&
      Object.is(capturedValidationRevision, validationRevisionReader.current?.());
    const unsubscribeFromValues = form.subscribe({
      formState: { values: true },
      callback: () => { valuesChanged = true; },
    });
    valueSubscriptionCleanup.current = unsubscribeFromValues;
    form.clearErrors("root.submit");
    try {
      if (scopedAction) {
        const errorPaths = [...actionErrorPaths!];
        const isScopeValid = errorPaths.length === 0 || await form.trigger(errorPaths, { shouldFocus: false });
        if (!isAttemptCurrent()) return;
        if (isScopeValid) {
          hasStartedSuccessHandler = true;
          await runActionCallback(scopedAction.onValid);
        } else {
          const scopedErrors: FieldErrors<Input> = {};
          for (const errorPath of errorPaths) {
            const error = form.getFieldState(errorPath).error;
            if (error) set(scopedErrors, errorPath, error);
          }
          if (onInvalid) {
            await runActionCallback(() => onInvalid(scopedErrors, event));
          } else {
            const firstInvalidPath = errorPaths.find((errorPath) => form.getFieldState(errorPath).invalid);
            if (firstInvalidPath) form.setFocus(firstInvalidPath);
          }
        }
      } else {
        await form.handleSubmit(
          async (values) => {
            if (!isAttemptCurrent()) return;
            hasStartedSuccessHandler = true;
            await runActionCallback(() => onSubmit(values, event));
          },
          async (validationErrors) => {
            if (isAttemptCurrent() && onInvalid) {
              await runActionCallback(() => onInvalid(validationErrors, event));
            }
          },
        )(event);
      }
    } catch {
      // A started handler may intentionally edit values; its failure still belongs to this action context.
      const canReportFailure = hasStartedSuccessHandler ? isActionContextCurrent() : isAttemptCurrent();
      if (canReportFailure) {
        form.setError("root.submit", { type: "submission", message: actionErrorMessage });
      }
    } finally {
      unsubscribeFromValues();
      if (valueSubscriptionCleanup.current === unsubscribeFromValues) {
        valueSubscriptionCleanup.current = undefined;
      }
      isActionInFlight.current = false;
    }
  }

  return (
    <ChoiceRuntimeContext value={choiceRuntime}>
      <FormProvider {...form}>
        <FormActionStatusContext value={{ isPending }}>
          <form
            {...props}
            noValidate
            onSubmit={(event) => startTransition(() => handleFormSubmit(event))}
            aria-busy={isPending}
            data-formulate="form"
          >
            <LayoutBody layout={layout} bodyClassName={bodyClassName}>{children}</LayoutBody>
            {errors.root?.submit?.message ? (
              <p role="alert" data-formulate="submission-error">{errors.root.submit.message}</p>
            ) : null}
          </form>
        </FormActionStatusContext>
      </FormProvider>
    </ChoiceRuntimeContext>
  );
}
