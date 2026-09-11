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
  schemaOrDefinition: z.ZodType<Output, Input> | FormDefinition<Input, Output>,
  options: FormulateOptions<NoInfer<Input>, NoInfer<Output>> = {},
) {
  const definition = "schema" in schemaOrDefinition ? schemaOrDefinition : undefined;
  const schema = definition ? definition.schema : schemaOrDefinition as z.ZodType<Output, Input>;
  const { defaultValues: defaultValueOverrides, ...formOptions } = options;
  // Merge static prefills by field, not by nested property. Structured editing
  // values stay atomic; schema-first and async RHF defaults keep their semantics.
  const defaultValues = definition && typeof defaultValueOverrides !== "function"
    ? { ...definition.defaultValues, ...defaultValueOverrides } as DefaultValues<Input>
    : defaultValueOverrides;
  return useForm<Input, unknown, Output>({
    mode: "onBlur",
    ...formOptions,
    defaultValues,
    resolver: zodResolver(schema),
    shouldUnregister: false,
  });
}
