"use client";

import { Fragment, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { get } from "react-hook-form";
import type { DefaultValues, FieldPath, FieldPathValue, FieldValues, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import type { ChoiceController } from "../choices/context.js";
import type { ChoiceRule } from "../choices/definition.js";
import { installCompositionRuntime } from "../fields/use-composed-field-binding.js";
import { useFormulate } from "../form/use-formulate.js";
import type { FormulateOptions } from "../form/use-formulate.js";
import type { NormalizedGraph, PortableNode } from "./model.js";
import { createGraphRuntime, expandGraphValues, flattenGraphValues } from "./runtime.js";
import type { GraphRuntime, GraphSnapshot } from "./runtime.js";

type RuntimeOptions = NonNullable<Parameters<typeof createGraphRuntime>[1]>;

export type GraphFormOptions<Input extends FieldValues, Output extends FieldValues = Input> =
  FormulateOptions<Input, Output> & {
    capabilities?: RuntimeOptions["capabilities"];
  };

export type GraphFormRuntime<Input extends FieldValues, Output extends FieldValues = Input> =
  UseFormReturn<Input, unknown, Output> & {
    readonly graphRuntime: GraphRuntime;
    readonly inspection: GraphSnapshot;
    readonly choices: ChoiceController;
    readonly getValidationRevision: () => string | number;
    readonly synchronizeComposedValues: () => void;
  };

const equalValue = (left: unknown, right: unknown) => Object.is(left, right) || JSON.stringify(left) === JSON.stringify(right);

function declaresPath(value: unknown, path: string): boolean {
  let current = value;
  for (const key of path.split(".")) {
    if (current === null || typeof current !== "object" || !Object.hasOwn(current, key)) return false;
    current = (current as Record<string, unknown>)[key];
  }
  return true;
}

/** RHF owns the editors; the same graph runtime used headlessly owns semantics. */
export function useGraphForm<Input extends FieldValues, Output extends FieldValues = Input>(
  graph: NormalizedGraph,
  options: GraphFormOptions<NoInfer<Input>, NoInfer<Output>> = {},
): GraphFormRuntime<Input, Output> {
  const { capabilities, defaultValues, values: reactiveValues, compositionContext, ...formOptions } = options;
  const previousRuntime = useRef<GraphRuntime | undefined>(undefined);
  const runtime = useMemo(() => {
    const retained = previousRuntime.current?.getSnapshot().state.values;
    return createGraphRuntime(graph, {
      capabilities,
      // Replacing presentation or host capabilities retains values by binding.
      state: { values: flattenGraphValues(graph, retained ? expandGraphValues(retained) : reactiveValues ?? (typeof defaultValues === "function" ? {} : defaultValues ?? {})) },
      context: compositionContext,
      // A discarded StrictMode render must not start network requests.
      deferChoices: true,
    });
  }, [graph, capabilities]);
  previousRuntime.current = runtime;
  const inspection = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, runtime.getSnapshot);
  const mountedRuntimes = useRef(new Set<GraphRuntime>());
  const baseline = useRef(expandGraphValues(runtime.getSnapshot().state.values) as DefaultValues<Input>);
  const initialValues = useMemo(() => typeof defaultValues === "function" && reactiveValues === undefined
    ? async () => {
      const supplied = await defaultValues();
      if (!mountedRuntimes.current.has(runtime)) return supplied;
      const snapshot = runtime.replace({ values: flattenGraphValues(graph, supplied) }, { fresh: true });
      const canonical = expandGraphValues(snapshot.state.values) as Input;
      baseline.current = canonical as DefaultValues<Input>;
      return canonical;
    }
    : expandGraphValues(runtime.getSnapshot().state.values) as DefaultValues<Input>, [runtime]);
  const schema = useMemo(() => z.custom<Input>().transform(async (values, context) => {
    runtime.replace({ values: flattenGraphValues(graph, values) });
    const snapshot = await runtime.waitForValidation();
    let issueCount = 0;
    for (const [id, nodeState] of Object.entries(snapshot.nodes)) {
      if (!nodeState.applicable) continue;
      const locatedMessages = new Map<string, number>();
      for (const issue of nodeState.validationIssues ?? []) {
        context.addIssue({ code: "custom", path: [...issue.path], message: issue.message });
        locatedMessages.set(issue.message, (locatedMessages.get(issue.message) ?? 0) + 1);
        issueCount++;
      }
      for (const message of nodeState.issues) {
        const locatedCount = locatedMessages.get(message) ?? 0;
        if (locatedCount) {
          locatedMessages.set(message, locatedCount - 1);
          continue;
        }
        context.addIssue({ code: "custom", path: graph.nodes[id]?.bind?.split(".") ?? ["root", "graph"], message });
        issueCount++;
      }
    }
    if (snapshot.status !== "complete") {
      if (!issueCount) context.addIssue({ code: "custom", path: ["root", "graph"], message: `Interaction is ${snapshot.status}.` });
      return z.NEVER;
    }
    return snapshot.payload as Output;
  }), [graph, runtime]);
  const form = useFormulate<Input, Output>(schema as z.ZodType<Output, Input>, {
    shouldFocusError: false,
    ...formOptions,
    defaultValues: initialValues,
  });
  const rawReset = useRef(form.reset).current;
  const rawSetValue = useRef(form.setValue).current;
  const rawSetValues = useRef(form.setValues).current;
  const loading = form.formState.isLoading;
  const synchronizer = useMemo(() => {
    let writing = false;
    const changedPaths = new Set<FieldPath<Input>>();
    const derivedBindings = Object.values(graph.nodes).filter((node) => node.bind && node.composition && !node.composition.segments.some((segment) => segment.input)).map((node) => node.bind!);
    function assertWritable(values: unknown, parent?: string) {
      for (const binding of derivedBindings) {
        const supplied = parent === undefined ? declaresPath(values, binding)
          : binding === parent || (binding.startsWith(`${parent}.`) && declaresPath(values, binding.slice(parent.length + 1)));
        if (supplied) throw new Error(`Derived value "${binding}" cannot be edited.`);
      }
    }
    function project(dirty = true) {
      if (writing || form.formState.isLoading) return;
      writing = true;
      try {
        const current = form.getValues();
        for (const node of Object.values(graph.nodes)) {
          if (!node.bind) continue;
          const value = runtime.getSnapshot().state.values[node.bind];
          if (equalValue(get(current, node.bind), value)) continue;
          changedPaths.add(node.bind as FieldPath<Input>);
          rawSetValue(node.bind as FieldPath<Input>, value as FieldPathValue<Input, FieldPath<Input>>, {
            shouldDirty: dirty, shouldTouch: false, shouldValidate: false,
          });
        }
      } finally {
        writing = false;
      }
    }
    function validateChanges() {
      if (changedPaths.size) {
        const paths = [...changedPaths];
        changedPaths.clear();
        void form.trigger(paths);
      }
    }
    function synchronize(validate = false) {
      if (writing || form.formState.isLoading) return;
      runtime.replace({ values: flattenGraphValues(graph, form.getValues()) });
      project();
      if (validate) validateChanges();
    }
    return {
      get writing() { return writing; },
      project,
      synchronize,
      validateChanges,
      reset: ((values, resetOptions) => {
        const supplied = typeof values === "function" ? values(form.getValues()) : values ?? baseline.current;
        writing = true;
        try {
          const snapshot = runtime.replace({ values: flattenGraphValues(graph, supplied) }, { fresh: true });
          const canonical = expandGraphValues(snapshot.state.values) as DefaultValues<Input>;
          if (!resetOptions?.keepDefaultValues) baseline.current = canonical;
          rawReset(canonical, resetOptions);
          changedPaths.clear();
        } finally {
          writing = false;
        }
        // keepValues/keepDirtyValues may intentionally retain some RHF drafts.
        synchronize();
      }) as typeof form.reset,
      setValue: ((name, value, setOptions) => {
        assertWritable(value, name);
        rawSetValue(name, value, setOptions);
        synchronize(true);
      }) as typeof form.setValue,
      setValues: ((values, setOptions) => {
        assertWritable(values);
        rawSetValues(values, setOptions);
        synchronize(true);
      }) as typeof form.setValues,
    };
  }, [form, graph, runtime, rawReset, rawSetValue, rawSetValues]);
  const choices = useMemo<ChoiceController>(() => {
    const byBinding = new Map(Object.values(graph.nodes).filter((node) => node.bind).map((node) => [node.bind!, node.id]));
    return {
      get: <Values, Selection, Services, Option,>(id: string, rule: ChoiceRule<Values, Selection, Services, Option>) => runtime.getChoice(Object.hasOwn(graph.nodes, id) ? id : byBinding.get(id) ?? id, rule),
      clearRequests: runtime.clearRequests,
    };
  }, [graph, runtime]);

  // Fragment controls read and edit the runtime's existing string composer.
  installCompositionRuntime(form.control, { ...runtime.composer, synchronize: synchronizer.synchronize });
  const installed = Object.assign(form, {
    graphRuntime: runtime,
    inspection,
    choices,
    getValidationRevision: runtime.getValidationRevision,
    synchronizeComposedValues: synchronizer.synchronize,
    reset: synchronizer.reset,
    setValue: synchronizer.setValue,
    setValues: synchronizer.setValues,
  }) as GraphFormRuntime<Input, Output>;

  useLayoutEffect(() => {
    mountedRuntimes.current.add(runtime);
    let active = true;
    let queued = false;
    const unsubscribeValues = form.subscribe({ formState: { values: true }, callback: () => {
      if (synchronizer.writing || queued) return;
      queued = true;
      // RHF's value notifications are read-only; project after they complete.
      queueMicrotask(() => {
        queued = false;
        if (active) synchronizer.synchronize(true);
      });
    } });
    const unsubscribeRuntime = runtime.subscribe(() => {
      synchronizer.project();
      // Agent/context updates can invalidate already displayed field errors too.
      queueMicrotask(() => { if (active) synchronizer.validateChanges(); });
    });
    if (!loading) {
      runtime.start();
      synchronizer.project(false);
    }
    return () => {
      active = false;
      mountedRuntimes.current.delete(runtime);
      unsubscribeValues();
      unsubscribeRuntime();
      // StrictMode reuses this runtime for a second effect setup. Actual
      // unmount still aborts requests before their results can affect editors.
      queueMicrotask(() => { if (!mountedRuntimes.current.has(runtime)) runtime.dispose(); });
    };
  }, [form, runtime, synchronizer, loading]);

  const previousValues = useRef(reactiveValues);
  useLayoutEffect(() => {
    if (reactiveValues !== undefined && !equalValue(reactiveValues, previousValues.current)) {
      synchronizer.reset(reactiveValues, formOptions.resetOptions);
      previousValues.current = reactiveValues;
    }
  }, [reactiveValues, synchronizer, formOptions.resetOptions]);

  useLayoutEffect(() => { runtime.setContext(compositionContext); }, [runtime, compositionContext]);
  const choiceEvidence = JSON.stringify(Object.entries(inspection.nodes).filter(([, node]) => node.choices).map(([id, node]) =>
    [id, node.choices!.status, node.choices!.revision, node.choices!.validationMessage]));
  useLayoutEffect(() => {
    if (loading) return;
    const paths = Object.values(graph.nodes).filter((node) => node.choices && node.bind).map((node) => node.bind as FieldPath<Input>);
    if (paths.length) void form.trigger(paths);
  }, [form, graph, choiceEvidence, loading]);
  return installed;
}

export type GraphRendererProps = {
  graph: NormalizedGraph;
  rootId?: string;
  renderField: (node: PortableNode) => ReactNode;
  renderContainer?: (node: PortableNode, children: ReactNode) => ReactNode;
} & (
  /** Supply the hook's inspection, or a standalone runtime to subscribe to. */
  | { inspection: GraphSnapshot; runtime?: GraphRuntime }
  | { inspection?: GraphSnapshot; runtime: GraphRuntime }
);

const noSubscription = () => () => {};
const noSnapshot = () => undefined;

/** Containment selects presentation; applicability comes only from inspection. */
export function GraphRenderer({ graph, inspection, runtime, rootId = graph.root, renderField, renderContainer }: GraphRendererProps) {
  const liveInspection = useSyncExternalStore(runtime?.subscribe ?? noSubscription, runtime?.getSnapshot ?? noSnapshot, runtime?.getSnapshot ?? noSnapshot);
  const snapshot = inspection ?? liveInspection;
  const children = useMemo(() => {
    const result = new Map<string, string[]>();
    for (const [parent, relation, child] of graph.relations) {
      if (relation !== "contains") continue;
      const siblings = result.get(parent) ?? [];
      siblings.push(child);
      result.set(parent, siblings);
    }
    return result;
  }, [graph]);
  function renderNode(id: string): ReactNode {
    const node = graph.nodes[id];
    if (!node || snapshot?.nodes[id]?.applicable === false) return null;
    if (node.role === "field") return <Fragment key={id}>{renderField(node)}</Fragment>;
    const descendants = children.get(id)?.map(renderNode);
    return <Fragment key={id}>{renderContainer ? renderContainer(node, descendants) : descendants}</Fragment>;
  }
  return renderNode(rootId);
}
