"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import type { DefaultValues, FieldPath, FieldPathValue, FieldValues, UseFormProps } from "react-hook-form";
import type { z } from "zod";
import type { FormDefinition } from "../definitions/define-form.js";
import { createStringComposer } from "../fields/string-composition.js";
import { installCompositionRuntime } from "../fields/use-composed-field-binding.js";

export type FormulateOptions<Input extends FieldValues, Output extends FieldValues = Input> =
  Omit<UseFormProps<Input, unknown, Output>, "resolver" | "shouldUnregister"> & {
    /** External, non-submitted sources for composition context segments. */
    compositionContext?: unknown;
  };

/** Validation lives at the form boundary, even when an editor unmounts. */
export function useFormulate<Input extends FieldValues, Output extends FieldValues = Input>(
  schemaOrDefinition: z.ZodType<Output, Input> | FormDefinition<Input, Output>,
  options: FormulateOptions<NoInfer<Input>, NoInfer<Output>> = {},
) {
  const definition = "schema" in schemaOrDefinition ? schemaOrDefinition : undefined;
  const schema = definition ? definition.schema : schemaOrDefinition as z.ZodType<Output, Input>;
  const { defaultValues: defaultValueOverrides, compositionContext, ...formOptions } = options;
  const context = useRef(compositionContext);
  context.current = compositionContext;
  const composer = useMemo(() => createStringComposer(definition?.compositions ?? []), [definition?.compositions]);
  // Merge static prefills by field, not by nested property. Structured editing
  // values stay atomic; schema-first and async RHF defaults keep their semantics.
  const suppliedDefaults = definition && typeof defaultValueOverrides !== "function"
    ? { ...definition.defaultValues, ...defaultValueOverrides } as DefaultValues<Input>
    : defaultValueOverrides;
  // RHF caches defaults on mount. Resolve construction before it records that
  // baseline, so an empty seed with fixed affixes does not make a new form dirty.
  const defaultValues = useMemo(() => typeof suppliedDefaults === "function"
    ? async () => composer.compose(await suppliedDefaults(), context.current, true).values as Input
    : suppliedDefaults ? composer.compose(suppliedDefaults, context.current, true).values as DefaultValues<Input> : undefined,
  [composer]);
  const values = useMemo(() => formOptions.values && definition?.compositions?.length
    ? createStringComposer(definition.compositions).compose(formOptions.values, context.current, true).values as Input
    : formOptions.values,
  [formOptions.values, composer]);
  const resolve = zodResolver(schema);
  const form = useForm<Input, unknown, Output>({
    mode: "onBlur",
    ...formOptions,
    values,
    defaultValues,
    resolver: (values, resolverContext, resolverOptions) => {
      // Also cover immediate programmatic validation before the queued source
      // subscription runs. The schema always receives the final scalar values.
      runtime.synchronize();
      return resolve(composer.compose(values, context.current).values as Input, resolverContext, resolverOptions);
    },
    shouldUnregister: false,
  });
  const resetForm = useRef(form.reset).current;
  const setFormValue = useRef(form.setValue).current;
  const setFormValues = useRef(form.setValues).current;
  const defaultBaseline = useRef(form.formState.defaultValues);
  const observedDefaults = useRef(form.formState.defaultValues);
  if (observedDefaults.current !== form.formState.defaultValues) {
    observedDefaults.current = form.formState.defaultValues;
    defaultBaseline.current = form.formState.defaultValues;
  }
  const runtime = useMemo(() => {
    let writing = false;
    const pendingValidation = new Set<FieldPath<Input>>();
    return {
      ...composer,
      get writing() { return writing; },
      reset: ((values, options) => {
        const supplied = typeof values === "function" ? values(form.getValues()) : values ?? defaultBaseline.current;
        const canonical = supplied ? composer.compose(supplied, context.current, true).values : supplied;
        // RHF must record the same canonical baseline it displays; writing only
        // after reset would compare subsequent edits with stale/raw affixes.
        if (!options?.keepDefaultValues) defaultBaseline.current = canonical as typeof defaultBaseline.current;
        resetForm(canonical as Parameters<typeof form.reset>[0], options);
        runtime.synchronize(false, true);
      }) as typeof form.reset,
      setValue: ((name, value, options) => {
        setFormValue(name, value, options);
        runtime.synchronize(true);
      }) as typeof form.setValue,
      setValues: ((values, options) => {
        setFormValues(values, options);
        runtime.synchronize(true);
      }) as typeof form.setValues,
      synchronize(validate = false, fresh = false) {
        if (writing || form.formState.isLoading) return;
        const { changes } = composer.compose(form.getValues(), context.current, fresh);
        if (fresh) pendingValidation.clear();
        writing = true;
        try {
          for (const { name, value } of changes) {
            if (!fresh) pendingValidation.add(name as FieldPath<Input>);
            setFormValue(name as FieldPath<Input>, value as FieldPathValue<Input, FieldPath<Input>>, {
              shouldDirty: !fresh, shouldTouch: false, shouldValidate: false,
            });
          }
        } finally {
          writing = false;
        }
        // A resolver may already have synchronized a source's dependants while
        // RHF only applies errors to that source. Retain the affected paths until
        // the notification/setter can validate the composed fields themselves.
        if (validate && pendingValidation.size) {
          const paths = [...pendingValidation];
          pendingValidation.clear();
          void form.trigger(paths);
        }
      },
    };
  }, [composer, form, resetForm, setFormValue, setFormValues]);
  installCompositionRuntime(form.control, runtime);
  const installedForm = Object.assign(form, { synchronizeComposedValues: runtime.synchronize });
  if (definition?.compositions?.length) Object.assign(installedForm, { reset: runtime.reset, setValue: runtime.setValue, setValues: runtime.setValues });
  useLayoutEffect(() => {
    if (!definition?.compositions?.length) return;
    let active = true;
    let queued = false;
    const unsubscribe = form.subscribe({ formState: { values: true }, callback: () => {
      if (runtime.writing) return;
      if (queued) return;
      queued = true;
      // RHF subscriptions are read-only. Write after notification completes.
      queueMicrotask(() => {
        queued = false;
        if (!active) return;
        runtime.synchronize(true);
      });
    } });
    runtime.synchronize(false, true);
    return () => { active = false; unsubscribe(); };
  }, [form, runtime, definition?.compositions]);
  const previousContext = useRef(compositionContext);
  useLayoutEffect(() => {
    if (!Object.is(previousContext.current, compositionContext)) {
      previousContext.current = compositionContext;
      runtime.synchronize(true);
    }
  }, [compositionContext, runtime]);
  return installedForm;
}
