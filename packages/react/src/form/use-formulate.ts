"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { DefaultValues, FieldValues, UseFormProps } from "react-hook-form";
import type { z } from "zod";
import type { FormDefinition } from "../definitions/define-form.js";

export type FormulateOptions<Input extends FieldValues, Output extends FieldValues = Input> =
  Omit<UseFormProps<Input, unknown, Output>, "resolver" | "shouldUnregister">;

/** Validation lives at the form boundary, even when an editor unmounts. */
export function useFormulate<Input extends FieldValues, Output extends FieldValues = Input>(
  source: z.ZodType<Output, Input> | FormDefinition<Input, Output>,
  options: FormulateOptions<NoInfer<Input>, NoInfer<Output>> = {},
) {
  const definition = "schema" in source ? source : undefined;
  const schema = definition ? definition.schema : source as z.ZodType<Output, Input>;
  const { defaultValues: overrides, ...formOptions } = options;
  // Merge static prefills by field, not by nested property. Structured editing
  // values stay atomic; schema-first and async RHF defaults keep their semantics.
  const defaultValues = definition && typeof overrides !== "function"
    ? { ...definition.defaultValues, ...overrides } as DefaultValues<Input>
    : overrides;
  return useForm<Input, unknown, Output>({
    mode: "onBlur",
    ...formOptions,
    defaultValues,
    resolver: zodResolver(schema),
    shouldUnregister: false,
  });
}
