"use client";

import { createContext, useContext } from "react";

export const FormActionStatusContext = createContext<{ isPending: boolean } | null>(null);

/** Pending state for the enclosing Form's scoped navigation or final submission, including its awaited handler. */
export function useFormActionStatus() {
  const state = useContext(FormActionStatusContext);
  if (!state) throw new Error("useFormActionStatus needs a parent Form.");
  return state;
}
