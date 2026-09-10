import { useEffect, useMemo, useSyncExternalStore } from "react";
import { get } from "react-hook-form";
import type { DefaultValues, FieldPathByValue, FieldValues } from "react-hook-form";
import type { z } from "zod";
import { useFormulate } from "@formulate/react";
import { createChoiceFields } from "@/lib/choice-fields";
import type { ChoiceLoader } from "@/lib/choice-request";

type ChoiceField<Values extends FieldValues> = {
  id: string;
  name: FieldPathByValue<Values, string>;
  input: string;
};

/** Local integration for string choices whose paths survive schema parsing.
 * One selector supplies request identity, dependency and error path. Keep it stable.
 * Requests belong to this form lifetime, including when their editors unmount. */
export function useChoiceForm<Input extends FieldValues, Output extends FieldValues>({
  schema, defaultValues, loader, fields,
}: {
  schema: z.ZodType<Output, Input>;
  defaultValues: DefaultValues<Input>;
  loader: ChoiceLoader;
  fields: (values: Input | Output) => readonly ChoiceField<Input>[];
}) {
  const choices = useMemo(() => createChoiceFields(loader), [loader]);
  const revision = useSyncExternalStore(choices.subscribe, choices.getSnapshot);
  const validation = useMemo(() => schema.superRefine((values, context) => {
    for (const { id, name, input } of fields(values)) {
      const request = choices.get(id);
      const problem = request ? request.problem(input, get(values, name)) : "Checking available choices…";
      if (problem) context.addIssue({ code: "custom", path: name.split("."), message: problem });
    }
  }), [schema, choices, fields]);
  const form = useFormulate(validation, { defaultValues, shouldFocusError: false });
  useEffect(() => {
    const sync = () => choices.sync(fields(form.getValues()));
    const unsubscribe = form.subscribe({ formState: { values: true }, callback: sync });
    sync();
    return () => { unsubscribe(); choices.clear(); };
  }, [form, choices, fields]);
  useEffect(() => {
    const names = fields(form.getValues()).map(({ name }) => name);
    if (names.length) void form.trigger(names);
  }, [form, fields, revision]);
  return { form, choices, getValidationRevision: choices.getValidationRevision };
}
