"use client";

import { createContext } from "react";
import type { Control, FieldValues } from "react-hook-form";
import type { ChoiceRule, ChoiceView } from "./definition.js";

export type ChoiceController = {
  get: <Values, Selection, Services, Option>(
    choiceId: string,
    rule: ChoiceRule<Values, Selection, Services, Option>,
  ) => ChoiceView<Option> | undefined;
  /** Discard requests and options while retaining selections. The next binding synchronization can load again. */
  clearRequests: () => void;
};

export type ChoiceRuntimeContextValue = {
  control: Control<FieldValues, unknown, FieldValues>;
  choices: ChoiceController;
};

export const ChoiceRuntimeContext = createContext<ChoiceRuntimeContextValue | null>(null);
