import { StrictMode, useCallback } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { Form, Page, defineChoice, defineForm, defineSection } from "@formulate/react";
import { useChoiceForm } from "@formulate/react";
import type { ChoiceLoader } from "@formulate/react";

it("cancels a pending submit when the choice service is replaced even if its input, options and revision count match", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const schema = z.object({ region: z.string() }).superRefine(async () => { await gate; });
  const rule = defineChoice({
    input: (_: { region: string }) => "A", key: (input: string) => input,
    loader: (services: { loader: ChoiceLoader }) => services.loader,
    validate: (selection: string, options: readonly { value: string; label: string }[]) => options.some((option) => option.value === selection) ? undefined : "Unavailable",
    messages: { missing: "Missing", pending: "Pending", failed: "Failed" },
  });
  const definition = defineForm({ region: { schema: z.string(), defaultValue: "east", label: "Region", component: "input", choices: rule } });
  const options = [{ value: "east", label: "East" }];
  const first: ChoiceLoader = async () => options;
  const replacement: ChoiceLoader = async () => options;
  const onSubmit = vi.fn();
  function Harness({ loader }: { loader: ChoiceLoader }) {
    const fields = useCallback((values: { region: string }) => definition.bindChoices({ values, services: { loader } }), [loader]);
    const flow = useChoiceForm({ schema, fields, defaultValues: { region: "east" } });
    return <Form form={flow.form} onSubmit={onSubmit} getValidationRevision={flow.getValidationRevision}>
      <p>{flow.choices.get("region", rule)?.status}</p><button type="submit">Deploy</button>
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
    input: (values: { tenant: string }) => ({ tenant: values.tenant }), key: (input) => input.tenant,
    loader: (services: { numbers: typeof numbers }) => services.numbers,
    validate: (selection: number, options: readonly number[]) => options.includes(selection) ? undefined : "Unknown number", messages,
  });
  const word = defineChoice({
    input: (values: { tenant: string }) => values.tenant, key: (input) => input,
    loader: (services: { words: typeof words }) => services.words,
    validate: (selection: string, options: readonly string[]) => options.includes(selection) ? undefined : "Unknown word", messages,
  });
  const definition = defineForm({
    tenant: { schema: z.string(), defaultValue: "A", label: "Tenant", component: "input" },
    amount: { schema: z.number(), defaultValue: 2, label: "Amount", component: "number", choices: numeric },
    answer: { schema: z.string(), defaultValue: "yes", label: "Answer", component: "input", choices: word },
  }, { schema: (schema) => schema.transform(({ amount, answer }) => ({ payload: { count: amount, answer } })) });
  const onSubmit = vi.fn();
  let current!: ReturnType<typeof useChoiceForm<z.input<typeof definition.schema>, z.output<typeof definition.schema>>>;
  function Harness({ load = numbers }: { load?: typeof numbers }) {
    const fields = useCallback((values: z.input<typeof definition.schema>) => definition.bindChoices({ values, services: { numbers: load, words } }), [load]);
    current = useChoiceForm({ schema: definition.schema, defaultValues: definition.defaultValues, fields });
    return <Form form={current.form} onSubmit={onSubmit} getValidationRevision={current.getValidationRevision}>
      <p>Number {current.choices.get("amount", numeric)?.status}</p>
      <p>Word {current.choices.get("answer", word)?.status}</p>
      <button type="submit">Accept</button>
    </Form>;
  }
  const view = render(<Harness />);
  await screen.findByText("Number ready"); await screen.findByText("Word ready");
  expect(current.choices.get("amount", word)).toBeUndefined();
  await act(async () => { current.form.setValue("amount", 9); await current.form.trigger(); });
  expect(current.form.getFieldState("amount").error?.message).toBe("Unknown number");
  expect(numbers).toHaveBeenCalledTimes(1); // Fresh but equivalent structured input does not reload.
  await act(async () => { current.form.setValue("amount", 2); });
  fireEvent.submit(screen.getByRole("button", { name: "Accept" }).closest("form")!);
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ payload: { count: 2, answer: "yes" } }, expect.anything()));
  expect(current.form.getValues()).toEqual({ tenant: "A", amount: 2, answer: "yes" });
  const replacement = vi.fn(async (_input: { tenant: string }, _signal: AbortSignal) => [2]);
  view.rerender(<Harness load={replacement} />);
  await waitFor(() => expect(replacement).toHaveBeenCalledTimes(1));
  await screen.findByText("Number ready");
  expect(words).toHaveBeenCalledTimes(1);
  expect(current.choices.get("amount", numeric)?.options).toEqual([2]);
});

it("carries one local membership rule through nested reused sections even without mounted editors", async () => {
  const rule = defineChoice({
    input: (values: { account: string }) => values.account || null, key: (input: string) => input,
    loader: (services: { load: ChoiceLoader }) => services.load,
    validate: (selection: string, options: readonly { value: string; label: string }[]) =>
      selection !== "restricted" && options.some((option) => option.value === selection) ? undefined : "Choose an unrestricted region",
    messages: { missing: "Choose an account", pending: "Checking", failed: "Retry" },
  });
  const target = defineSection({
    account: { schema: z.string(), defaultValue: "A", label: "Account", component: "input" },
    region: { schema: z.string(), defaultValue: "restricted", label: "Region", component: "input", choices: rule },
  });
  const group = defineSection({ first: target, second: target });
  const definition = defineForm({ deployment: group });
  const load: ChoiceLoader = async () => [{ value: "restricted", label: "Restricted" }];
  const fields = (values: z.input<typeof definition.schema>) => definition.bindChoices({ values, services: { load } });
  let current!: ReturnType<typeof useChoiceForm<z.input<typeof definition.schema>, z.output<typeof definition.schema>>>;
  function Harness() {
    current = useChoiceForm({ schema: definition.schema, defaultValues: definition.defaultValues, fields });
    return <p>{current.choices.get("deployment.second.region", rule)?.status}</p>;
  }
  render(<Harness />); await screen.findByText("ready");
  await act(async () => { expect(await current.form.trigger()).toBe(false); });
  expect(current.form.getFieldState("deployment.first.region").error?.message).toBe("Choose an unrestricted region");
  expect(current.form.getFieldState("deployment.second.region").error?.message).toBe("Choose an unrestricted region");
});

it("moves error paths with a binding while keeping its request lifetime", async () => {
  const load = vi.fn(async (_input: string, _signal: AbortSignal) => ["valid"]);
  const rule = defineChoice({
    input: (_values: { value: string }) => "A", key: (input: string) => input,
    loader: (_services: {}) => load,
    validate: (selection: string, options: readonly string[]) => options.includes(selection) ? undefined : "Unavailable",
    messages: { missing: "Missing", pending: "Checking", failed: "Retry" },
  });
  const unit = defineSection({ value: { schema: z.string(), defaultValue: "", label: "Value", component: "input", choices: rule } });
  const schema = z.object({ first: z.string(), second: z.string() });
  let current!: ReturnType<typeof useChoiceForm<z.input<typeof schema>, z.output<typeof schema>>>;
  function Harness({ path }: { path: "first" | "second" }) {
    const fields = useCallback((values: z.input<typeof schema>) => unit.bindChoices({ id: "stable", values, services: {}, bindings: { value: path } }), [path]);
    current = useChoiceForm({ schema, fields, defaultValues: { first: "old", second: "old" } });
    return <p>{current.choices.get("stable.value", rule)?.status}</p>;
  }
  const view = render(<Harness path="first" />); await screen.findByText("ready");
  await waitFor(() => expect(current.form.getFieldState("first").error?.message).toBe("Unavailable"));
  view.rerender(<Harness path="second" />);
  await waitFor(() => expect(current.form.getFieldState("second").error?.message).toBe("Unavailable"));
  expect(current.form.getFieldState("first").error).toBeUndefined();
  expect(load).toHaveBeenCalledTimes(1);
});

it("loads and validates current dependencies while the editor Activity stays hidden", async () => {
  const requests: { input: string; signal: AbortSignal; resolve: (options: readonly string[]) => void }[] = [];
  const load = (input: string, signal: AbortSignal) => new Promise<readonly string[]>((resolve) => requests.push({ input, signal, resolve }));
  const rule = defineChoice({
    input: (values: { account: string }) => values.account, key: (input: string) => input,
    loader: (_services: {}) => load,
    validate: (selection: string, options: readonly string[]) => options.includes(selection) ? undefined : "Unavailable in this account",
    messages: { missing: "Missing", pending: "Checking", failed: "Retry" },
  });
  const definition = defineForm({
    account: { schema: z.string(), defaultValue: "A", label: "Account", component: "input" },
    region: { schema: z.string(), defaultValue: "A1", label: "Region", component: "input", choices: rule },
  });
  const fields = (values: z.input<typeof definition.schema>) => definition.bindChoices({ values, services: {} });
  const save = vi.fn();
  let current!: ReturnType<typeof useChoiceForm<z.input<typeof definition.schema>, z.output<typeof definition.schema>>>;
  function Harness({ active }: { active: boolean }) {
    current = useChoiceForm({ schema: definition.schema, defaultValues: definition.defaultValues, fields });
    return <Form form={current.form} onSubmit={save} getValidationRevision={current.getValidationRevision}>
      <Page id="target" title="Target" active={active}><definition.Fields /></Page>
      <button type="submit">Save target</button>
    </Form>;
  }
  const view = render(<Harness active={false} />);
  await waitFor(() => expect(requests).toHaveLength(1));
  expect(screen.getByLabelText("Region")).not.toBeVisible();
  act(() => current.form.setValue("account", "B"));
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(requests[0]!.signal.aborted).toBe(true);
  await act(async () => { requests[1]!.resolve(["B1"]); requests[0]!.resolve(["A1"]); });
  fireEvent.submit(screen.getByRole("button", { name: "Save target" }).closest("form")!);
  await waitFor(() => expect(current.form.getFieldState("region").error?.message).toBe("Unavailable in this account"));
  expect(save).not.toHaveBeenCalled();
  view.rerender(<Harness active />);
  expect(screen.getByLabelText("Region")).toBeVisible();
  expect(screen.getByLabelText("Region")).toHaveValue("A1");
  expect(requests).toHaveLength(2);
});
