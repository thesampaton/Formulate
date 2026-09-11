"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useFormulate } from "../form/use-formulate.js";
import type { FormulateOptions } from "../form/use-formulate.js";
import { createChoiceStore } from "./store.js";
import type { BoundChoice } from "./definition.js";
import type { ChoiceController } from "./context.js";

/** RHF's runtime plus the dependent-choice evidence installed for that form. */
export type ChoiceFormRuntime<Input extends FieldValues, Output extends FieldValues = Input> =
  UseFormReturn<Input, unknown, Output> & {
    readonly choices: ChoiceController;
    readonly getValidationRevision: () => string;
  };

/** Dependencies validate editing values before schema parsing can rename or remove paths. */
export function useChoiceForm<Input extends FieldValues, Output extends FieldValues>({
  schema,
  getChoiceBindings,
  ...formOptions
}: {
  schema: z.ZodType<Output, Input>;
  getChoiceBindings: (values: Input) => readonly BoundChoice[];
} & FormulateOptions<Input, Output>): ChoiceFormRuntime<Input, Output> {
  const choiceStore = useMemo(() => createChoiceStore(), []);
  const choices = useMemo<ChoiceController>(() => ({
    get: choiceStore.get,
    clearRequests: choiceStore.clearRequests,
  }), [choiceStore]);
  const previousFieldPaths = useRef<FieldPath<Input>[]>([]);
  const choiceRevision = useSyncExternalStore(choiceStore.subscribe, choiceStore.getSnapshot, choiceStore.getSnapshot);
  const validationSchema = useMemo(() => z.custom<Input>().transform(async (values, context) => {
    const choiceBindings = getChoiceBindings(values);
    const parseResult = await schema.safeParseAsync(values);
    if (!parseResult.success) {
      for (const issue of parseResult.error.issues) context.addIssue({ ...issue });
    }

    for (const binding of choiceBindings) {
      const validationMessage = choiceStore.getValidationMessage(binding);
      if (validationMessage) {
        context.addIssue({ code: "custom", path: binding.fieldPath.split("."), message: validationMessage });
      }
    }

    return parseResult.success ? parseResult.data : z.NEVER;
  }), [schema, choiceStore, getChoiceBindings]);
  const form = useFormulate<Input, Output>(validationSchema as unknown as z.ZodType<Output, Input>, {
    shouldFocusError: false,
    ...formOptions,
  });
  const choiceForm = useMemo(() => Object.assign(form, {
    choices,
    getValidationRevision: choiceStore.getValidationRevision,
  }) as ChoiceFormRuntime<Input, Output>, [form, choices, choiceStore]);

  useEffect(() => () => choiceStore.clearRequests(), [choiceStore]);
  useEffect(() => {
    const syncChoiceBindings = () => choiceStore.syncBindings(getChoiceBindings(form.getValues()));
    const unsubscribe = form.subscribe({ formState: { values: true }, callback: syncChoiceBindings });
    syncChoiceBindings();
    return unsubscribe;
  }, [form, choiceStore, getChoiceBindings]);
  useEffect(() => {
    const fieldPaths = getChoiceBindings(form.getValues()).map(({ fieldPath }) => fieldPath as FieldPath<Input>);
    const affectedFieldPaths = [...new Set([...previousFieldPaths.current, ...fieldPaths])];
    previousFieldPaths.current = fieldPaths;
    if (affectedFieldPaths.length) void form.trigger(affectedFieldPaths);
  }, [form, getChoiceBindings, choiceRevision]);

  return choiceForm;
}
