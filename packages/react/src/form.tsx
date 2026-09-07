"use client";

import { useRef } from "react";
import type { ComponentPropsWithoutRef, FormEvent } from "react";
import { FormProvider } from "react-hook-form";
import type { FieldValues, SubmitErrorHandler, SubmitHandler, UseFormReturn } from "react-hook-form";

export type FormProps<Input extends FieldValues, Output extends FieldValues = Input> =
  Omit<ComponentPropsWithoutRef<"form">, "onSubmit" | "onInvalid" | "noValidate"> & {
    form: UseFormReturn<Input, unknown, Output>;
    onSubmit: SubmitHandler<Output>;
    onInvalid?: SubmitErrorHandler<Input>;
    submissionErrorMessage?: string;
  };

export function Form<Input extends FieldValues, Output extends FieldValues = Input>({
  form,
  onSubmit,
  onInvalid,
  submissionErrorMessage = "Unable to submit. Please try again.",
  children,
  ...props
}: FormProps<Input, Output>) {
  const pending = useRef(false);
  const { isSubmitting, errors } = form.formState;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Close the gap before React renders isSubmitting, including async validation.
    if (pending.current) return;
    pending.current = true;
    form.clearErrors("root.submit");
    try {
      await form.handleSubmit(onSubmit, onInvalid)(event);
    } catch {
      form.setError("root.submit", { type: "submission", message: submissionErrorMessage });
    } finally {
      pending.current = false;
    }
  }

  return (
    <FormProvider {...form}>
      <form {...props} noValidate onSubmit={submit} aria-busy={isSubmitting} data-formulate="form">
        {children}
        {errors.root?.submit?.message ? (
          <p role="alert" data-formulate="submission-error">{errors.root.submit.message}</p>
        ) : null}
      </form>
    </FormProvider>
  );
}
