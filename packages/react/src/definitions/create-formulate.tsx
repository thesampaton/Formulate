"use client";

import { createElement } from "react";
import type { ComponentProps, ComponentType, ReactNode } from "react";
import type { FieldPath, FieldPathValue, FieldValues } from "react-hook-form";
import { createDefinitionFactories } from "./define-form.js";
import { FieldRoot } from "../fields/field.js";
import type { FieldRootProps, FieldPresentationProps } from "../fields/field.js";
import { CheckboxControl, InputControl, NumberControl } from "../fields/controls.js";
import type { ControlValue, FieldControlComponent } from "../fields/controls.js";

// The map is heterogeneous; each key's concrete props/value are retained below.
export type FieldComponentMap = Record<string, FieldControlComponent<any, any>>;

type ComponentConfiguration<Component extends FieldComponentMap[string]> =
  {} extends ComponentProps<Component>
    ? {
      /** Props for the selected component, such as type, placeholder, or className. The connected control manages its value and events. */
      componentProps?: ComponentProps<Component>;
    }
    : {
      /** Props required by the selected component. The connected control manages its value and events. */
      componentProps: ComponentProps<Component>;
    };

export type ControlSelection<Value, Components extends FieldComponentMap> = {
  [Key in keyof Components & string]: [Value] extends [ControlValue<Components[Key]>]
    ? {
      /** Control key from the createFormulate components map. Only controls compatible with this field's editing value are accepted. */
      component: Key;
      children?: never;
    } & ComponentConfiguration<Components[Key]>
    : never;
}[keyof Components & string] | {
  /** Connected control children instead of a component key. Read the field binding with useFieldControl. */
  children: ReactNode;
  component?: never;
  componentProps?: never;
};

export type ConfiguredFieldProps<Values extends FieldValues, Name extends FieldPath<Values>, Output, Components extends FieldComponentMap> =
  Omit<FieldRootProps<Values, Name, Output>, "children"> & ControlSelection<FieldPathValue<NoInfer<Values>, NoInfer<Name>>, Components>;

/** Call once at module scope. Configuration selects UI, never values or rules. */
export function createFormulate<const Components extends FieldComponentMap>({ components, fieldPresentation }: {
  components: Components;
  fieldPresentation?: ComponentType<FieldPresentationProps>;
}) {
  function Field<Values extends FieldValues, Name extends FieldPath<Values>, Output = Values>(
    { component, componentProps, children, ...props }: ConfiguredFieldProps<Values, Name, Output, Components>,
  ) {
    if (component === undefined) return <FieldRoot presentation={fieldPresentation} {...props}>{children}</FieldRoot>;
    const Component = Object.hasOwn(components, component) ? components[component] : undefined;
    if (!Component) throw new Error(`Unknown Formulate field component: "${component}".`);
    return <FieldRoot presentation={fieldPresentation} {...props}>{createElement(Component, componentProps)}</FieldRoot>;
  }
  return { Field, ...createDefinitionFactories<Components>(Field) };
}

export const defaultComponents = { input: InputControl, number: NumberControl, checkbox: CheckboxControl };
export const { Field, defineForm, defineSection } = createFormulate({ components: defaultComponents });
export type FieldProps<Values extends FieldValues, Name extends FieldPath<Values>, Output = Values> =
  ConfiguredFieldProps<Values, Name, Output, typeof defaultComponents>;
