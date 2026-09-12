import { StrictMode, useCallback } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { Form, Page, defineChoice, defineField, defineForm, defineSection, field } from "@formulate/react";
import { useChoiceForm } from "@formulate/react";
import type { ChoiceLoader } from "@formulate/react";

it("cancels a pending submit when the choice service is replaced even if its input, options and revision count match", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const schema = z.object({ region: z.string() }).superRefine(async () => { await gate; });
  const rule = defineChoice({
    getInput: (_: { region: string }) => "A", getRequestKey: (input: string) => input,
    getLoader: (services: { loader: ChoiceLoader }) => services.loader,
    validateSelection: (selection: string, options: readonly { value: string; label: string }[]) => options.some((option) => option.value === selection) ? undefined : "Unavailable",
    messages: { missing: "Missing", pending: "Pending", failed: "Failed" },
  });
  const definition = defineForm({
    region: { schema: z.string(), defaultValue: "east", label: "Region", component: "input", choices: rule },
  }, { schema: () => schema });
  const options = [{ value: "east", label: "East" }];
  const first: ChoiceLoader = async () => options;
  const replacement: ChoiceLoader = async () => options;
  const onSubmit = vi.fn();
  function Harness({ loader }: { loader: ChoiceLoader }) {
    const form = definition.useChoiceForm({ services: { loader } });
    return <Form form={form} onSubmit={onSubmit}>
      <p>{form.choices.get("region", rule)?.status}</p><button type="submit">Deploy</button>
    </Form>;
  }
  const view = render(<StrictMode><Harness loader={first} /></StrictMode>);
  await screen.findByText("ready");
  fireEvent.submit(screen.getByRole("button", { name: "Deploy" }).closest("form")!);
  expect(screen.getByRole("button", { name: "Deploy" }).closest("form")).toHaveAttribute("aria-busy", "true");
  view.rerender(<StrictMode><Harness loader={replacement} /></StrictMode>);
  await screen.findByText("ready");
  await act(async () => release());
  expect(onSubmit).not.toHaveBeenCalled();
  fireEvent.submit(screen.getByRole("button", { name: "Deploy" }).closest("form")!);
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ region: "east" }, expect.anything()));
});

it("supports independent loaders, structured inputs and numeric selections before output paths are transformed", async () => {
  const numbers = vi.fn(async (_input: { tenant: string }, _signal: AbortSignal) => [1, 2]);
  const words = vi.fn(async (_input: string, _signal: AbortSignal) => ["yes"]);
  const messages = { missing: "Missing dependency", pending: "Checking", failed: "Retry" };
  const numeric = defineChoice({
    getInput: (values: { tenant: string }) => ({ tenant: values.tenant }), getRequestKey: (input) => input.tenant,
    getLoader: (services: { numbers: typeof numbers }) => services.numbers,
    validateSelection: (selection: number, options: readonly number[]) => options.includes(selection) ? undefined : "Unknown number", messages,
  });
  const word = defineChoice({
    getInput: (values: { tenant: string }) => values.tenant, getRequestKey: (input) => input,
    getLoader: (services: { words: typeof words }) => services.words,
    validateSelection: (selection: string, options: readonly string[]) => options.includes(selection) ? undefined : "Unknown word", messages,
  });
  const definition = defineForm({
    tenant: { schema: z.string(), defaultValue: "A", label: "Tenant", component: "input" },
    amount: { schema: z.number(), defaultValue: 2, label: "Amount", component: "number", choices: numeric },
    answer: { schema: z.string(), defaultValue: "yes", label: "Answer", component: "input", choices: word },
  }, { schema: (schema) => schema.transform(({ amount, answer }) => ({ payload: { count: amount, answer } })) });
  const onSubmit = vi.fn();
  let current!: ReturnType<typeof useChoiceForm<z.input<typeof definition.schema>, z.output<typeof definition.schema>>>;
  function Harness({ load = numbers }: { load?: typeof numbers }) {
    const getChoiceBindings = useCallback((values: z.input<typeof definition.schema>) => definition.bindChoices({ values, services: { numbers: load, words } }), [load]);
    current = useChoiceForm({ schema: definition.schema, defaultValues: definition.defaultValues, getChoiceBindings });
    return <Form form={current} onSubmit={onSubmit}>
      <p>Number {current.choices.get("amount", numeric)?.status}</p>
      <p>Word {current.choices.get("answer", word)?.status}</p>
      <button type="submit">Accept</button>
    </Form>;
  }
  const view = render(<Harness />);
  await screen.findByText("Number ready"); await screen.findByText("Word ready");
  expect(current.choices.get("amount", word)).toBeUndefined();
  await act(async () => { current.setValue("amount", 9); await current.trigger(); });
  expect(current.getFieldState("amount").error?.message).toBe("Unknown number");
  expect(numbers).toHaveBeenCalledTimes(1); // Fresh but equivalent structured input does not reload.
  await act(async () => { current.setValue("amount", 2); });
  fireEvent.submit(screen.getByRole("button", { name: "Accept" }).closest("form")!);
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ payload: { count: 2, answer: "yes" } }, expect.anything()));
  expect(current.getValues()).toEqual({ tenant: "A", amount: 2, answer: "yes" });
  const replacement = vi.fn(async (_input: { tenant: string }, _signal: AbortSignal) => [2]);
  view.rerender(<Harness load={replacement} />);
  await waitFor(() => expect(replacement).toHaveBeenCalledTimes(1));
  await screen.findByText("Number ready");
  expect(words).toHaveBeenCalledTimes(1);
  expect(current.choices.get("amount", numeric)?.options).toEqual([2]);
});

it("carries one local membership rule through nested reused sections even without mounted editors", async () => {
  const rule = defineChoice({
    getInput: (values: { account: string }) => values.account || null, getRequestKey: (input: string) => input,
    getLoader: (services: { load: ChoiceLoader }) => services.load,
    validateSelection: (selection: string, options: readonly { value: string; label: string }[]) =>
      selection !== "restricted" && options.some((option) => option.value === selection) ? undefined : "Choose an unrestricted region",
    messages: { missing: "Choose an account", pending: "Checking", failed: "Retry" },
  });
  const target = defineSection({
    account: { schema: z.string(), defaultValue: "A", label: "Account", component: "input" },
    region: field(defineField({ primitive: "choice", schema: z.string(), defaultValue: "restricted", label: "Region", component: "input", choices: rule })),
  });
  const group = defineSection({ first: target, second: target });
  const definition = defineForm({ deployment: group });
  const load: ChoiceLoader = async () => [{ value: "restricted", label: "Restricted" }];
  const getChoiceBindings = (values: z.input<typeof definition.schema>) => definition.bindChoices({ values, services: { load } });
  let current!: ReturnType<typeof useChoiceForm<z.input<typeof definition.schema>, z.output<typeof definition.schema>>>;
  function Harness() {
    current = useChoiceForm({ schema: definition.schema, defaultValues: definition.defaultValues, getChoiceBindings });
    return <p>{current.choices.get("deployment.second.region", rule)?.status}</p>;
  }
  render(<Harness />); await screen.findByText("ready");
  await act(async () => { expect(await current.trigger()).toBe(false); });
  expect(current.getFieldState("deployment.first.region").error?.message).toBe("Choose an unrestricted region");
  expect(current.getFieldState("deployment.second.region").error?.message).toBe("Choose an unrestricted region");
});

it("lets reusable presentation read the choice view for its current section use", async () => {
  const load: ChoiceLoader = async (account) => [{ value: `${account}-east`, label: `${account} East` }];
  const rule = defineChoice({
    getInput: (values: { account: string }) => values.account || null,
    getRequestKey: (input: string) => input,
    getLoader: (services: { load: ChoiceLoader }) => services.load,
    validateSelection: (selection: string, options: readonly { value: string; label: string }[]) =>
      options.some((option) => option.value === selection) ? undefined : "Unavailable",
    messages: { missing: "Missing", pending: "Checking", failed: "Retry" },
  });
  const target = defineSection({
    account: { schema: z.string(), defaultValue: "A", label: "Account", component: "input" },
    region: { schema: z.string(), defaultValue: "A-east", label: "Region", component: "input", choices: rule },
  });
  const definition = defineForm({ primary: target, recovery: target });
  function Status({ label }: { label: string }) {
    const request = target.useChoice("region");
    return <p>{label}: {request?.options[0]?.label ?? request?.validationMessage ?? "Starting"}</p>;
  }
  function Harness() {
    const form = definition.useChoiceForm({ services: { load } });
    return <Form form={form} onSubmit={vi.fn()}>
      <definition.Section name="primary"><Status label="Primary" /></definition.Section>
      <definition.Section name="recovery"><Status label="Recovery" /></definition.Section>
    </Form>;
  }
  render(<Harness />);
  await screen.findByText("Primary: A East");
  await screen.findByText("Recovery: A East");
});

it("moves error paths with a binding while keeping its request lifetime", async () => {
  const load = vi.fn(async (_input: string, _signal: AbortSignal) => ["valid"]);
  const rule = defineChoice({
    getInput: (_values: { value: string }) => "A", getRequestKey: (input: string) => input,
    getLoader: (_services: {}) => load,
    validateSelection: (selection: string, options: readonly string[]) => options.includes(selection) ? undefined : "Unavailable",
    messages: { missing: "Missing", pending: "Checking", failed: "Retry" },
  });
  const unit = defineSection({ value: { schema: z.string(), defaultValue: "", label: "Value", component: "input", choices: rule } });
  const schema = z.object({ first: z.string(), second: z.string() });
  let current!: ReturnType<typeof useChoiceForm<z.input<typeof schema>, z.output<typeof schema>>>;
  function Harness({ path }: { path: "first" | "second" }) {
    const getChoiceBindings = useCallback((values: z.input<typeof schema>) => unit.bindChoices({ id: "stable", values, services: {}, bindings: { value: path } }), [path]);
    current = useChoiceForm({ schema, getChoiceBindings, defaultValues: { first: "old", second: "old" } });
    return <p>{current.choices.get("stable.value", rule)?.status}</p>;
  }
  const view = render(<Harness path="first" />); await screen.findByText("ready");
  await waitFor(() => expect(current.getFieldState("first").error?.message).toBe("Unavailable"));
  view.rerender(<Harness path="second" />);
  await waitFor(() => expect(current.getFieldState("second").error?.message).toBe("Unavailable"));
  expect(current.getFieldState("first").error).toBeUndefined();
  expect(load).toHaveBeenCalledTimes(1);
});

it("loads and validates current dependencies while the editor Activity stays hidden", async () => {
  const requests: { input: string; signal: AbortSignal; resolve: (options: readonly string[]) => void }[] = [];
  const load = (input: string, signal: AbortSignal) => new Promise<readonly string[]>((resolve) => requests.push({ input, signal, resolve }));
  const rule = defineChoice({
    getInput: (values: { account: string }) => values.account, getRequestKey: (input: string) => input,
    getLoader: (_services: {}) => load,
    validateSelection: (selection: string, options: readonly string[]) => options.includes(selection) ? undefined : "Unavailable in this account",
    messages: { missing: "Missing", pending: "Checking", failed: "Retry" },
  });
  const definition = defineForm({
    account: { schema: z.string(), defaultValue: "A", label: "Account", component: "input" },
    region: { schema: z.string(), defaultValue: "A1", label: "Region", component: "input", choices: rule },
  });
  const getChoiceBindings = (values: z.input<typeof definition.schema>) => definition.bindChoices({ values, services: {} });
  const save = vi.fn();
  let current!: ReturnType<typeof useChoiceForm<z.input<typeof definition.schema>, z.output<typeof definition.schema>>>;
  function Harness({ active }: { active: boolean }) {
    current = useChoiceForm({ schema: definition.schema, defaultValues: definition.defaultValues, getChoiceBindings });
    return <Form form={current} onSubmit={save}>
      <Page pageId="target" title="Target" active={active}><definition.Fields /></Page>
      <button type="submit">Save target</button>
    </Form>;
  }
  const view = render(<Harness active={false} />);
  await waitFor(() => expect(requests).toHaveLength(1));
  expect(screen.getByLabelText("Region")).not.toBeVisible();
  act(() => current.setValue("account", "B"));
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(requests[0]!.signal.aborted).toBe(true);
  await act(async () => { requests[1]!.resolve(["B1"]); requests[0]!.resolve(["A1"]); });
  fireEvent.submit(screen.getByRole("button", { name: "Save target" }).closest("form")!);
  await waitFor(() => expect(current.getFieldState("region").error?.message).toBe("Unavailable in this account"));
  expect(save).not.toHaveBeenCalled();
  view.rerender(<Harness active />);
  expect(screen.getByLabelText("Region")).toBeVisible();
  expect(screen.getByLabelText("Region")).toHaveValue("A1");
  expect(requests).toHaveLength(2);
});
