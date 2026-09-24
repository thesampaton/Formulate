"use client";

import { useContext, useMemo, useRef } from "react";
import type { ComponentProps, ComponentType, ReactElement, ReactNode } from "react";
import { get, useWatch } from "react-hook-form";
import type { Control, DefaultValues, FieldPath, FieldPathValue, FieldValues, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import type { ConfiguredFieldProps, ControlSelection, FieldComponentMap } from "./create-formulate.js";
import type { FieldPresentation, PrimitiveFieldType } from "./define-field.js";
import type { FieldRootProps } from "../fields/field.js";
import type { SectionProps } from "../presentation/section.js";
import { Page as PageShell } from "../presentation/page.js";
import { conditionMatches } from "../graph/conditions.js";
import { Section as SectionShell } from "../presentation/section.js";
import { Form as FormShell } from "../form/form.js";
import type { FormProps, FormScope } from "../form/form.js";
import { LayoutBody } from "../presentation/layout.js";
import type { LayoutProps } from "../presentation/layout.js";
import { DefinitionScopeContext, useDefinitionScope } from "./definition-scope.js";
import type { DefinitionScope, SectionPathMap } from "./definition-scope.js";
import { exportPortableDefinition, portableDefinition, validateDefinitionLayout } from "../graph/definition.js";
import type { PortableDefinitionSource, PortableExport, PortableExportOptions, DefinitionSemantics, DefinitionLayout } from "../graph/definition.js";
import { createDefinitionSchema } from "./schema.js";
import { useGraphForm } from "../graph/react.js";
import type { GraphFormRuntime } from "../graph/react.js";
import { useFormulate } from "../form/use-formulate.js";
import type { FormulateOptions } from "../form/use-formulate.js";

import { ChoiceRuntimeContext } from "../choices/context.js";
import type { BoundChoice, ChoiceRule, ChoiceView } from "../choices/definition.js";
import { bindStringCompositions } from "../fields/string-composition.js";
import type { BoundStringComposition, StringComposition } from "../fields/string-composition.js";

export type FormDefinition<Input extends FieldValues, Output extends FieldValues = Input> = {
  /** Validates editing values and parses the accepted submission output. */
  schema: z.ZodType<Output, Input>;
  /** Initial editing values; definitions never own live form state. */
  defaultValues: DefaultValues<NoInfer<Input>>;
  /** Bound scalar compositions stay active independently of mounted editors. */
  compositions?: readonly BoundStringComposition[];
};

const sectionRuntime = Symbol("section-definition");
export type SectionPresentationProps = SectionProps;
type SectionUsePresentation = Omit<SectionProps, "title"> & { title?: ReactNode };
type SectionDefinitionToken = {
  [portableDefinition]: PortableDefinitionSource;
  schema: z.ZodType<FieldValues, FieldValues>;
  defaultValues: FieldValues;
  fieldPaths: readonly string[];
  hasChoices: boolean;
  bindChoices: (options: any) => BoundChoice[];
  compositions: readonly BoundStringComposition[];
  [sectionRuntime]: {
    identity: symbol;
    title?: ReactNode;
    renderSection: (props: { scope: DefinitionScope } & SectionUsePresentation) => ReactElement;
  };
};
type FieldSchemaDeclaration = DefinitionSemantics & { id?: string; bind?: string; portable?: never; schema: z.ZodType; choices?: ChoiceRule<any, any, any, any>; composition?: StringComposition };
type UnionToIntersection<Union> = (Union extends unknown ? (value: Union) => void : never) extends (value: infer Result) => void ? Result : never;
type MemberServices<Member> = Member extends { choices: ChoiceRule<any, any, infer Services, any> }
  ? Services
  : Member extends { bindChoices: (options: infer Options) => BoundChoice[] }
    ? Options extends { services: infer Services }
      ? Services
      : {}
    : {};
type RequiredServices<Members> = UnionToIntersection<{ [Key in keyof Members]: MemberServices<Members[Key]> }[keyof Members]>;
type HasChoices<Members> = true extends { [Key in keyof Members]: Members[Key] extends { choices: ChoiceRule<any, any, any, any> } ? true : Members[Key] extends { hasChoices: infer Has } ? Has : false }[keyof Members] ? true : false;

type Declarations = Record<string, FieldSchemaDeclaration | SectionDefinitionToken>;
type MemberBinding<Member, Key extends string> = Member extends { valueBinding: infer Binding extends string } ? Binding : Member extends { bind: infer Binding extends string } ? Binding : Key;
type BoundShape<Path extends string, Schema extends z.ZodType> = Path extends `${infer Head}.${infer Rest}`
  ? { [Key in Head]: z.ZodObject<BoundShape<Rest, Schema>> } : { [Key in Path]: Schema };
type MemberSchema<Member extends { schema: z.ZodType }> = Member extends { applicable: unknown }
  ? z.ZodType<z.output<Member["schema"]> | undefined, z.input<Member["schema"]>> : Member["schema"];
type Shape<Members extends Declarations> = UnionToIntersection<{ [Key in keyof Members & string]: BoundShape<MemberBinding<Members[Key], Key>, MemberSchema<Members[Key]>> }[keyof Members & string]> extends infer Result extends z.ZodRawShape ? Result : never;
type FormSchema<Members extends Declarations> = z.ZodObject<Shape<Members>>;
type Inputs<Members extends Declarations> = z.input<FormSchema<Members>>;
type SectionInputs<Members extends Declarations, Name extends SectionKeys<Members>> =
  Members[Name] extends SectionDefinitionToken
    ? z.input<Members[Name]["schema"]> extends FieldValues ? z.input<Members[Name]["schema"]> : never
    : never;
type Defaults<Members extends Declarations> = z.input<FormSchema<Members>>;
type FieldKeys<Members extends Declarations> = { [Key in keyof Members]: Members[Key] extends SectionDefinitionToken ? never : Key }[keyof Members] & string;
type SectionKeys<Members extends Declarations> = { [Key in keyof Members]: Members[Key] extends SectionDefinitionToken ? Key : never }[keyof Members] & string;
type ChoiceKeys<Members extends Declarations> = { [Key in keyof Members]: Members[Key] extends { choices: ChoiceRule<any, any, any, any> } ? Key : never }[keyof Members] & string;
type ChoiceOption<Member> = Member extends { choices: ChoiceRule<any, any, any, infer Option> } ? Option : never;
type FieldDeclaration<Schema extends z.ZodType, Components extends FieldComponentMap> = FieldPresentation & {
  /** Optional for existing inline declarations; required by defineField. */
  primitive?: PrimitiveFieldType;
  schema: Schema;
  defaultValue: NoInfer<z.input<Schema>>;
  portable?: never;
  id?: string;
  bind?: string;
  definitionId?: string;
  applicable?: DefinitionSemantics["applicable"];
  dependsOn?: DefinitionSemantics["dependsOn"];
  actions?: DefinitionSemantics["actions"];
} & ControlSelection<NoInfer<z.input<Schema>>, Components>;
type CheckedMembers<Members extends Declarations, Components extends FieldComponentMap> = {
  [Key in keyof Members]: Members[Key] extends SectionDefinitionToken
    ? Members[Key]
    : FieldDeclaration<Members[Key]["schema"], Components> & {
      choices?: ChoiceRule<Inputs<Members>, z.input<Members[Key]["schema"]>, any, any>;
      composition?: [z.input<Members[Key]["schema"]>] extends [string] ? StringComposition<Inputs<Members>> : never;
    };
};
type DefaultControlProps<Member, Components extends FieldComponentMap> = Member extends { component: infer Key extends keyof Components }
  ? Partial<ComponentProps<Components[Key]>> : never;
type DefinedFieldProps<Members extends Declarations, Name extends FieldKeys<Members>, Output, Components extends FieldComponentMap> =
  Omit<FieldRootProps<Inputs<Members>, FieldPath<Inputs<Members>>, Output>, "name" | "label" | "children"> & {
    name: Name;
    label?: ReactNode;
  } & ({ componentProps?: DefaultControlProps<Members[Name], Components>; children?: never } | { children: ReactNode; componentProps?: never });
type WithoutControl<Props> = Props extends unknown ? Omit<Props, "control"> : never;
type SectionUseProps<Name extends string> = { name: Name } & SectionUsePresentation;
type BoundSectionProps = Omit<SectionUseProps<string>, "name">;
type FieldRenderer<Components extends FieldComponentMap> =
  <Values extends FieldValues, Name extends FieldPath<Values>, Output = Values>(props: ConfiguredFieldProps<Values, Name, Output, Components>) => ReactNode;

type DefinitionOptions<Members extends Declarations, Schema extends z.ZodType<FieldValues, FieldValues>> = LayoutProps & DefinitionSemantics & {
  id?: string;
  /** Nested containment references existing members; it never changes their bindings. */
  children?: readonly DefinitionLayout[];
  /** Customize validation/output while preserving the complete declared editing shape. */
  schema?: (schema: FormSchema<Members>) => Schema & (
    [z.input<Schema>] extends [Inputs<Members>] ? [Inputs<Members>] extends [z.input<Schema>] ? unknown : never : never
  );
};

export type DefinedForm<Members extends Declarations, Components extends FieldComponentMap, Schema extends z.ZodType<FieldValues, FieldValues> = FormSchema<Members>> = {
  schema: Schema;
  /** Compile through hierarchical authoring into a JSON graph and separate host capabilities. */
  toPortable: (options?: PortableExportOptions) => PortableExport;
  [portableDefinition]: PortableDefinitionSource;
  defaultValues: Defaults<Members>;
  readonly hasChoices: HasChoices<Members>;
  compositions: readonly BoundStringComposition[];
  /** Bind dependency rules without mounting editors. IDs identify uses; bindings locate editing values. */
  bindChoices: <Values extends FieldValues = Inputs<Members>>(options: {
    values: Values;
    services: RequiredServices<Members>;
    id?: string;
  } & (Values extends Inputs<Members> ? { bindings?: SectionPathMap<Inputs<Members>, Values> } : { bindings: SectionPathMap<Inputs<Members>, Values> })) => BoundChoice[];
  /** All declared leaf field paths, including section descendants, in declaration order. */
  fieldPaths: readonly FieldPath<Inputs<Members>>[];
  useForm: (options?: FormulateOptions<Inputs<Members>, z.output<Schema>> & { services?: RequiredServices<Members> }) => HasChoices<Members> extends true ? GraphFormRuntime<Inputs<Members>, z.output<Schema>> : UseFormReturn<Inputs<Members>, unknown, z.output<Schema>>;
  /** Installs this definition's dependent choices without a separate binder callback. */
  useChoiceForm: (options: { services: RequiredServices<Members> } & FormulateOptions<Inputs<Members>, z.output<Schema>>) => GraphFormRuntime<Inputs<Members>, z.output<Schema>>;
  /** Form shell with this definition's default layout. An explicit layout replaces it. */
  Form: (props: FormProps<Inputs<Members>, z.output<Schema>>) => ReactElement;
  /** Renders a local field, inheriting the form runtime and any section binding. */
  Field: <Name extends FieldKeys<Members>>(props: DefinedFieldProps<Members, Name, z.output<Schema>, Components>) => ReactElement;
  /** Renders members in declaration order, including nested sections. */
  Fields: (props: { control?: Control<Inputs<Members>, unknown, z.output<Schema>> }) => ReactElement[];
  /** Instantiates a declared child section. Its name binds the child's local members. */
  Section: (props: SectionUseProps<SectionKeys<Members>>) => ReactElement;
  /** Binds a declared section once for presentation, action scope, and focus destinations. */
  bindSection: <Name extends SectionKeys<Members>>(name: Name) => BoundSectionUse<Inputs<Members>, Name, SectionInputs<Members, Name>>;
  /** Observes one local editing path in the current use. */
  useWatch: <Name extends FieldPath<Inputs<Members>>>(name: Name) => FieldPathValue<Inputs<Members>, Name>;
  /** Reads the current dependent-choice view for a local field in this mounted use. */
  useChoice: <Name extends ChoiceKeys<Members>>(name: Name) => ChoiceView<ChoiceOption<Members[Name]>> | undefined;
  /** Returns an event-handler check for local paths. Validation remains in the form schema. */
  useTrigger: () => (name: FieldPath<Inputs<Members>> | readonly FieldPath<Inputs<Members>>[]) => Promise<boolean>;
};

export type DefinedSection<Members extends Declarations, Components extends FieldComponentMap, Schema extends z.ZodType<FieldValues, FieldValues> = FormSchema<Members>> =
  Omit<DefinedForm<Members, Components, Schema>, "useForm" | "useChoiceForm" | "Form" | "Field" | "Fields" | "bindSection"> & Pick<SectionDefinitionToken, typeof sectionRuntime> & {
    /** Declare an independently identified and bound use before rendering or export. */
    use: <const Instance extends { id?: string; bind?: string; applicable?: DefinitionSemantics["applicable"] }>(instance: Instance) => DefinedSection<Members, Components, Schema> & (Instance extends { bind: infer Binding extends string } ? { valueBinding: Binding } : {}) & Pick<Instance, Extract<keyof Instance, "applicable">>;
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
      bindings: SectionPathMap<Inputs<Members>, NoInfer<Values>>;
      binding?: never;
    } | {
      binding: BoundSectionBinding<Inputs<Members>, NoInfer<Values>, RequiredServices<Members>>;
      bindings?: never;
    }) & SectionUsePresentation) => ReactElement;
    /** Captures an explicit member map and stable use ID for rendering, choices and workflow scopes. */
    bind: <Values extends FieldValues>(options: {
      id: string;
      bindings: SectionPathMap<Inputs<Members>, NoInfer<Values>>;
    }) => BoundSectionBinding<Inputs<Members>, Values, RequiredServices<Members>>;
  };

/** One declared section use with host paths resolved for rendering and workflow coordination. */
export type BoundSectionUse<Values extends FieldValues, Name extends string, LocalValues extends FieldValues = FieldValues> = FormScope<Values> & {
  readonly name: Name;
  readonly focusPaths: readonly FieldPath<Values>[];
  readonly compositions: readonly BoundStringComposition[];
  /** Renders the already-bound section; the enclosing definition Form supplies its runtime. */
  Section: (props: BoundSectionProps) => ReactElement;
  /** Resolves a local editor name to this use's host path. */
  resolveFieldPath: <LocalName extends FieldPath<LocalValues>>(name: LocalName) => FieldPath<Values>;
  /** Resolves the choice-store ID carried by a local dependent field. */
  resolveChoiceId: <LocalName extends FieldPath<LocalValues>>(name: LocalName) => string;
  /** Focuses the first declared editor after the host reveals its destination. */
  focusFirstField: (form: Pick<UseFormReturn<Values>, "setFocus">) => void;
};

/** An explicitly mapped section use, independent of its mounted presentation. */
export type BoundSectionBinding<LocalValues extends FieldValues, Values extends FieldValues, RequiredServices> = FormScope<Values> & {
  readonly id: string;
  readonly bindings: SectionPathMap<LocalValues, Values>;
  readonly focusPaths: readonly FieldPath<Values>[];
  readonly compositions: readonly BoundStringComposition[];
  /** Resolves a local editor name to this use's current host path. */
  resolveFieldPath: <LocalName extends FieldPath<LocalValues>>(name: LocalName) => FieldPath<Values>;
  /** Resolves the stable choice-store ID carried by a local dependent field. */
  resolveChoiceId: <LocalName extends FieldPath<LocalValues>>(name: LocalName) => string;
  /** Resolves dependent choice rules against current editing values and host services. */
  bindChoices: (options: { values: Values; services: RequiredServices }) => BoundChoice[];
  /** Focuses the first mapped editor after the host reveals it. */
  focusFirstField: (form: Pick<UseFormReturn<Values>, "setFocus">) => void;
};

export interface DefineForm<Components extends FieldComponentMap> {
  <const Members extends Declarations, Schema extends z.ZodType<FieldValues, FieldValues> = FormSchema<Members>>(
    members: Members & CheckedMembers<Members, Components>,
    options: DefinitionOptions<Members, Schema> & { applicable: NonNullable<DefinitionSemantics["applicable"]> },
  ): DefinedForm<Members, Components, z.ZodType<Partial<z.output<Schema>>, z.input<Schema>>>;
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
      presentation?: ComponentType<SectionPresentationProps>;
    },
  ): DefinedSection<Members, Components, Schema>;
}

function useShallowStable<Value>(value: Value): Value {
  const previous = useRef(value);
  const isRecord = (candidate: unknown): candidate is Record<string, unknown> => candidate !== null && typeof candidate === "object" && Object.getPrototypeOf(candidate) === Object.prototype;
  const before = previous.current;
  if (!isRecord(before) || !isRecord(value) || Object.keys(before).length !== Object.keys(value).length || Object.entries(value).some(([key, item]) => !Object.hasOwn(before, key) || !Object.is(before[key], item))) {
    previous.current = value;
  }
  return previous.current;
}

/** Replace the mapped local member while retaining any descendant path. */
function createFieldPathResolver(bindings: Record<string, string>) {
  return (localPath: string) => {
    const [memberName, ...descendants] = localPath.split(".");
    return [bindings[memberName!]!, ...descendants].join(".");
  };
}

/** Both factories use the same recursive member model and connected control catalogue. */
export function createDefinitionFactories<Components extends FieldComponentMap>(RenderField: FieldRenderer<Components>) {
  function buildDefinition(members: Declarations, kind: "form" | "section", options: DefinitionSemantics & {
    schema?: (schema: z.ZodObject<any>) => z.ZodType<FieldValues, FieldValues>;
    title?: ReactNode;
    children?: readonly DefinitionLayout[];
    presentation?: ComponentType<SectionPresentationProps>;
  } & LayoutProps = {}) {
    const identity = Symbol(kind);
    const entries = Object.entries(members);
    if ("portable" in options || entries.some(([, member]) => "portable" in member)) throw new Error("Declare semantics directly on the definition; portable annotations are no longer supported.");
    for (const [name] of entries) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || ["__proto__", "constructor", "prototype"].includes(name)) {
        throw new Error(`Unsupported field key "${name}". Definitions accept flat identifier keys; declare a section for nested bindings.`);
      }
    }
    const isSection = (member: FieldSchemaDeclaration | SectionDefinitionToken): member is SectionDefinitionToken => sectionRuntime in member;
    const rootApplicability = kind === "form" ? options.applicable : undefined;
    const compiled = createDefinitionSchema(members, options.schema, options.children, rootApplicability);
    const schema = compiled.schema as z.ZodType<FieldValues, FieldValues>;
    const { defaultValues, fieldPaths, resolvePath } = compiled;
    const instanceId = (name: string) => {
      const member = members[name]!;
      return isSection(member) ? member[portableDefinition].instanceId ?? name : member.id ?? name;
    };
    const hasChoices = entries.some(([, member]) => isSection(member) ? member.hasChoices : Boolean(member.choices));
    const boundSections = new Map<string, BoundSectionUse<any, string>>();
    const compositions = entries.flatMap(([name, member]) => isSection(member)
      ? bindStringCompositions(member.compositions, (path) => `${resolvePath(name)}.${path}`)
      : member.composition ? [{ name: resolvePath(name), composition: member.composition }] : []);

    function bindChoices({ values, services, id = "", bindings }: { values: FieldValues; services: unknown; id?: string; bindings?: Record<string, string> }): BoundChoice[] {
      const localValues = bindings
        ? Object.fromEntries(Object.entries(bindings).map(([name, hostPath]) => [name, get(values, hostPath)]))
        : values;
      return entries.flatMap(([name, member]) => {
        const metadata = isSection(member) ? member[portableDefinition] : member;
        if (metadata.applicable && !conditionMatches(metadata.applicable, localValues)) return [];
        const fieldPath = bindings?.[resolvePath(name)] ?? resolvePath(name);
        const choiceId = id ? `${id}.${instanceId(name)}` : instanceId(name);
        if (isSection(member)) {
          const childBindings = member.bindChoices({
            values: get(localValues, resolvePath(name)),
            services,
            id: choiceId,
          });
          return childBindings.map((binding) => ({
            ...binding,
            fieldPath: `${fieldPath}.${binding.fieldPath}`,
          }));
        }
        if (!member.choices) return [];
        return [{
          ...member.choices.resolve(localValues, get(localValues, resolvePath(name)), services),
          choiceId,
          fieldPath,
        }];
      });
    }

    function Field({ name, componentProps, children, control, ...overrides }: any) {
      const scope = useDefinitionScope(identity, kind, control);
      if (!Object.hasOwn(members, name) || isSection(members[name]!)) {
        throw new Error(`Unknown defined field: "${name}".`);
      }
      const member = members[name] as FieldSchemaDeclaration;
      const observed = useWatch({ control: scope.control, disabled: !member.applicable && !rootApplicability });
      const localValues = Object.fromEntries(Object.keys(defaultValues).map((key) => [key, get(observed, scope.resolveFieldPath(key))]));
      if (rootApplicability && !conditionMatches(rootApplicability, observed)) return null;
      if (member.applicable && !conditionMatches(member.applicable, localValues)) return null;
      const { schema: _schema, defaultValue: _defaultValue, choices: _choices, primitive: _primitive, composition: _composition, id: _id, bind: _bind, definitionId: _definitionId, applicable: _applicable, dependsOn: _dependsOn, actions: _actions, ...presentation } = members[name] as any;
      const selection = children !== undefined
        ? { component: undefined, componentProps: undefined, children }
        : { componentProps: { ...(presentation.componentProps ?? {}), ...componentProps } };
      return (
        <RenderField
          {...presentation}
          {...overrides}
          name={scope.resolveFieldPath(resolvePath(name))}
          control={scope.control}
          {...selection}
        />
      );
    }
    function SectionView({ name, title, children, control, layout, ...shellProps }: SectionUseProps<string> & { control?: Control<any, unknown, any> }) {
      const parent = useDefinitionScope(identity, kind, control);
      const member = Object.hasOwn(members, name) ? members[name] : undefined;
      if (!member || !isSection(member)) {
        throw new Error(`Unknown defined section: "${name}".`);
      }
      const applicability = member[portableDefinition].applicable;
      const observed = useWatch({ control: parent.control, disabled: !applicability && !rootApplicability });
      const localValues = Object.fromEntries(Object.keys(defaultValues).map((key) => [key, get(observed, parent.resolveFieldPath(key))]));
      if (rootApplicability && !conditionMatches(rootApplicability, observed)) return null;
      if (applicability && !conditionMatches(applicability, localValues)) return null;
      return member[sectionRuntime].renderSection({
        scope: {
          identity: member[sectionRuntime].identity,
          control: parent.control,
          parent: parent.parent,
          resolveFieldPath: (localPath) => parent.resolveFieldPath(`${resolvePath(name)}.${localPath}`),
          resolveChoiceId: (localPath) => parent.resolveChoiceId(`${instanceId(name)}.${localPath}`),
        },
        title: title ?? member[sectionRuntime].title ?? name,
        children,
        layout,
        ...shellProps,
      });
    }
    function bindSection(name: string) {
      const existing = boundSections.get(name);
      if (existing) return existing;
      const member = Object.hasOwn(members, name) ? members[name] : undefined;
      if (!member || !isSection(member)) {
        throw new Error(`Unknown defined section: "${name}".`);
      }
      const focusPaths = member.fieldPaths.map((childPath) => `${resolvePath(name)}.${childPath}`);
      function BoundSection(props: BoundSectionProps) {
        return <SectionView {...props} name={name} />;
      }
      const bound: BoundSectionUse<any, string> = {
        name,
        errorPaths: [resolvePath(name)],
        focusPaths,
        compositions: bindStringCompositions(member.compositions, (path) => `${resolvePath(name)}.${path}`),
        Section: BoundSection,
        resolveFieldPath: (localPath) => `${resolvePath(name)}.${localPath}`,
        resolveChoiceId: (localPath) => `${instanceId(name)}.${localPath}`,
        focusFirstField: (form) => {
          const firstFieldPath = focusPaths[0];
          if (firstFieldPath) form.setFocus(firstFieldPath);
        },
      };
      boundSections.set(name, bound);
      return bound;
    }
    const layout = options.children ?? entries.map(([name]) => name);
    validateDefinitionLayout(entries.map(([name]) => name), layout, options.id ?? kind);
    function FieldsView({ control }: { control?: Control<any, unknown, any> }) {
      const scope = useDefinitionScope(identity, kind, control);
      const observed = useWatch({ control: scope.control, disabled: !rootApplicability });
      if (rootApplicability && !conditionMatches(rootApplicability, observed)) return [];
      function renderItem(item: DefinitionLayout): ReactElement {
        if (typeof item === "string") return isSection(members[item]!)
          ? <SectionView key={instanceId(item)} name={item} control={control} />
          : <Field key={instanceId(item)} name={item} control={control} />;
        const descendants = item.children.map(renderItem);
        return item.role === "page"
          ? <PageShell key={item.id} pageId={item.id} title={item.label ?? item.id}>{descendants}</PageShell>
          : <SectionShell key={item.id} title={item.label ?? item.id}>{descendants}</SectionShell>;
      }
      return layout.map(renderItem);
    }
    function useDefinedWatch(name: string) {
      const scope = useDefinitionScope(identity, kind);
      return useWatch({ control: scope.control, name: scope.resolveFieldPath(name) });
    }
    function useDefinedChoice(name: string) {
      const scope = useDefinitionScope(identity, kind);
      const choiceRuntime = useContext(ChoiceRuntimeContext);
      const member = Object.hasOwn(members, name) ? members[name] : undefined;
      if (!member || isSection(member) || !member.choices) {
        throw new Error(`Unknown defined choice: "${name}".`);
      }
      if (!scope.form || scope.form.control !== scope.control) {
        throw new Error("Dependent choice presentation needs the Form that owns its control.");
      }
      if (!choiceRuntime || choiceRuntime.control !== scope.control) {
        throw new Error("Dependent choice presentation needs a choice form runtime.");
      }
      return choiceRuntime.choices.get(scope.resolveChoiceId(instanceId(name)), member.choices);
    }
    function useDefinedTrigger() {
      const scope = useDefinitionScope(identity, kind);
      if (!scope.form || scope.form.control !== scope.control) {
        throw new Error("Section validation needs the Form that owns its control.");
      }
      const trigger = scope.form.trigger;
      return (localPaths: string | readonly string[]) => {
        const fieldPaths = typeof localPaths === "string"
          ? scope.resolveFieldPath(localPaths)
          : localPaths.map(scope.resolveFieldPath);
        return trigger(fieldPaths);
      };
    }
    function renderSection({ scope, title = options.title ?? "Section", children, layout = options.layout, bodyClassName = options.bodyClassName, ...shellProps }: { scope: DefinitionScope } & SectionUsePresentation) {
      const Presentation = options.presentation;
      let content: ReactNode;
      if (children !== undefined) {
        content = <LayoutBody layout={layout} bodyClassName={bodyClassName}>{children}</LayoutBody>;
      } else if (Presentation) {
        content = <Presentation {...shellProps} title={title} layout={layout} bodyClassName={bodyClassName} />;
      } else {
        content = <SectionShell {...shellProps} title={title} layout={layout} bodyClassName={bodyClassName}><FieldsView /></SectionShell>;
      }
      return <DefinitionScopeContext value={scope}>{content}</DefinitionScopeContext>;
    }
    function assertMemberBindings(bindings: Record<string, string>) {
      for (const name of Object.keys(defaultValues)) {
        if (!Object.hasOwn(bindings, name) || !bindings[name]) {
          throw new Error(`Missing section binding: "${name}".`);
        }
      }
    }
    function bind({ id, bindings }: { id: string; bindings: Record<string, string> }) {
      if (!id) throw new Error("A bound section use needs a stable non-empty ID.");
      assertMemberBindings(bindings);
      const resolveFieldPath = createFieldPathResolver(bindings);
      const resolvedFieldPaths = fieldPaths.map(resolveFieldPath);
      return {
        id,
        bindings,
        errorPaths: resolvedFieldPaths,
        focusPaths: resolvedFieldPaths,
        compositions: bindStringCompositions(compositions, resolveFieldPath),
        resolveFieldPath,
        resolveChoiceId: (localPath: string) => `${id}.${localPath}`,
        bindChoices: ({ values, services }: { values: FieldValues; services: unknown }) => (
          bindChoices({ id, values, services, bindings })
        ),
        focusFirstField: (form: Pick<UseFormReturn<any>, "setFocus">) => {
          const firstFieldPath = resolvedFieldPaths[0];
          if (firstFieldPath) form.setFocus(firstFieldPath);
        },
      };
    }
    function Bind({ control, bindings, binding, title, children, layout, ...shellProps }: {
      control: Control<any, unknown, any>;
      bindings?: Record<string, string>;
      binding?: BoundSectionBinding<any, any, any>;
      title?: ReactNode;
      children?: ReactNode;
    } & SectionUsePresentation) {
      const resolvedBindings = binding?.bindings ?? bindings;
      if (!resolvedBindings) throw new Error("Section Bind needs bindings or a binding descriptor.");
      const parent = useContext(DefinitionScopeContext);
      assertMemberBindings(resolvedBindings);
      return renderSection({
        scope: {
          identity,
          control,
          parent,
          resolveFieldPath: createFieldPathResolver(resolvedBindings),
          resolveChoiceId: (localPath) => binding ? binding.resolveChoiceId(localPath) : localPath,
        },
        title,
        children,
        layout,
        ...shellProps,
      });
    }
    const definitionSource: PortableDefinitionSource = {
      role: kind, members, schema, customized: Boolean(options.schema),
      ...(options.id ? { id: options.id } : {}),
      ...(options.definitionId ? { definitionId: options.definitionId } : {}),
      ...(options.applicable ? { applicable: options.applicable } : {}),
      ...(options.dependsOn ? { dependsOn: options.dependsOn } : {}),
      ...(options.actions ? { actions: options.actions } : {}),
      ...(options.children ? { children: options.children } : {}),
    };
    function useDefinedChoiceForm({ services, ...formOptions }: { services?: unknown } & FormulateOptions<FieldValues, FieldValues> = {}) {
      const stableServices = useShallowStable(services);
      const compiledGraph = useMemo(() => exportPortableDefinition(definitionSource, { services: stableServices }), [stableServices]);
      return useGraphForm(compiledGraph.graph, { ...formOptions, capabilities: compiledGraph.capabilities });
    }
    function useDefinedForm({ services, ...formOptions }: { services?: unknown } & FormulateOptions<FieldValues, FieldValues> = {}) {
      // The declaration decides this once; hook order is stable for its lifetime.
      // Choice evidence has one runtime in React and headless use. Native-only
      // schemas keep RHF's Date/file and async-value support using the same schema.
      return hasChoices ? useDefinedChoiceForm({ services, ...formOptions })
        : useFormulate({ schema, defaultValues, compositions }, formOptions);
    }
    function FormView({ layout = options.layout, bodyClassName = options.bodyClassName, ...props }: FormProps<FieldValues, FieldValues>) {
      return <FormShell {...props} layout={layout} bodyClassName={bodyClassName} />;
    }
    const definition = {
      schema,
      toPortable: (exportOptions?: PortableExportOptions) => exportPortableDefinition(definitionSource, exportOptions),
      [portableDefinition]: definitionSource,
      hasChoices,
      defaultValues,
      compositions,
      fieldPaths,
      bindChoices,
      bindSection,
      Form: FormView,
      Field,
      Fields: FieldsView,
      Section: SectionView,
      useWatch: useDefinedWatch,
      useChoice: useDefinedChoice,
      useTrigger: useDefinedTrigger,
      useForm: useDefinedForm,
      useChoiceForm: useDefinedChoiceForm,
      Bind,
      bind,
      [sectionRuntime]: { identity, title: options.title, renderSection },
    };
    function instantiate(instance: { id?: string; bind?: string; applicable?: DefinitionSemantics["applicable"] }, source = definitionSource): any {
      const instanceSource = {
        ...source,
        ...(instance.id ? { instanceId: instance.id } : {}),
        ...(instance.bind ? { bind: instance.bind } : {}),
        ...(instance.applicable ? { applicable: instance.applicable } : {}),
      };
      return {
        ...definition,
        ...(instanceSource.bind ? { valueBinding: instanceSource.bind } : {}),
        ...(instanceSource.applicable ? { applicable: instanceSource.applicable } : {}),
        [portableDefinition]: instanceSource,
        toPortable: (exportOptions?: PortableExportOptions) => exportPortableDefinition(instanceSource, exportOptions),
        use: (next: Parameters<typeof instantiate>[0]) => instantiate(next, instanceSource),
      };
    }
    return Object.assign(definition, { use: instantiate });
  }
  // The public mapped types retain declaration/schema/name relationships; the
  // dynamic recursive renderer above erases them only at this implementation boundary.
  return {
    defineForm: ((members, options) => buildDefinition(members, "form", options)) as DefineForm<Components>,
    defineSection: ((members, options) => buildDefinition(members, "section", options)) as DefineSection<Components>,
  };
}
