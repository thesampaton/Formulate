"use client";

import { createContext, useContext } from "react";
import type { Control, FieldPath, FieldPathValue, FieldValues } from "react-hook-form";
import { useFormContext } from "react-hook-form";

/** Paths with the same editing contract in both directions: a binding reads and writes. */
export type CompatibleFieldPath<Values extends FieldValues, Value> = {
  [Path in FieldPath<Values>]: [FieldPathValue<Values, Path>] extends [Value]
    ? [Value] extends [FieldPathValue<Values, Path>] ? Path : never
    : never;
}[FieldPath<Values>];

/** Routes each local member to a compatible host path. Nested sections route their own children. */
export type SectionBindings<Members extends FieldValues, Values extends FieldValues> = {
  [Member in keyof Members]: CompatibleFieldPath<Values, Members[Member]>;
};

// Type erasure is confined to the runtime boundary. Public declarations and Bind
// props check the member/control contracts before paths are resolved here.
export type DefinitionScope = {
  identity: symbol;
  control: Control<any, unknown, any>;
  resolve: (name: string) => string;
  resolveChoice: (name: string) => string;
  parent: DefinitionScope | null;
};
export const DefinitionScopeContext = createContext<DefinitionScope | null>(null);

export function useDefinitionScope(identity: symbol, kind: "form" | "section", control?: Control<any, unknown, any>) {
  const parent = useContext(DefinitionScopeContext);
  const form = useFormContext();
  let matching = parent;
  while (matching && matching.identity !== identity) matching = matching.parent;
  if (kind === "section" && !matching) throw new Error("Section members need a matching Section or Bind use.");
  const resolvedControl = control ?? matching?.control ?? form?.control;
  if (!resolvedControl) throw new Error("Defined fields need a parent Form or an explicit control.");
  return {
    control: resolvedControl,
    resolve: matching?.resolve ?? ((name: string) => name),
    resolveChoice: matching?.resolveChoice ?? ((name: string) => name),
    parent,
    form,
  };
}
