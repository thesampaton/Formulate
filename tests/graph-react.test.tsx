import { StrictMode } from "react";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import type { FieldPath } from "react-hook-form";
import { Form } from "../packages/react/src/form/form";
import { FieldRoot } from "../packages/react/src/fields/field";
import { InputControl } from "../packages/react/src/fields/controls";
import { useComposedFieldBinding } from "../packages/react/src/fields/use-composed-field-binding";
import { normalizeGraph } from "../packages/react/src/graph/normalize";
import { GraphRenderer, useGraphForm } from "../packages/react/src/graph/react";
import type { GraphFormRuntime } from "../packages/react/src/graph/react";
import type { NormalizedGraph } from "../packages/react/src/graph/model";
import { createGraphRuntime } from "../packages/react/src/graph/runtime";
import { defineChoice } from "../packages/react/src/choices/definition";
import type { Choice, ChoiceLoader } from "../packages/react/src/choices/definition";
import { useFormulate } from "../packages/react/src/form/use-formulate";

type Values = { cloud: { environment: string; region: string; change: string }; service: { name: string } };
const graph = normalizeGraph({
  id: "deployment", role: "form", children: [
    { id: "targets", role: "page", children: [
      { id: "environment", bind: "cloud.environment", defaultValue: "production", contract: { enum: ["production", "development"] } },
      { id: "region", bind: "cloud.region", defaultValue: "au", required: true },
      { id: "resource-name", bind: "service.name", defaultValue: "", required: true,
        contract: { pattern: "^(au|nz)-[a-z]+$" },
        composition: { segments: [{ binding: "cloud.region" }, { literal: "-" }, { input: true }] } },
    ] },
    { id: "production", role: "section", applicable: { binding: "cloud.environment", equals: "production" }, children: [
      { id: "change", bind: "cloud.change", defaultValue: "", required: true },
    ] },
  ],
});

function FragmentEditor() {
  const field = useComposedFieldBinding();
  return field.segments.map((segment, index) => segment.kind === "input"
    ? <input key={index} id={field.id} aria-label="Resource fragment" value={segment.value} onBlur={field.onBlur}
        onChange={(event) => field.onInputChange(index, event.target.value)} />
    : <span key={index}>{segment.value}</span>);
}

it("projects one runtime into existing controls and retains hidden drafts while submitting the headless payload", async () => {
  let form!: GraphFormRuntime<Values>;
  const submit = vi.fn();
  function Example() {
    form = useGraphForm<Values>(graph);
    return <Form form={form} onSubmit={submit}>
      <GraphRenderer graph={graph} inspection={form.inspection} renderField={(node) =>
        <FieldRoot control={form.control} name={node.bind as FieldPath<Values>} label={node.id}>
          {node.id === "resource-name" ? <FragmentEditor /> : <InputControl />}
        </FieldRoot>} />
      <button type="submit">Deploy</button>
    </Form>;
  }
  render(<StrictMode><Example /></StrictMode>);
  expect(form.getValues("service.name")).toBe("au-");
  expect(form.inspection.status).not.toBe("complete");
  await act(async () => { expect(await form.trigger()).toBe(false); });
  fireEvent.change(screen.getByLabelText("Resource fragment"), { target: { value: "api" } });
  fireEvent.change(screen.getByLabelText("change"), { target: { value: "CHANGE-42" } });
  await waitFor(() => expect(form.inspection.status).toBe("complete"));
  await act(async () => { form.setValue("cloud.region", "nz"); });
  expect(form.getValues("service.name")).toBe("nz-api");
  expect(screen.getByLabelText("Resource fragment")).toHaveValue("api");

  await act(async () => { form.graphRuntime.update({ "cloud.environment": "development" }); });
  expect(screen.queryByLabelText("change")).toBeNull();
  expect(form.getValues("cloud.change")).toBe("CHANGE-42");
  await act(async () => { form.graphRuntime.update({ "service.name": "nz-worker" }); });
  expect(screen.getByLabelText("Resource fragment")).toHaveValue("worker");

  const headless = createGraphRuntime(graph);
  headless.update({ "service.name": "au-api", "cloud.change": "CHANGE-42" });
  headless.update({ "cloud.region": "nz" });
  headless.update({ "cloud.environment": "development", "service.name": "nz-worker" });
  fireEvent.click(screen.getByRole("button", { name: "Deploy" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]![0]).toEqual(headless.getSnapshot().payload);
  expect(submit.mock.calls[0]![0]).toEqual({ cloud: { environment: "development", region: "nz" }, service: { name: "nz-worker" } });
  headless.dispose();
});

it("normalizes reset baselines and immediate setters through the graph composer", async () => {
  const { result } = renderHook(() => {
    const form = useGraphForm<Values>(graph, { defaultValues: { cloud: { environment: "development" } } });
    void form.formState.isDirty;
    return form;
  });
  await act(async () => {
    result.current.reset({ cloud: { environment: "development", region: "nz", change: "draft" }, service: { name: "" } });
  });
  expect(result.current.getValues("service.name")).toBe("nz-");
  expect(result.current.formState.isDirty).toBe(false);
  await act(async () => {
    result.current.setValue("service.name", "nz-api", { shouldDirty: true });
    result.current.setValues({ cloud: { environment: "development", region: "au", change: "draft" } });
    expect(result.current.getValues("service.name")).toBe("au-api");
    expect(await result.current.trigger()).toBe(true);
  });
  expect(result.current.formState.isDirty).toBe(true);
  await act(async () => { result.current.reset(); });
  expect(result.current.getValues("service.name")).toBe("nz-");
  expect(result.current.formState.isDirty).toBe(false);
});

it("starts choice requests once in StrictMode and revalidates settled evidence for existing choice consumers", async () => {
  const requests: { signal: AbortSignal; resolve: (options: readonly Choice[]) => void }[] = [];
  const load: ChoiceLoader = vi.fn((_input, signal) => new Promise<readonly Choice[]>((resolve) => { requests.push({ signal, resolve }); }));
  const rule = defineChoice<{ account: string }, string, { load: ChoiceLoader }, string, Choice>({
    getInput: (values) => values.account || null,
    getRequestKey: (input) => input,
    getLoader: (services) => services.load,
    validateSelection: (selection, options) => options.some((option) => option.value === selection) ? undefined : "Choose an available region.",
    messages: { missing: "Choose an account.", pending: "Loading regions.", failed: "Unable to load regions." },
  });
  const choiceGraph = normalizeGraph({ id: "choice-form", role: "form", children: [
    { id: "account-node", bind: "account", defaultValue: "A", required: true },
    { id: "region-node", bind: "region", defaultValue: "A1", required: true,
      choices: { capability: "regions", dependencies: ["account"] } },
  ] });
  const capabilities = { regions: (values: { account: string }, selection: string) => rule.resolve(values, selection, { load }) };
  const { result, unmount } = renderHook(() => useGraphForm<{ account: string; region: string }>(choiceGraph, { capabilities }), {
    wrapper: StrictMode,
  });
  await waitFor(() => expect(requests).toHaveLength(1));
  expect(result.current.inspection.status).toBe("pending");
  expect(result.current.choices.get("region", rule)?.status).toBe("pending");
  await act(async () => { expect(await result.current.trigger()).toBe(false); });
  await act(async () => { requests[0]!.resolve([{ value: "A1", label: "Region A1" }]); });
  await waitFor(() => expect(result.current.getFieldState("region").error).toBeUndefined());
  expect(result.current.inspection.status).toBe("complete");
  expect(result.current.choices.get("region", rule)?.options).toEqual([{ value: "A1", label: "Region A1" }]);
  expect(result.current.choices.get("region", { ...rule })).toBeUndefined();
  await act(async () => { result.current.setValue("account", "B"); });
  await waitFor(() => expect(requests).toHaveLength(2));
  unmount();
  await act(async () => {});
  expect(requests[1]!.signal.aborted).toBe(true);
});

it("retains values when a field moves between presentation containers", async () => {
  const { result, rerender } = renderHook(({ definition }) => useGraphForm<Values>(definition), { initialProps: { definition: graph } });
  await act(async () => { result.current.setValue("service.name", "au-draft"); });
  const moved: NormalizedGraph = {
    ...graph,
    relations: graph.relations.map(([source, relation, target]) =>
      relation === "contains" && target === "resource-name" ? ["deployment", relation, target] : [source, relation, target]),
  };
  rerender({ definition: moved });
  expect(result.current.getValues("service.name")).toBe("au-draft");
  expect(result.current.inspection.state.values["service.name"]).toBe("au-draft");
  await act(async () => { result.current.setValue("cloud.region", "nz"); });
  expect(result.current.getValues("service.name")).toBe("nz-draft");
});

it("rejects explicit derived writes for both humans and agents while reset hydrates canonical values", async () => {
  const derivedGraph = normalizeGraph({ id: "derived", role: "form", children: [
    { id: "region", bind: "service.region", defaultValue: "au" },
    { id: "name", bind: "service.name", defaultValue: "", composition: { segments: [{ binding: "service.region" }, { literal: "-worker" }] } },
  ] });
  const { result } = renderHook(() => useGraphForm<{ service: { region: string; name: string } }>(derivedGraph));
  expect(() => result.current.setValue("service.name", "wrong")).toThrow('Derived value "service.name" cannot be edited.');
  expect(() => result.current.setValue("service", { region: "nz", name: "wrong" })).toThrow('Derived value "service.name" cannot be edited.');
  expect(() => result.current.setValues({ service: { region: "nz", name: "wrong" } })).toThrow('Derived value "service.name" cannot be edited.');
  expect(() => result.current.graphRuntime.update({ "service.name": "wrong" })).toThrow('Derived value "service.name" cannot be edited.');
  expect(result.current.getValues()).toEqual({ service: { region: "au", name: "au-worker" } });
  await act(async () => { result.current.reset({ service: { region: "nz", name: "old" } }); });
  expect(result.current.getValues()).toEqual({ service: { region: "nz", name: "nz-worker" } });
});

it("preserves cross-field capability issue paths at the form boundary", async () => {
  const matchingGraph = normalizeGraph({
    id: "matching", role: "form", validate: { capability: "matching-values" }, children: [
      { id: "source", bind: "source", defaultValue: "alpha" },
      { id: "confirmation", bind: "confirmation", defaultValue: "beta" },
    ],
  });
  const capabilities = {
    "matching-values": (values: { source: string; confirmation: string }) => values.source === values.confirmation
      ? undefined : [{ path: ["confirmation"], message: "Confirmation must match the source." }],
  };
  const submit = vi.fn();
  const invalid = vi.fn();
  function Example() {
    const form = useGraphForm<{ source: string; confirmation: string }>(matchingGraph, { capabilities });
    return <Form form={form} onSubmit={submit} onInvalid={invalid}>
      <input aria-label="Source" {...form.register("source")} />
      <input aria-label="Confirmation" {...form.register("confirmation")} />
      <button type="submit">Confirm</button>
    </Form>;
  }
  render(<Example />);
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(invalid).toHaveBeenCalledTimes(1));
  expect(invalid.mock.calls[0]![0].confirmation.message).toBe("Confirmation must match the source.");
  expect(invalid.mock.calls[0]![0].root).toBeUndefined();
  expect(submit).not.toHaveBeenCalled();
  await act(async () => { fireEvent.change(screen.getByLabelText("Confirmation"), { target: { value: "alpha" } }); });
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
});

it("matches native schema validation and parsing even when descriptive contracts cannot describe coercion", async () => {
  const schema = z.object({ count: z.coerce.number<string>().min(1), label: z.string().trim().min(2), empty: z.string() });
  type Input = z.input<typeof schema>;
  type Output = z.output<typeof schema>;
  const defaultValues = { count: "2", label: " ok ", empty: "" };
  const graph = normalizeGraph({ id: "authority", role: "form", validate: { capability: "validate" }, parse: { capability: "parse" }, children: [
    { id: "count", bind: "count", contract: { type: "number" }, validate: { capability: "validateCount" } },
    { id: "label", bind: "label", contract: { type: "string", pattern: "^[a-z]+$" }, validate: { capability: "validateLabel" } },
    { id: "empty", bind: "empty", contract: { minLength: 1 }, validate: { capability: "validateEmpty" } },
  ] });
  const validate = (contract: z.ZodType) => (value: unknown) => {
    const result = contract.safeParse(value);
    return result.success ? undefined : result.error.issues;
  };
  const capabilities = {
    validate: validate(schema), parse: (value: unknown) => schema.parse(value),
    validateCount: validate(schema.shape.count), validateLabel: validate(schema.shape.label), validateEmpty: validate(schema.shape.empty),
  };
  const native = renderHook(() => useFormulate(schema, { defaultValues }));
  const portable = renderHook(() => useGraphForm<Input, Output>(graph, { capabilities, defaultValues }));
  const nativeSubmit = vi.fn();
  const portableSubmit = vi.fn();
  await act(async () => {
    expect(await native.result.current.trigger()).toBe(true);
    expect(await portable.result.current.trigger()).toBe(true);
    await native.result.current.handleSubmit(nativeSubmit)();
    await portable.result.current.handleSubmit(portableSubmit)();
  });
  expect(portableSubmit.mock.calls[0]![0]).toEqual(nativeSubmit.mock.calls[0]![0]);
  expect(portableSubmit.mock.calls[0]![0]).toEqual({ count: 2, label: "ok", empty: "" });
  await act(async () => {
    native.result.current.setValue("count", "invalid");
    portable.result.current.setValue("count", "invalid");
    expect(await native.result.current.trigger()).toBe(false);
    expect(await portable.result.current.trigger()).toBe(false);
  });
  expect(portable.result.current.getFieldState("count").error?.message).toBe(native.result.current.getFieldState("count").error?.message);
});

it("awaits asynchronous defaults before loading choices and records canonical reset values", async () => {
  type Input = { account: string; name: string; region: string };
  let resolveDefaults!: (values: Input) => void;
  const defaults = new Promise<Input>((resolve) => { resolveDefaults = resolve; });
  const load = vi.fn(async (_input: string, _signal: AbortSignal) => [{ value: "AU", label: "Australia" }]);
  const rule = defineChoice({
    getInput: (values: Input) => values.account,
    getRequestKey: (input: string) => input,
    getLoader: () => load,
    validateSelection: () => undefined,
    messages: { missing: "Choose account", pending: "Loading", failed: "Failed" },
  });
  const graph = normalizeGraph({ id: "async-defaults", role: "form", children: [
    { id: "account", bind: "account", defaultValue: "old" },
    { id: "name", bind: "name", defaultValue: "", composition: { segments: [{ binding: "account" }, { literal: "-" }, { input: true }] } },
    { id: "region", bind: "region", defaultValue: "AU", choices: { capability: "regions", dependencies: ["account"] } },
  ] });
  const capabilities = { regions: (values: Input, selection: string) => rule.resolve(values, selection, undefined) };
  const { result } = renderHook(() => {
    const form = useGraphForm<Input>(graph, { capabilities, defaultValues: async () => defaults });
    void form.formState.isDirty;
    return form;
  });
  expect(result.current.formState.isLoading).toBe(true);
  await act(async () => {});
  expect(load).not.toHaveBeenCalled();
  await act(async () => { resolveDefaults({ account: "acme", name: "", region: "AU" }); });
  await waitFor(() => expect(result.current.formState.isLoading).toBe(false));
  expect(result.current.getValues()).toEqual({ account: "acme", name: "acme-", region: "AU" });
  expect(result.current.formState.isDirty).toBe(false);
  expect(load).toHaveBeenCalledTimes(1);
  expect(load.mock.calls[0]?.[0]).toBe("acme");
  await act(async () => { result.current.setValue("name", "acme-api", { shouldDirty: true }); });
  expect(result.current.formState.isDirty).toBe(true);
  await act(async () => { result.current.reset(); });
  expect(result.current.getValues("name")).toBe("acme-");
  expect(result.current.formState.isDirty).toBe(false);
});

it("canonicalizes reactive values through the same runtime and reset baseline", async () => {
  type Input = { account: string; name: string };
  const graph = normalizeGraph({ id: "reactive-values", role: "form", children: [
    { id: "account", bind: "account" },
    { id: "name", bind: "name", composition: { segments: [{ binding: "account" }, { literal: "-" }, { input: true }] } },
  ] });
  const { result, rerender } = renderHook(({ values }: { values: Input }) => {
    const form = useGraphForm<Input>(graph, { values });
    void form.formState.isDirty;
    return form;
  }, { initialProps: { values: { account: "acme", name: "" } } });
  expect(result.current.getValues()).toEqual({ account: "acme", name: "acme-" });
  rerender({ values: { account: "other", name: "worker" } });
  await waitFor(() => expect(result.current.getValues()).toEqual({ account: "other", name: "other-worker" }));
  expect(result.current.inspection.state.values).toEqual({ account: "other", name: "other-worker" });
  expect(result.current.formState.isDirty).toBe(false);
  await act(async () => { result.current.setValue("name", "other-edited", { shouldDirty: true }); });
  await act(async () => { result.current.reset(); });
  expect(result.current.getValues("name")).toBe("other-worker");
  expect(result.current.formState.isDirty).toBe(false);
});
