"use client";

import { useContext } from "react";
import type { ComponentProps, ComponentType, ReactElement, ReactNode } from "react";
import { get, useWatch } from "react-hook-form";
import type { Control, DefaultValues, FieldPath, FieldPathValue, FieldValues, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import type { ConfiguredFieldProps, ControlSelection, FieldComponentMap } from "./create-formulate.js";
import type { FieldRootProps } from "../fields/field.js";
import { Section as SectionShell } from "../presentation/section.js";
import { Form as FormShell } from "../form/form.js";
import type { FormProps } from "../form/form.js";
import { LayoutBody } from "../presentation/layout.js";
import type { LayoutProps } from "../presentation/layout.js";
import { DefinitionScopeContext, useDefinitionScope } from "./definition-scope.js";
import type { DefinitionScope, SectionBindings } from "./definition-scope.js";
import { useFormulate } from "../form/use-formulate.js";
import type { FormulateOptions } from "../form/use-formulate.js";

import type { BoundChoice, ChoiceRule } from "../choices/definition.js";

export type FormDefinition<Input extends FieldValues, Output extends FieldValues = Input> = {
  /** Validates editing values and parses the accepted submission output. */
  schema: z.ZodType<Output, Input>;
  /** Initial editing values; definitions never own live form state. */
  defaultValues: DefaultValues<NoInfer<Input>>;
};

const sectionRuntime = Symbol("section-definition");
export type SectionPresentationProps = { title: ReactNode } & LayoutProps;
type SectionToken = {
  schema: z.ZodType<FieldValues, FieldValues>;
  defaultValues: FieldValues;
  fieldNames: readonly string[];
  bindChoices: (options: any) => BoundChoice[];
  [sectionRuntime]: {
    identity: symbol;
    title?: ReactNode;
    render: (props: { scope: DefinitionScope; title?: ReactNode; children?: ReactNode } & LayoutProps) => ReactElement;
  };
};
type FieldSchema = { schema: z.ZodType; choices?: ChoiceRule<any, any, any, any> };
type UnionToIntersection<Union> = (Union extends unknown ? (value: Union) => void : never) extends (value: infer Result) => void ? Result : never;
type MemberServices<Member> = Member extends { choices: ChoiceRule<any, any, infer Services, any> } ? Services
  : Member extends { bindChoices: (options: infer Options) => BoundChoice[] } ? Options extends { services: infer Services } ? Services : {} : {};
type Services<Members> = UnionToIntersection<{ [Key in keyof Members]: MemberServices<Members[Key]> }[keyof Members]>;

type Declarations = Record<string, FieldSchema | SectionToken>;
type Shape<Members extends Declarations> = { [Key in keyof Members]: Members[Key]["schema"] };
type FormSchema<Members extends Declarations> = z.ZodObject<Shape<Members>>;
type Inputs<Members extends Declarations> = z.input<FormSchema<Members>>;
type Defaults<Members extends Declarations> = { [Key in keyof Members]: z.input<Members[Key]["schema"]> };
type FieldKeys<Members extends Declarations> = { [Key in keyof Members]: Members[Key] extends SectionToken ? never : Key }[keyof Members] & string;
type SectionKeys<Members extends Declarations> = { [Key in keyof Members]: Members[Key] extends SectionToken ? Key : never }[keyof Members] & string;
type Presentation = Pick<FieldRootProps<FieldValues, string>, "label" | "description" | "className" | "style" | "orientation" | "presentation">;
type Declaration<Schema extends z.ZodType, Components extends FieldComponentMap> = Presentation & {
  schema: Schema;
  defaultValue: NoInfer<z.input<Schema>>;
} & ControlSelection<NoInfer<z.input<Schema>>, Components>;
type CheckedMembers<Members extends Declarations, Components extends FieldComponentMap> = {
  [Key in keyof Members]: Members[Key] extends SectionToken ? Members[Key] : Declaration<Members[Key]["schema"], Components> & { choices?: ChoiceRule<Inputs<Members>, z.input<Members[Key]["schema"]>, any, any> };
};
type DefaultControlProps<Member, Components extends FieldComponentMap> = Member extends { component: infer Key extends keyof Components }
  ? Partial<ComponentProps<Components[Key]>> : never;
type DefinedFieldProps<Members extends Declarations, Name extends FieldKeys<Members>, Output, Components extends FieldComponentMap> =
  Omit<FieldRootProps<Inputs<Members>, FieldPath<Inputs<Members>>, Output>, "name" | "label" | "children"> & {
    name: Name;
    label?: ReactNode;
  } & ({ componentProps?: DefaultControlProps<Members[Name], Components>; children?: never } | { children: ReactNode; componentProps?: never });
type WithoutControl<Props> = Props extends unknown ? Omit<Props, "control"> : never;
type SectionUseProps<Name extends string> = { name: Name; title?: ReactNode; children?: ReactNode } & LayoutProps;
type FieldRenderer<Components extends FieldComponentMap> =
  <Values extends FieldValues, Name extends FieldPath<Values>, Output = Values>(props: ConfiguredFieldProps<Values, Name, Output, Components>) => ReactNode;

type DefinitionOptions<Members extends Declarations, Schema extends z.ZodType<FieldValues, FieldValues>> = LayoutProps & {
  /** Customize validation/output while preserving the complete declared editing shape. */
  schema?: (schema: FormSchema<Members>) => Schema & (
    [z.input<Schema>] extends [Inputs<Members>] ? [Inputs<Members>] extends [z.input<Schema>] ? unknown : never : never
  );
};

export type DefinedForm<Members extends Declarations, Components extends FieldComponentMap, Schema extends z.ZodType<FieldValues, FieldValues> = FormSchema<Members>> = {
  schema: Schema;
  defaultValues: Defaults<Members>;
  /** Bind dependency rules without mounting editors. IDs identify uses; bindings locate editing values. */
  bindChoices: <Values extends FieldValues = Inputs<Members>>(options: {
    values: Values;
    services: Services<Members>;
    id?: string;
  } & (Values extends Inputs<Members> ? { bindings?: SectionBindings<Inputs<Members>, Values> } : { bindings: SectionBindings<Inputs<Members>, Values> })) => BoundChoice[];
  /** All declared leaf field paths, including section descendants, in declaration order. */
  fieldNames: readonly FieldPath<Inputs<Members>>[];
  useForm: (options?: FormulateOptions<Inputs<Members>, z.output<Schema>>) => UseFormReturn<Inputs<Members>, unknown, z.output<Schema>>;
  /** Form shell with this definition's default layout. An explicit layout replaces it. */
  Form: (props: FormProps<Inputs<Members>, z.output<Schema>>) => ReactElement;
  /** Renders a local field, inheriting the form runtime and any section binding. */
  Field: <Name extends FieldKeys<Members>>(props: DefinedFieldProps<Members, Name, z.output<Schema>, Components>) => ReactElement;
  /** Renders members in declaration order, including nested sections. */
  Fields: (props: { control?: Control<Inputs<Members>, unknown, z.output<Schema>> }) => ReactElement[];
  /** Instantiates a declared child section. Its name binds the child's local members. */
  Section: (props: SectionUseProps<SectionKeys<Members>>) => ReactElement;
  /** Alias of Section; a subsection has the same contract and runtime behaviour. */
  Subsection: (props: SectionUseProps<SectionKeys<Members>>) => ReactElement;
  /** Observes one local editing path in the current use. */
  useWatch: <Name extends FieldPath<Inputs<Members>>>(name: Name) => FieldPathValue<Inputs<Members>, Name>;
  /** Returns an event-handler check for local paths. Validation remains in the form schema. */
  useTrigger: () => (name: FieldPath<Inputs<Members>> | readonly FieldPath<Inputs<Members>>[]) => Promise<boolean>;
};

export type DefinedSection<Members extends Declarations, Components extends FieldComponentMap, Schema extends z.ZodType<FieldValues, FieldValues> = FormSchema<Members>> =
  Omit<DefinedForm<Members, Components, Schema>, "useForm" | "Form" | "Field" | "Fields"> & Pick<SectionToken, typeof sectionRuntime> & {
    /** Renders a local field using the runtime and binding supplied by this section use. */
    Field: <Name extends FieldKeys<Members>>(props: WithoutControl<DefinedFieldProps<Members, Name, z.output<Schema>, Components>>) => ReactElement;
    /** Renders local members in order, using the current section binding. */
    Fields: (props: Record<string, never>) => ReactElement[];
    /** Escape hatch for explicit member mappings. Ordinary uses bind through the parent's Section helper. */
    Bind: <Values extends FieldValues, Output>(props: {
      control: Control<Values, unknown, Output>;
      bindings: SectionBindings<Inputs<Members>, NoInfer<Values>>;
      title?: ReactNode;
      children?: ReactNode;
    } & LayoutProps) => ReactElement;
  };
/** A subsection is a section used inside another section, not a separate entity. */
export type DefinedSubsection<Members extends Declarations, Components extends FieldComponentMap, Schema extends z.ZodType<FieldValues, FieldValues> = FormSchema<Members>> = DefinedSection<Members, Components, Schema>;

export interface DefineForm<Components extends FieldComponentMap> {
  <const Members extends Declarations, Schema extends z.ZodType<FieldValues, FieldValues> = FormSchema<Members>>(
    members: Members & CheckedMembers<Members, Components>,
    options?: DefinitionOptions<Members, Schema>,
  ): DefinedForm<Members, Components, Schema>;
}
export interface DefineSection<Components extends FieldComponentMap> {
  <const Members extends Declarations, Schema extends z.ZodType<FieldValues, FieldValues> = FormSchema<Members>>(
    members: Members & CheckedMembers<Members, Components>,
    options?: DefinitionOptions<Members, Schema> & {
      title?: ReactNode;
      /** A component using this definition's local Field/Section helpers and hooks. */
      render?: ComponentType<SectionPresentationProps>;
    },
  ): DefinedSection<Members, Components, Schema>;
}

/** Both factories use the same recursive member model and connected control catalogue. */
export function createDefinitionFactories<Components extends FieldComponentMap>(RenderField: FieldRenderer<Components>) {
  function build(members: Declarations, kind: "form" | "section", options: {
    schema?: (schema: z.ZodObject<any>) => z.ZodType<FieldValues, FieldValues>;
    title?: ReactNode;
    render?: ComponentType<SectionPresentationProps>;
  } & LayoutProps = {}) {
    const identity = Symbol(kind);
    const entries = Object.entries(members);
    for (const [name] of entries) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || ["__proto__", "constructor", "prototype"].includes(name)) {
        throw new Error(`Unsupported field key "${name}". Definitions accept flat identifier keys; declare a section for nested bindings.`);
      }
    }
    const isSection = (member: FieldSchema | SectionToken): member is SectionToken => sectionRuntime in member;
    const objectSchema = z.object(Object.fromEntries(entries.map(([name, member]) => [name, member.schema])));
    const schema = options.schema?.(objectSchema) ?? objectSchema;
    const defaultValues = Object.fromEntries(entries.map(([name, member]) => [name,
      isSection(member) ? member.defaultValues : (member as FieldSchema & { defaultValue: unknown }).defaultValue,
    ]));
    const fieldNames = entries.flatMap(([name, member]) => isSection(member) ? member.fieldNames.map((child) => `${name}.${child}`) : [name]);

    function bindChoices({ values, services, id = "", bindings }: { values: FieldValues; services: unknown; id?: string; bindings?: Record<string, string> }): BoundChoice[] {
      const local = bindings ? Object.fromEntries(entries.map(([name]) => [name, get(values, bindings[name]!)])) : values;
      return entries.flatMap(([name, member]) => {
        const path = bindings?.[name] ?? name;
        const useId = id ? `${id}.${name}` : name;
        if (isSection(member)) return member.bindChoices({ values: local[name], services, id: useId }).map((field) => ({ ...field, name: `${path}.${field.name}` }));
        return member.choices ? [{ ...member.choices.resolve(local, local[name], services), id: useId, name: path }] : [];
      });
    }

    function Field({ name, componentProps, children, control, ...overrides }: any) {
      const scope = useDefinitionScope(identity, kind, control);
      if (!Object.hasOwn(members, name) || isSection(members[name]!)) throw new Error(`Unknown defined field: "${name}".`);
      const { schema: _schema, defaultValue: _defaultValue, choices: _choices, ...presentation } = members[name] as any;
      const selection = children !== undefined
        ? { component: undefined, componentProps: undefined, children }
        : { componentProps: { ...(presentation.componentProps ?? {}), ...componentProps } };
      return <RenderField {...presentation} {...overrides} name={scope.resolve(name)} control={scope.control} {...selection} />;
    }
    function SectionView({ name, title, children, control, layout }: SectionUseProps<string> & { control?: Control<any, unknown, any> }) {
      const parent = useDefinitionScope(identity, kind, control);
      const member = Object.hasOwn(members, name) ? members[name] : undefined;
      if (!member || !isSection(member)) throw new Error(`Unknown defined section: "${name}".`);
      return member[sectionRuntime].render({
        scope: { identity: member[sectionRuntime].identity, control: parent.control, parent: parent.parent,
          resolve: (local) => parent.resolve(`${name}.${local}`) },
        title: title ?? member[sectionRuntime].title ?? name, children, layout,
      });
    }
    function FieldsView({ control }: { control?: Control<any, unknown, any> }) {
      return entries.map(([name, member]) => isSection(member)
        ? <SectionView key={name} name={name} control={control} />
        : <Field key={name} name={name} control={control} />);
    }
    function useDefinedWatch(name: string) {
      const scope = useDefinitionScope(identity, kind);
      return useWatch({ control: scope.control, name: scope.resolve(name) });
    }
    function useDefinedTrigger() {
      const scope = useDefinitionScope(identity, kind);
      if (!scope.form || scope.form.control !== scope.control) throw new Error("Section validation needs the Form that owns its control.");
      const trigger = scope.form.trigger;
      return (name: string | readonly string[]) => trigger(typeof name === "string" ? scope.resolve(name) : name.map(scope.resolve));
    }
    function renderUse({ scope, title = options.title ?? "Section", children, layout = options.layout }: { scope: DefinitionScope; title?: ReactNode; children?: ReactNode } & LayoutProps) {
      const Presentation = options.render;
      return <DefinitionScopeContext value={scope}>
        {children !== undefined ? <LayoutBody layout={layout}>{children}</LayoutBody> : Presentation ? <Presentation title={title} layout={layout} /> :
          <SectionShell title={title} layout={layout}><FieldsView /></SectionShell>}
      </DefinitionScopeContext>;
    }
    function Bind({ control, bindings, title, children, layout }: { control: Control<any, unknown, any>; bindings: Record<string, string>; title?: ReactNode; children?: ReactNode } & LayoutProps) {
      const parent = useContext(DefinitionScopeContext);
      for (const [name] of entries) if (!Object.hasOwn(bindings, name) || !bindings[name]) throw new Error(`Missing section binding: "${name}".`);
      return renderUse({ scope: { identity, control, parent, resolve: (name) => {
        const [head, ...tail] = name.split(".");
        return [bindings[head!]!, ...tail].join(".");
      } }, title, children, layout });
    }
    function useDefinedForm(formOptions?: FormulateOptions<FieldValues, FieldValues>) {
      return useFormulate({ schema, defaultValues }, formOptions);
    }
    function FormView({ layout = options.layout, ...props }: FormProps<FieldValues, FieldValues>) {
      return <FormShell {...props} layout={layout} />;
    }
    return { schema, defaultValues, fieldNames, bindChoices, Form: FormView, Field, Fields: FieldsView, Section: SectionView, Subsection: SectionView,
      useWatch: useDefinedWatch, useTrigger: useDefinedTrigger, useForm: useDefinedForm, Bind,
      [sectionRuntime]: { identity, title: options.title, render: renderUse } };
  }
  // The public mapped types retain declaration/schema/name relationships; the
  // dynamic recursive renderer above erases them only at this implementation boundary.
  return {
    defineForm: ((members, options) => build(members, "form", options)) as DefineForm<Components>,
    defineSection: ((members, options) => build(members, "section", options)) as DefineSection<Components>,
  };
}
