"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, FormEvent } from "react";
import { FormProvider, set } from "react-hook-form";
import type { FieldErrors, FieldPath, FieldValues, SubmitErrorHandler, SubmitHandler, UseFormReturn } from "react-hook-form";
import { FormActionStatusContext } from "./form-action-status.js";
import { LayoutBody } from "./layout.js";
import type { LayoutProps } from "./layout.js";

export type FormNavigationAction<Input extends FieldValues> = {
  /** Identity of this page visit/action. Change it to cancel a previous check; use useFormNavigation().revision. */
  id: string | number;
  /** Only errors at these RHF paths gate this action. The resolver still evaluates the form schema. */
  fields: readonly FieldPath<Input>[];
  /** Runs after this scope passes. Receives no payload: scoped validity does not prove the whole form's parsed output. */
  onValid: () => Promise<void> | void;
};

export type FormProps<Input extends FieldValues, Output extends FieldValues = Input> =
  Omit<ComponentPropsWithoutRef<"form">, "onSubmit" | "onInvalid" | "noValidate"> & LayoutProps & {
    form: UseFormReturn<Input, unknown, Output>;
    onSubmit: SubmitHandler<Output>;
    onInvalid?: SubmitErrorHandler<Input>;
    /** When present, submit/Enter checks this navigation scope instead of invoking the final onSubmit handler. */
    navigation?: FormNavigationAction<Input>;
    /** Read a stable revision of external validation evidence. A changed revision cancels callbacks
     * from a pending check, including final submission. Read the live source, not a render snapshot. */
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
  const pending = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const epoch = useRef(0);
  const live = useRef(false);
  const subscription = useRef<(() => void) | undefined>(undefined);
  const validationSource = useRef(getValidationRevision);
  useEffect(() => { validationSource.current = getValidationRevision; }, [getValidationRevision]);
  const { errors } = form.formState;
  const scopeKey = JSON.stringify(navigation?.fields);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      epoch.current++;
      subscription.current?.();
    };
  }, [form.control, navigation?.id, scopeKey]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Close the gap before React renders pending state, including async validation.
    if (pending.current) return;
    pending.current = true;
    setIsPending(true);
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
        const fields = [...navigation.fields];
        const valid = fields.length === 0 || await form.trigger(fields, { shouldFocus: false });
        if (!current()) return;
        if (valid) {
          handlerStarted = true;
          await navigation.onValid();
        }
        else {
          const scopedErrors: FieldErrors<Input> = {};
          for (const name of fields) {
            const error = form.getFieldState(name).error;
            if (error) set(scopedErrors, name, error);
          }
          if (onInvalid) await onInvalid(scopedErrors, event);
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
            await onSubmit(values, event);
          },
          async (invalid) => { if (current()) await onInvalid?.(invalid, event); },
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
      if (live.current) setIsPending(false);
    }
  }

  return (
    <FormProvider {...form}>
      <FormActionStatusContext value={{ isPending }}>
        <form {...props} noValidate onSubmit={submit} aria-busy={isPending} data-formulate="form">
          <LayoutBody layout={layout}>{children}</LayoutBody>
          {errors.root?.submit?.message ? (
            <p role="alert" data-formulate="submission-error">{errors.root.submit.message}</p>
          ) : null}
        </form>
      </FormActionStatusContext>
    </FormProvider>
  );
}
