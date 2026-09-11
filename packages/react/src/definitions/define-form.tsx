"use client";

import { useCallback, useContext, useMemo } from "react";
import type { ComponentProps, ComponentType, ReactElement, ReactNode } from "react";
import { get, useWatch } from "react-hook-form";
import type { Control, DefaultValues, FieldPath, FieldPathValue, FieldValues, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import type { ConfiguredFieldProps, ControlSelection, FieldComponentMap } from "./create-formulate.js";
import type { FieldRootProps } from "../fields/field.js";
import { Section as SectionShell } from "../presentation/section.js";
import { Form as FormShell } from "../form/form.js";
import type { FormProps, FormScope } from "../form/form.js";
import { LayoutBody } from "../presentation/layout.js";
import type { LayoutProps } from "../presentation/layout.js";
import { DefinitionScopeContext, useDefinitionScope } from "./definition-scope.js";
import type { DefinitionScope, SectionBindings } from "./definition-scope.js";
import { useFormulate } from "../form/use-formulate.js";
import type { FormulateOptions } from "../form/use-formulate.js";

import { useChoiceForm as useChoiceFormRuntime } from "../choices/use-choice-form.js";
import type { ChoiceFormRuntime } from "../choices/use-choice-form.js";
import { ChoiceRuntimeContext } from "../choices/context.js";
import type { BoundChoice, ChoiceRule, ChoiceView } from "../choices/definition.js";

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
type SectionInputs<Members extends Declarations, Name extends SectionKeys<Members>> =
  Members[Name] extends SectionToken
    ? z.input<Members[Name]["schema"]> extends FieldValues ? z.input<Members[Name]["schema"]> : never
    : never;
type Defaults<Members extends Declarations> = { [Key in keyof Members]: z.input<Members[Key]["schema"]> };
type FieldKeys<Members extends Declarations> = { [Key in keyof Members]: Members[Key] extends SectionToken ? never : Key }[keyof Members] & string;
type SectionKeys<Members extends Declarations> = { [Key in keyof Members]: Members[Key] extends SectionToken ? Key : never }[keyof Members] & string;
type ChoiceKeys<Members extends Declarations> = { [Key in keyof Members]: Members[Key] extends { choices: ChoiceRule<any, any, any, any> } ? Key : never }[keyof Members] & string;
type ChoiceOption<Member> = Member extends { choices: ChoiceRule<any, any, any, infer Option> } ? Option : never;
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
type BoundSectionProps = Omit<SectionUseProps<string>, "name">;
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
  /** Installs this definition's dependent choices without a separate binder callback. */
  useChoiceForm: (options: { services: Services<Members> } & FormulateOptions<Inputs<Members>, z.output<Schema>>) => ChoiceFormRuntime<Inputs<Members>, z.output<Schema>>;
  /** Form shell with this definition's default layout. An explicit layout replaces it. */
  Form: (props: FormProps<Inputs<Members>, z.output<Schema>>) => ReactElement;
  /** Renders a local field, inheriting the form runtime and any section binding. */
  Field: <Name extends FieldKeys<Members>>(props: DefinedFieldProps<Members, Name, z.output<Schema>, Components>) => ReactElement;
  /** Renders members in declaration order, including nested sections. */
  Fields: (props: { control?: Control<Inputs<Members>, unknown, z.output<Schema>> }) => ReactElement[];
  /** Instantiates a declared child section. Its name binds the child's local members. */
  Section: (props: SectionUseProps<SectionKeys<Members>>) => ReactElement;
  /** Binds a declared section once for presentation, action scope and correction. */
  bindSection: <Name extends SectionKeys<Members>>(name: Name) => BoundSectionUse<Inputs<Members>, Name, SectionInputs<Members, Name>>;
  /** Alias of Section; a subsection has the same contract and runtime behaviour. */
  Subsection: (props: SectionUseProps<SectionKeys<Members>>) => ReactElement;
  /** Observes one local editing path in the current use. */
  useWatch: <Name extends FieldPath<Inputs<Members>>>(name: Name) => FieldPathValue<Inputs<Members>, Name>;
  /** Reads the current dependent-choice view for a local field in this mounted use. */
  useChoice: <Name extends ChoiceKeys<Members>>(name: Name) => ChoiceView<ChoiceOption<Members[Name]>> | undefined;
  /** Returns an event-handler check for local paths. Validation remains in the form schema. */
  useTrigger: () => (name: FieldPath<Inputs<Members>> | readonly FieldPath<Inputs<Members>>[]) => Promise<boolean>;
};

export type DefinedSection<Members extends Declarations, Components extends FieldComponentMap, Schema extends z.ZodType<FieldValues, FieldValues> = FormSchema<Members>> =
  Omit<DefinedForm<Members, Components, Schema>, "useForm" | "useChoiceForm" | "Form" | "Field" | "Fields" | "bindSection"> & Pick<SectionToken, typeof sectionRuntime> & {
    /** Renders a local field using the runtime and binding supplied by this section use. */
    Field: <Name extends FieldKeys<Members>>(props: WithoutControl<DefinedFieldProps<Members, Name, z.output<Schema>, Components>>) => ReactElement;
    /** Renders local members in order, using the current section binding. */
    Fields: (props: Record<string, never>) => ReactElement[];
    /** Escape hatch for explicit member mappings. Ordinary uses bind through the parent's Section helper. */
    Bind: <Values extends FieldValues, Output>(props: {
      control: Control<Values, unknown, Output>;
      title?: ReactNode;
      children?: ReactNode;
    } & ({
      bindings: SectionBindings<Inputs<Members>, NoInfer<Values>>;
      use?: never;
    } | {
      use: BoundSectionBinding<Inputs<Members>, NoInfer<Values>, Services<Members>>;
      bindings?: never;
    }) & LayoutProps) => ReactElement;
    /** Captures an explicit member map and stable use ID for rendering, choices and workflow scopes. */
    bind: <Values extends FieldValues>(options: {
      id: string;
      bindings: SectionBindings<Inputs<Members>, NoInfer<Values>>;
    }) => BoundSectionBinding<Inputs<Members>, Values, Services<Members>>;
  };
/** A subsection is a section used inside another section, not a separate entity. */
export type DefinedSubsection<Members extends Declarations, Components extends FieldComponentMap, Schema extends z.ZodType<FieldValues, FieldValues> = FormSchema<Members>> = DefinedSection<Members, Components, Schema>;

/** One declared section use with host paths resolved for rendering and workflow coordination. */
export type BoundSectionUse<Values extends FieldValues, Name extends string, LocalValues extends FieldValues = FieldValues> = FormScope<Values> & {
  readonly name: Name;
  readonly correction: readonly FieldPath<Values>[];
  /** Renders the already-bound section; the enclosing definition Form supplies its runtime. */
  Section: (props: BoundSectionProps) => ReactElement;
  /** Resolves a local editor name to this use's host path. */
  field: <LocalName extends FieldPath<LocalValues>>(name: LocalName) => FieldPath<Values>;
  /** Resolves the choice-store ID carried by a local dependent field. */
  choiceId: <LocalName extends FieldPath<LocalValues>>(name: LocalName) => string;
  /** Focuses the first declared editor after the host reveals its destination. */
  focusFirst: (form: Pick<UseFormReturn<Values>, "setFocus">) => void;
};

/** An explicitly mapped section use, independent of its mounted presentation. */
export type BoundSectionBinding<LocalValues extends FieldValues, Values extends FieldValues, RequiredServices> = FormScope<Values> & {
  readonly id: string;
  readonly bindings: SectionBindings<LocalValues, Values>;
  readonly correction: readonly FieldPath<Values>[];
  /** Resolves a local editor name to this use's current host path. */
  field: <LocalName extends FieldPath<LocalValues>>(name: LocalName) => FieldPath<Values>;
  /** Resolves the stable choice-store ID carried by a local dependent field. */
  choiceId: <LocalName extends FieldPath<LocalValues>>(name: LocalName) => string;
  /** Resolves dependent choice rules against current editing values and host services. */
  bindChoices: (options: { values: Values; services: RequiredServices }) => BoundChoice[];
  /** Focuses the first mapped editor after the host reveals it. */
  focusFirst: (form: Pick<UseFormReturn<Values>, "setFocus">) => void;
};

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

function useShallowStable<Value>(value: Value): Value {
  const structured = value !== null && typeof value === "object";
  const entries = structured ? Object.entries(value) : [];
  const keys = entries.map(([key]) => key).join("\0");
  const dependencies = structured
    ? [keys, ...entries.map(([, item]) => item)]
    : [value];
  return useMemo(() => value, dependencies);
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
    const boundSections = new Map<string, BoundSectionUse<any, string>>();

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
          resolve: (local) => parent.resolve(`${name}.${local}`),
          resolveChoice: (local) => parent.resolveChoice(`${name}.${local}`) },
        title: title ?? member[sectionRuntime].title ?? name, children, layout,
      });
    }
    function bindSection(name: string) {
      const existing = boundSections.get(name);
      if (existing) return existing;
      const member = Object.hasOwn(members, name) ? members[name] : undefined;
      if (!member || !isSection(member)) throw new Error(`Unknown defined section: "${name}".`);
      const correction = member.fieldNames.map((child) => `${name}.${child}`);
      function BoundSection(props: BoundSectionProps) { return <SectionView {...props} name={name} />; }
      const bound: BoundSectionUse<any, string> = {
        name,
        fields: [name],
        correction,
        Section: BoundSection,
        field: (localName) => `${name}.${localName}`,
        choiceId: (localName) => `${name}.${localName}`,
        focusFirst: (form) => { if (correction[0]) form.setFocus(correction[0]); },
      };
      boundSections.set(name, bound);
      return bound;
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
    function useDefinedChoice(name: string) {
      const scope = useDefinitionScope(identity, kind);
      const choiceRuntime = useContext(ChoiceRuntimeContext);
      const member = Object.hasOwn(members, name) ? members[name] : undefined;
      if (!member || isSection(member) || !member.choices) throw new Error(`Unknown defined choice: "${name}".`);
      if (!scope.form || scope.form.control !== scope.control) throw new Error("Dependent choice presentation needs the Form that owns its control.");
      if (!choiceRuntime || choiceRuntime.control !== scope.control) throw new Error("Dependent choice presentation needs a choice form runtime.");
      return choiceRuntime.choices.get(scope.resolveChoice(name), member.choices);
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
    function bind({ id, bindings }: { id: string; bindings: Record<string, string> }) {
      if (!id) throw new Error("A bound section use needs a stable non-empty ID.");
      for (const [name] of entries) if (!Object.hasOwn(bindings, name) || !bindings[name]) throw new Error(`Missing section binding: "${name}".`);
      const resolve = (name: string) => {
        const [head, ...tail] = name.split(".");
        return [bindings[head!]!, ...tail].join(".");
      };
      const fields = fieldNames.map(resolve);
      return {
        id,
        bindings,
        fields,
        correction: fields,
        field: resolve,
        choiceId: (name: string) => `${id}.${name}`,
        bindChoices: ({ values, services }: { values: FieldValues; services: unknown }) => bindChoices({ id, values, services, bindings }),
        focusFirst: (form: Pick<UseFormReturn<any>, "setFocus">) => { if (fields[0]) form.setFocus(fields[0]); },
      };
    }
    function Bind({ control, bindings, use, title, children, layout }: { control: Control<any, unknown, any>; bindings?: Record<string, string>; use?: BoundSectionBinding<any, any, any>; title?: ReactNode; children?: ReactNode } & LayoutProps) {
      const resolvedBindings = use?.bindings ?? bindings;
      if (!resolvedBindings) throw new Error("Section Bind needs bindings or a bound use.");
      const parent = useContext(DefinitionScopeContext);
      for (const [name] of entries) if (!Object.hasOwn(resolvedBindings, name) || !resolvedBindings[name]) throw new Error(`Missing section binding: "${name}".`);
      return renderUse({ scope: { identity, control, parent, resolve: (name) => {
        const [head, ...tail] = name.split(".");
        return [resolvedBindings[head!]!, ...tail].join(".");
      }, resolveChoice: (name) => use ? use.choiceId(name) : name }, title, children, layout });
    }
    function useDefinedForm(formOptions?: FormulateOptions<FieldValues, FieldValues>) {
      return useFormulate({ schema, defaultValues }, formOptions);
    }
    function useDefinedChoiceForm({ services, ...formOptions }: { services: unknown } & FormulateOptions<FieldValues, FieldValues>) {
      const stableServices = useShallowStable(services);
      const fields = useCallback((values: FieldValues) => bindChoices({ values, services: stableServices }), [stableServices]);
      const { defaultValues: overrides, ...runtimeOptions } = formOptions;
      const initialValues = typeof overrides === "function" ? overrides : { ...defaultValues, ...overrides };
      return useChoiceFormRuntime({ schema, fields, defaultValues: initialValues, ...runtimeOptions }).form;
    }
    function FormView({ layout = options.layout, ...props }: FormProps<FieldValues, FieldValues>) {
      return <FormShell {...props} layout={layout} />;
    }
    return { schema, defaultValues, fieldNames, bindChoices, bindSection, Form: FormView, Field, Fields: FieldsView, Section: SectionView, Subsection: SectionView,
      useWatch: useDefinedWatch, useChoice: useDefinedChoice, useTrigger: useDefinedTrigger, useForm: useDefinedForm,
      useChoiceForm: useDefinedChoiceForm, Bind, bind,
      [sectionRuntime]: { identity, title: options.title, render: renderUse } };
  }
  // The public mapped types retain declaration/schema/name relationships; the
  // dynamic recursive renderer above erases them only at this implementation boundary.
  return {
    defineForm: ((members, options) => build(members, "form", options)) as DefineForm<Components>,
    defineSection: ((members, options) => build(members, "section", options)) as DefineSection<Components>,
  };
}
