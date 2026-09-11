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
export function useChoiceForm<Input extends FieldValues, Output extends FieldValues>({ schema, fields, ...formOptions }: {
  schema: z.ZodType<Output, Input>;
  fields: (values: Input) => readonly BoundChoice[];
} & FormulateOptions<Input, Output>) {
  const choices = useMemo(() => createChoiceStore(), []);
  const publicChoices = useMemo(() => ({ get: choices.get, clear: choices.clear }), [choices]);
  const previousNames = useRef<FieldPath<Input>[]>([]);
  const revision = useSyncExternalStore(choices.subscribe, choices.getSnapshot, choices.getSnapshot);
  const validation = useMemo(() => z.custom<Input>().transform(async (values, context) => {
    const bound = fields(values);
    const parsed = await schema.safeParseAsync(values);
    if (!parsed.success) for (const issue of parsed.error.issues) context.addIssue({ ...issue });
    for (const field of bound) {
      const problem = choices.problem(field);
      if (problem) context.addIssue({ code: "custom", path: field.name.split("."), message: problem });
    }
    return parsed.success ? parsed.data : z.NEVER;
  }), [schema, choices, fields]);
  const form = useFormulate<Input, Output>(validation as unknown as z.ZodType<Output, Input>, {
    shouldFocusError: false,
    ...formOptions,
  });
  const choiceForm = useMemo(() => Object.assign(form, {
    choices: publicChoices,
    getValidationRevision: choices.getValidationRevision,
  }) as ChoiceFormRuntime<Input, Output>, [form, publicChoices, choices]);
  useEffect(() => () => choices.clear(), [choices]);
  useEffect(() => {
    const sync = () => choices.sync(fields(form.getValues()));
    const unsubscribe = form.subscribe({ formState: { values: true }, callback: sync });
    sync();
    return unsubscribe;
  }, [form, choices, fields]);
  useEffect(() => {
    const names = fields(form.getValues()).map(({ name }) => name as FieldPath<Input>);
    const affected = [...new Set([...previousNames.current, ...names])];
    previousNames.current = names;
    if (affected.length) void form.trigger(affected);
  }, [form, fields, revision]);
  return { form: choiceForm, choices: publicChoices, getValidationRevision: choices.getValidationRevision };
}
