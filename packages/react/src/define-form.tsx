"use client";

import type { ComponentProps, ReactElement, ReactNode } from "react";
import type { Control, DefaultValues, FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import type { ConfiguredFieldProps, ControlSelection, FieldComponentMap } from "./create-formulate.js";
import type { FieldRootProps } from "./field.js";
import { useFormulate } from "./use-formulate.js";
import type { FormulateOptions } from "./use-formulate.js";

export type FormDefinition<Input extends FieldValues, Output extends FieldValues = Input> = {
  /** Zod schema for the complete form: accepts editing values and parses validated submission values. */
  schema: z.ZodType<Output, Input>;
  /** Initial editing values, matching the Zod schema's input type before any transforms. */
  defaultValues: DefaultValues<NoInfer<Input>>;
};

type FieldSchema<Schema extends z.ZodType = z.ZodType> = {
  /** Zod schema for this field. Defines its editing input, validation, and parsed output, even when the field is unmounted. */
  schema: Schema;
};
type Declarations = Record<string, FieldSchema>;
type Shape<Fields extends Declarations> = { [Key in keyof Fields]: Fields[Key]["schema"] };
type FormSchema<Fields extends Declarations> = z.ZodObject<Shape<Fields>>;
type Inputs<Fields extends Declarations> = z.input<FormSchema<Fields>>;
type Outputs<Fields extends Declarations> = z.output<FormSchema<Fields>>;
type Presentation = Pick<FieldRootProps<FieldValues, string>, "label" | "description" | "className" | "style">;

type Declaration<Schema extends z.ZodType, Components extends FieldComponentMap> = Presentation & FieldSchema<Schema> & {
  /** Initial editing value. Must match z.input<typeof schema>, before Zod transforms; required even if the schema has a Zod default. */
  defaultValue: NoInfer<z.input<Schema>>;
} & ControlSelection<NoInfer<z.input<Schema>>, Components>;

type DefaultControlProps<Declaration, Components extends FieldComponentMap> =
  Declaration extends { component: infer Key extends keyof Components }
    ? Partial<ComponentProps<Components[Key]>> : never;

type DefinedFieldProps<Fields extends Declarations, Name extends keyof Fields & string, Components extends FieldComponentMap> =
  Omit<FieldRootProps<Inputs<Fields>, FieldPath<Inputs<Fields>>, Outputs<Fields>>, "name" | "label" | "children"> & {
    /** Field key from this form's declarations. Reuses its schema, default value, and presentation. */
    name: Name;
    /** Overrides the declared label for this rendering of the field. */
    label?: ReactNode;
  } & (
    {
      /** Props shallow-merged over the declared control props. Use className here to style the control. */
      componentProps?: DefaultControlProps<Fields[Name], Components>;
      children?: never;
    } |
    {
      /** Connected control children replacing the declared component. Read the field binding with useFieldControl. */
      children: ReactNode;
      componentProps?: never;
    }
  );

type FieldRenderer<Components extends FieldComponentMap> =
  <Values extends FieldValues, Name extends FieldPath<Values>, Output = Values>(props: ConfiguredFieldProps<Values, Name, Output, Components>) => ReactNode;

/** A reusable form definition. Each useForm call owns a separate form runtime. */
export type DefinedForm<Fields extends Declarations, Components extends FieldComponentMap> = {
  /** Combined Zod object schema. Use z.input<typeof schema> for editing values and z.output<typeof schema> for submissions. */
  schema: FormSchema<Fields>;
  /** Initial editing values derived from each declaration's defaultValue. */
  defaultValues: DefaultValues<Inputs<Fields>>;
  /**
   * Creates an independent form runtime using this definition's Zod schema and defaults.
   * Static defaultValues overrides merge by top-level field; async defaults must return the complete record.
   * Call as a React hook, then pass the result to <Form form={form}>.
   */
  useForm: (options?: FormulateOptions<Inputs<Fields>, Outputs<Fields>>) => UseFormReturn<Inputs<Fields>, unknown, Outputs<Fields>>;
  /** Renders one declared field by name. Inherits control from the parent Form; presentation props may be overridden. */
  Field: <Name extends keyof Fields & string>(props: DefinedFieldProps<Fields, Name, Components>) => ReactElement;
  /** Renders every declared field in declaration order. Inherits control from the parent Form unless explicitly supplied. */
  Fields: (props: {
    /** RHF control override. Defaults to the parent Form's control. */
    control?: Control<Inputs<Fields>, unknown, Outputs<Fields>>;
  }) => ReactElement[];
};

export interface DefineForm<Components extends FieldComponentMap> {
  /**
   * Declares a form once at module scope using Zod field schemas, editing defaults, and control presentation.
   * Field keys must be flat identifiers (for example, email); nested paths are not supported yet.
   * Returns the combined schema, defaultValues, a useForm hook, and bound Field / Fields components.
   *
   * @param declarations Fields keyed by name. Each supplies a Zod schema, defaultValue, label, and component key or connected children.
   * @example
   * const SignIn = defineForm({
   *   email: { schema: z.email(), defaultValue: "", label: "Email", component: "input", componentProps: { type: "email" } },
   * });
   * // Inside a React component: const form = SignIn.useForm();
   */
  <const Fields extends Declarations>(
    declarations: Fields & { [Key in keyof Fields]: Declaration<Fields[Key]["schema"], Components> },
  ): DefinedForm<Fields, Components>;
}

/** Internal factory shared by the default and application-configured catalogues. */
export function createDefinitionFactory<Components extends FieldComponentMap>(RenderField: FieldRenderer<Components>): DefineForm<Components> {
  return function defineForm<const Fields extends Declarations>(
    declarations: Fields & { [Key in keyof Fields]: Declaration<Fields[Key]["schema"], Components> },
  ) {
    const entries = Object.entries(declarations);
    for (const [name] of entries) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || ["__proto__", "constructor", "prototype"].includes(name)) {
        throw new Error(`Unsupported field key "${name}". defineForm currently accepts flat identifier keys; use a schema for nested bindings.`);
      }
    }
    // Object.entries erases key relationships. These assertions restore the
    // mapped types after deriving both records from the same checked declarations.
    const schema = z.object(Object.fromEntries(entries.map(([name, field]) => [name, field.schema])) as Shape<Fields>);
    const defaultValues = Object.fromEntries(entries.map(([name, field]) => [name, field.defaultValue])) as DefaultValues<Inputs<Fields>>;

    function Field<Name extends keyof Fields & string>({ name, componentProps, children, ...overrides }: DefinedFieldProps<Fields, Name, Components>) {
      if (!Object.hasOwn(declarations, name)) throw new Error(`Unknown defined field: "${name}".`);
      const { schema: _schema, defaultValue: _defaultValue, ...presentation } = declarations[name];
      // Rules and defaults never come from mounted presentations. Per-use props
      // only customize the shell and the selected control (or replace it with children).
      const selection = children !== undefined
        ? { component: undefined, componentProps: undefined, children }
        : { componentProps: { ...(presentation.componentProps ?? {}), ...componentProps } };
      const props = { ...presentation, ...overrides, name, ...selection };
      // The checked declaration pairs this flat key with its schema and control.
      // TS cannot carry that relationship through the dynamic presentation merge.
      return <RenderField {...props as unknown as ConfiguredFieldProps<Inputs<Fields>, FieldPath<Inputs<Fields>>, Outputs<Fields>, Components>} />;
    }

    function FieldsView({ control }: { control?: Control<Inputs<Fields>, unknown, Outputs<Fields>> }) {
      return entries.map(([name]) => <Field key={name} name={name as keyof Fields & string} control={control} />);
    }

    const definition = { schema, defaultValues };

    function useDefinedForm(options?: FormulateOptions<Inputs<Fields>, Outputs<Fields>>) {
      return useFormulate<Inputs<Fields>, Outputs<Fields>>(definition, options);
    }

    return { ...definition, useForm: useDefinedForm, Field, Fields: FieldsView };
  };
}
