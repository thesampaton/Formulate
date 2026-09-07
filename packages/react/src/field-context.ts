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

export const FieldContext = createContext<FieldControlBinding<unknown> | null>(null);

/** For connected control authors. The adapter declares its accepted editing value. */
export function useFieldControl<Value>(): FieldControlBinding<Value> {
  const field = useContext(FieldContext);
  if (!field) throw new Error("A Formulate control must be rendered inside a Field.");
  return field as FieldControlBinding<Value>;
}
