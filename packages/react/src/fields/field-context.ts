"use client";

import { createContext, useContext } from "react";
import type { RefCallback } from "react";

export type FieldControlBinding<Value> = {
  name: string;
  value: Value;
  onChange: (value: Value) => void;
  onBlur: () => void;
  ref: RefCallback<HTMLElement>;
  id: string;
  disabled?: boolean;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
};

/** Shared field scope. Keep runtime metadata separate from spreadable control props. */
export type FieldContextValue<Value> = {
  binding: FieldControlBinding<Value>;
  /** Identity of the resolved RHF owner, including an explicit control override. */
  control: object;
};

export const FieldContext = createContext<FieldContextValue<unknown> | null>(null);

/** Feature bindings extend this shared scope without adding a provider per feature. */
export function useFieldContext<Value>(): FieldContextValue<Value> {
  const field = useContext(FieldContext);
  if (!field) {
    throw new Error("A Formulate control must be rendered inside a Field.");
  }
  return field as FieldContextValue<Value>;
}

/** For connected control authors. The adapter declares its accepted editing value. */
export function useFieldBinding<Value>(): FieldControlBinding<Value> {
  return useFieldContext<Value>().binding;
}
