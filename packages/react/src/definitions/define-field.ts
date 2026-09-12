import type { ComponentProps } from "react";
import type { FieldValues } from "react-hook-form";
import type { z } from "zod";
import type { ChoiceRule } from "../choices/definition.js";
import type { FieldRootProps } from "../fields/field.js";
import type { ControlSelection, FieldComponentMap } from "./create-formulate.js";

/** Value/form semantics, independent of schemas' representations and UI controls. */
export const primitiveFieldTypes = [
  "text", "number", "boolean", "choice", "multiChoice", "date", "time", "dateTime", "file", "object", "array",
] as const;
export type PrimitiveFieldType = typeof primitiveFieldTypes[number];

export type FieldPresentation = Pick<FieldRootProps<FieldValues, string>,
  "label" | "description" | "className" | "style" | "orientation" | "presentation" | "classNames"
>;

/** Portable source configuration. A consuming control map checks the nominated UI. */
export type FieldDefinition = FieldPresentation & {
  primitive: PrimitiveFieldType;
  schema: z.ZodType;
  defaultValue: unknown;
  component: string;
  componentProps?: object;
  choices?: ChoiceRule<any, any, any, any>;
};

/** Declare once at module scope. Schemas own validation; definitions own no live state. */
export function defineField<const Definition extends FieldDefinition>(
  definition: Definition & { defaultValue: NoInfer<z.input<Definition["schema"]>> },
): Definition {
  return definition;
}

type FieldUseDefaults<Definition extends FieldDefinition> = Partial<FieldPresentation> & {
  defaultValue?: z.input<Definition["schema"]>;
  /** Changing semantics is an explicit derived defineField, not an instance override. */
  schema?: never;
  primitive?: never;
};
type DefaultProps<Definition extends FieldDefinition, Components extends FieldComponentMap> =
  Definition["component"] extends keyof Components ? ComponentProps<Components[Definition["component"]]> : never;
type PropsOf<Value> = Value extends { componentProps: infer Props extends object } ? Props : {};
type FieldOverrides<Definition extends FieldDefinition, Components extends FieldComponentMap> = FieldUseDefaults<Definition> & (
  { component?: never; children?: never; componentProps?: Partial<DefaultProps<Definition, Components>> }
  | ControlSelection<z.input<Definition["schema"]>, Components>
);
type FieldInstance<Definition extends FieldDefinition, Overrides> =
  Overrides extends { component: string } | { children: unknown }
    ? Omit<Definition, keyof Overrides | "component" | "componentProps"> & Overrides
    : Omit<Definition, keyof Overrides | "componentProps"> & Overrides & {
      componentProps: Omit<PropsOf<Definition>, keyof PropsOf<Overrides>> & PropsOf<Overrides>;
    };
type UnknownControlProps<Instance, Components extends FieldComponentMap> =
  Instance extends { component: infer Key extends keyof Components }
    ? Exclude<keyof PropsOf<Instance>, keyof ComponentProps<Components[Key]>> : never;
// Check the resolved declaration so required props can be supplied at either layer.
// Also reject extra props: generic object inference otherwise permits binding overrides.
type CheckedInstance<Definition extends FieldDefinition, Overrides, Components extends FieldComponentMap> =
  FieldInstance<Definition, Overrides> extends FieldPresentation & {
    defaultValue: z.input<Definition["schema"]>;
  } & ControlSelection<z.input<Definition["schema"]>, Components>
    ? [UnknownControlProps<FieldInstance<Definition, Overrides>, Components>] extends [never] ? unknown : never
    : never;

export interface InstantiateField<Components extends FieldComponentMap> {
  /** Shallowly merge default props; an explicit control/children selection replaces them. */
  <const Definition extends FieldDefinition, const Overrides extends FieldOverrides<NoInfer<Definition>, Components> = {}>(
    definition: Definition & CheckedInstance<NoInfer<Definition>, NoInfer<Overrides>, Components>,
    overrides?: Overrides & Record<Exclude<keyof Overrides, keyof FieldUseDefaults<Definition> | "component" | "componentProps" | "children">, never>,
  ): FieldInstance<Definition, Overrides>;
}

/** A field instance is still an ordinary declaration consumed by defineForm/defineSection. */
export function createFieldFactory<Components extends FieldComponentMap>(): InstantiateField<Components> {
  return ((definition: FieldDefinition, overrides: Record<string, unknown> = {}) => {
    const { component: _component, componentProps, ...semantics } = definition;
    if (overrides.children !== undefined) return { ...semantics, ...overrides };
    // An explicit control selection replaces its props, even if the key is unchanged.
    if (overrides.component !== undefined) return { ...semantics, ...overrides };
    return { ...definition, ...overrides, component: definition.component, componentProps: { ...componentProps, ...(overrides.componentProps as object) } };
  }) as InstantiateField<Components>;
}
