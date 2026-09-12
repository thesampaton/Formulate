import { useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { defineForm } from "../examples/react/src/lib/formulate-config";
import { FormSubmitButton } from "../examples/react/src/components/formulate/form-actions";
import { ComposedValues } from "../examples/react/src/declarations/composed-values";
import { ComposedValuesForm } from "../examples/react/src/compositions/composed-values";
import { exampleData } from "../examples/react/src/data/example-data";

it("submits single canonical values for email, URL, resource, reference and multi-input SKU", async () => {
  const user = userEvent.setup();
  const submit = vi.fn();
  const { container } = render(<ComposedValuesForm onSave={submit} />);
  await user.click(screen.getByRole("button", { name: "Load sample" }));
  expect(screen.getByRole("textbox", { name: "Company email" })).toHaveValue("sam");
  expect(screen.getByRole("textbox", { name: "Public URL" })).toHaveValue("monthly-report");
  expect(screen.getByRole("textbox", { name: "Resource name" })).toHaveValue("payments");
  expect(screen.getByRole("textbox", { name: "Customer reference" })).toHaveValue("0042");
  expect(screen.getByRole("textbox", { name: "SKU Style" })).toHaveValue("TEE");
  expect(screen.getByRole("textbox", { name: "SKU Size" })).toHaveValue("XL");

  const formElement = container.querySelector("form")!;
  const data = new FormData(formElement);
  for (const name of ["email", "url", "resourceName", "customerReference", "sku"] as const) {
    expect(data.getAll(name)).toEqual([exampleData.composed[name]]);
    expect(formElement.querySelectorAll(`input[name="${name}"]`)).toHaveLength(1);
  }
  for (const editor of screen.getAllByRole("textbox")) {
    if (editor.getAttribute("name") !== "plainSlug") expect(editor).not.toHaveAttribute("name");
  }
  const emailGroup = screen.getByRole("group", { name: "Company email" });
  expect(emailGroup.firstElementChild).toBe(screen.getByRole("textbox", { name: "Company email" }));
  expect(emailGroup.querySelector('[data-align="inline-end"]')).toHaveTextContent("@company.com");
  const urlGroup = screen.getByRole("group", { name: "Public URL" });
  expect(urlGroup.firstElementChild).toBe(screen.getByRole("textbox", { name: "Public URL" }));
  expect(urlGroup.querySelector('[data-align="inline-start"]')).toHaveTextContent("https://example.com/");

  await user.click(screen.getByRole("button", { name: "Save values" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]![0]).toEqual(exampleData.composed);
});

it("updates readonly field and context bindings while preserving user-authored parts", async () => {
  const user = userEvent.setup();
  const submit = vi.fn();
  const { container } = render(<ComposedValuesForm onSave={submit} />);
  await user.click(screen.getByRole("button", { name: "Load sample" }));
  const resource = screen.getByRole("textbox", { name: "Resource name" });
  await user.clear(resource);
  await user.type(resource, "billing-api");
  await user.click(screen.getByRole("combobox", { name: "Region" }));
  await user.click(await screen.findByRole("option", { name: "New Zealand North" }));
  await user.click(screen.getByRole("button", { name: "Switch organization (acme)" }));
  expect(resource).toHaveValue("billing-api");
  await waitFor(() => expect(container.querySelector('input[name="resourceName"]')).toHaveValue("globex-prd-billing-api-nzn1"));
  expect(container.querySelector('input[name="customerReference"]')).toHaveValue("CUS-NZ-0042");
  const resourceGroup = screen.getByRole("group", { name: "Resource name" });
  expect(resourceGroup.querySelector('[data-formulate-segment="context"]')).toHaveTextContent("globex");
  expect(resourceGroup.querySelectorAll("input")).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "Save values" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]![0]).toEqual({ ...exampleData.composed, region: "nzn1", resourceName: "globex-prd-billing-api-nzn1", customerReference: "CUS-NZ-0042" });
  await user.click(screen.getByRole("button", { name: "Load sample" }));
  expect(screen.getByRole("button", { name: "Switch organization (globex)" })).toBeInTheDocument();
  expect(resource).toHaveValue("payments");
  expect(container.querySelector('input[name="resourceName"]')).toHaveValue("globex-prd-payments-aue1");
});

it("treats movement between editors as one field, validates the complete value and focuses the first part", async () => {
  let form!: ReturnType<typeof ComposedValues.useForm>;
  const user = userEvent.setup();
  const submit = vi.fn();
  function Example() {
    form = ComposedValues.useForm({ defaultValues: exampleData.composed, compositionContext: { organization: { slug: "acme" } } });
    return <ComposedValues.Form form={form} onSubmit={submit}>
      <ComposedValues.Field name="sku" />
      <FormSubmitButton>Save</FormSubmitButton>
    </ComposedValues.Form>;
  }
  render(<Example />);
  const style = screen.getByRole("textbox", { name: "SKU Style" });
  const size = screen.getByRole("textbox", { name: "SKU Size" });
  await user.click(style);
  await user.clear(style);
  await user.type(style, "tee");
  await user.tab();
  expect(size).toHaveFocus();
  expect(form.getFieldState("sku").isTouched).toBe(false);
  expect(style).not.toHaveAttribute("aria-invalid");
  await user.tab();
  await waitFor(() => expect(style).toHaveAttribute("aria-invalid", "true"));
  expect(size).toHaveAttribute("aria-invalid", "true");
  expect(size).toHaveAccessibleDescription(/Enter an uppercase style/);
  expect(form.getFieldState("sku").isTouched).toBe(true);
  expect(form.getValues("sku")).toBe("SKU-tee-XL");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(style).toHaveFocus());
  expect(submit).not.toHaveBeenCalled();
  await user.clear(style);
  await user.type(style, "HOODIE");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]![0].sku).toBe("SKU-HOODIE-XL");
  await act(async () => form.reset({ ...exampleData.composed, sku: "SKU-CAP-S" }));
  expect(style).toHaveValue("CAP");
  expect(size).toHaveValue("S");
  // A temporary invalid delimiter belongs to the editor where it was typed;
  // decoding persisted values must not move it into another editable fragment.
  await user.clear(style);
  await user.type(style, "TEE-X");
  expect(style).toHaveValue("TEE-X");
  expect(size).toHaveValue("S");
  expect(form.getValues("sku")).toBe("SKU-TEE-X-S");
});

it("disables every editable part and the canonical native input without losing the value", async () => {
  let setDisabled!: (disabled: boolean) => void;
  let form!: ReturnType<typeof ComposedValues.useForm>;
  const user = userEvent.setup();
  const { container } = render(<Example />);
  function Example() {
    const [disabled, updateDisabled] = useState(false);
    setDisabled = updateDisabled;
    form = ComposedValues.useForm({ disabled, defaultValues: exampleData.composed, compositionContext: { organization: { slug: "acme" } } });
    return <ComposedValues.Form form={form} onSubmit={() => {}}>
      <ComposedValues.Field name="email" /><ComposedValues.Field name="sku" />
    </ComposedValues.Form>;
  }
  await act(async () => setDisabled(true));
  for (const editor of screen.getAllByRole("textbox")) expect(editor).toBeDisabled();
  expect(container.querySelector('input[name="email"]')).toBeDisabled();
  expect(container.querySelector('input[name="sku"]')).toBeDisabled();
  expect(new FormData(container.querySelector("form")!).getAll("sku")).toEqual([]);
  await user.type(screen.getByRole("textbox", { name: "SKU Style" }), "NO");
  expect(form.getValues("sku")).toBe("SKU-TEE-XL");
  await act(async () => setDisabled(false));
  expect(screen.getByRole("textbox", { name: "SKU Style" })).toHaveValue("TEE");
});

it("provides a focusable readonly generated value when there are no editable segments", async () => {
  const Generated = defineForm({
    reference: { schema: z.string().min(1), defaultValue: "", label: "Generated reference", component: "composedInput",
      composition: { segments: [{ literal: "CUS-" }, { context: "sequence" }] } },
  });
  let setDisabled!: (disabled: boolean) => void;
  let form!: ReturnType<typeof Generated.useForm>;
  function Example() {
    const [disabled, updateDisabled] = useState(false);
    setDisabled = updateDisabled;
    form = Generated.useForm({ disabled, compositionContext: { sequence: "0042" } });
    return <Generated.Form form={form} onSubmit={() => {}}><Generated.Fields /></Generated.Form>;
  }
  const { container } = render(<Example />);
  const value = screen.getByRole("textbox", { name: "Generated reference" });
  expect(value).toHaveAttribute("aria-readonly", "true");
  expect(value).toHaveAttribute("tabindex", "0");
  expect(value).toHaveTextContent("CUS-0042");
  act(() => form.setFocus("reference"));
  await waitFor(() => expect(value).toHaveFocus());
  expect(new FormData(container.querySelector("form")!).get("reference")).toBe("CUS-0042");
  await act(async () => setDisabled(true));
  expect(value).toHaveAttribute("aria-disabled", "true");
  expect(value).not.toHaveAttribute("tabindex");
});
