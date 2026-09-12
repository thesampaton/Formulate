"use client";

import { useFieldContext } from "./field-context.js";
import type { createStringComposer } from "./string-composition.js";

export type CompositionRuntime = ReturnType<typeof createStringComposer> & {
  synchronize: (validate?: boolean, fresh?: boolean) => void;
};

// Keyed by the owning runtime, so explicit controls cannot accidentally read the
// surrounding form. Weak keys follow the same lifetime as RHF's control.
const runtimes = new WeakMap<object, CompositionRuntime>();
export function installCompositionRuntime(control: object, runtime: CompositionRuntime) {
  runtimes.set(control, runtime);
}

/** Connected controls edit fragments through the existing scalar field binding. */
export function useComposedFieldBinding() {
  const { binding: field, control } = useFieldContext<string>();
  const runtime = runtimes.get(control);
  if (typeof field.value !== "string") throw new Error(`Field "${field.name}": composition requires a string editing value.`);
  if (!runtime) throw new Error(`Field "${field.name}" needs a Formulate composition runtime.`);
  const segments = runtime.view(field.name, field.value);
  return {
    ...field,
    segments,
    onInputChange(index: number, value: string) {
      if (field.disabled) return;
      field.onChange(runtime.edit(field.name, field.value, index, value));
      runtime.synchronize();
    },
  };
}
