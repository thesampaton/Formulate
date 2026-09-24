import { StrictMode, useState } from "react";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { createFormulate, defaultComponents, defineFieldControl, Form, useComposedFieldBinding, useFormulate } from "@formulate/react";
import type { BoundStringComposition, StringComposition } from "@formulate/react";
import { createStringComposer } from "../packages/react/src/fields/string-composition";

// Exercise the core contract independently of any installed presentation library.
const SegmentEditor = defineFieldControl<string>()(function SegmentEditor() {
  const field = useComposedFieldBinding();
  let inputIndex = 0;
  return <div>
    {field.segments.map((segment, index) => segment.kind === "input"
      ? <input key={index} id={inputIndex++ === 0 ? field.id : undefined} ref={index === field.segments.findIndex((item) => item.kind === "input") ? field.ref : undefined}
          aria-label={segment.label} disabled={field.disabled} value={segment.value} onBlur={field.onBlur}
          aria-invalid={field["aria-invalid"]} aria-describedby={field["aria-describedby"]}
          onChange={(event) => field.onInputChange(index, event.target.value)} />
      : <span key={index}>{segment.value}</span>)}
  </div>;
});
const { defineForm, defineSection } = createFormulate({ components: { ...defaultComponents, segments: SegmentEditor } });

const Reference = defineForm({
  region: { schema: z.string(), defaultValue: "AU", label: "Region", component: "input" },
  reference: { schema: z.string().regex(/^CUS-[A-Z]{2}-\d{4}$/, "Use a four digit sequence").transform((value) => value.toLowerCase()),
    defaultValue: "", label: "Reference", component: "segments",
    composition: { segments: [{ literal: "CUS-" }, { binding: "region" }, { literal: "-" }, { input: true }] } },
});

it("keeps one canonical editing value and validates and parses that complete scalar", async () => {
  const submit = vi.fn();
  let form!: ReturnType<typeof Reference.useForm>;
  function Example() {
    form = Reference.useForm();
    void form.formState.isDirty;
    return <Form form={form} onSubmit={submit}><Reference.Fields /><button type="submit">Save</button></Form>;
  }
  const user = userEvent.setup();
  render(<StrictMode><Example /></StrictMode>);
  expect(form.getValues()).toEqual({ region: "AU", reference: "CUS-AU-" });
  expect(form.formState.isDirty).toBe(false);
  expect(Reference.defaultValues).toEqual({ region: "AU", reference: "" });
  const reference = screen.getByLabelText("Reference");
  await user.type(reference, "12");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(submit).not.toHaveBeenCalled();
  expect(reference).toHaveAttribute("aria-invalid", "true");
  expect(form.getValues()).toEqual({ region: "AU", reference: "CUS-AU-12" });
  await user.type(reference, "34");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]![0]).toEqual({ region: "AU", reference: "cus-au-1234" });
  expect(form.getValues("reference")).toBe("CUS-AU-1234");
  expect(reference).toHaveValue("1234");
});

it("updates chains in dependency order without mounting editors and validates the new final values", async () => {
  const Chained = defineForm({
    url: { schema: z.string().regex(/^https:\/\/example.com\/NZ-\d{4}$/), defaultValue: "", label: "URL", component: "segments",
      composition: { segments: [{ literal: "https://example.com/" }, { binding: "reference" }] } },
    reference: { schema: z.string(), defaultValue: "AU-0042", label: "Reference", component: "segments",
      composition: { segments: [{ binding: "region" }, { literal: "-" }, { input: true }] } },
    region: { schema: z.string(), defaultValue: "AU", label: "Region", component: "input" },
  });
  const { result } = renderHook(() => Chained.useForm());
  expect(result.current.getValues("url")).toBe("https://example.com/AU-0042");
  await act(async () => { expect(await result.current.trigger("url")).toBe(false); });
  await act(async () => {
    result.current.setValue("region", "NZ");
    expect(result.current.getValues("reference")).toBe("NZ-0042");
    expect(result.current.getValues("url")).toBe("https://example.com/NZ-0042");
    // Validation can occur in the same turn, before subscription microtasks.
    expect(await result.current.trigger()).toBe(true);
  });
  expect(result.current.getValues()).toEqual({ region: "NZ", reference: "NZ-0042", url: "https://example.com/NZ-0042" });
  expect(result.current.getFieldState("url").error).toBeUndefined();
});

it("refreshes composed errors when a validated programmatic source write already ran the resolver", async () => {
  const { result } = renderHook(() => Reference.useForm({ defaultValues: { reference: "CUS-AU-0042" } }));
  await act(async () => result.current.setValue("region", "bad", { shouldValidate: true }));
  await waitFor(() => expect(result.current.getFieldState("reference").error).toBeDefined());
  expect(result.current.getValues("reference")).toBe("CUS-bad-0042");
  await act(async () => result.current.setValues({ region: "NZ" }, { shouldValidate: true }));
  await waitFor(() => expect(result.current.getFieldState("reference").error).toBeUndefined());
  expect(result.current.getValues("reference")).toBe("CUS-NZ-0042");
});

it("recomputes hidden fields and restores the same authored fragment when their editor remounts", async () => {
  let form!: ReturnType<typeof Reference.useForm>;
  function Example() {
    form = Reference.useForm({ defaultValues: { reference: "CUS-AU-1234" } });
    const [shown, show] = useState(true);
    return <Form form={form} onSubmit={() => {}}>
      <Reference.Field name="region" />{shown && <Reference.Field name="reference" />}
      <button type="button" onClick={() => show(!shown)}>Toggle reference</button>
    </Form>;
  }
  const user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "Toggle reference" }));
  await act(async () => form.setValue("region", "NZ"));
  expect(form.getValues("reference")).toBe("CUS-NZ-1234");
  await user.click(screen.getByRole("button", { name: "Toggle reference" }));
  expect(screen.getByLabelText("Reference")).toHaveValue("1234");
});

it("treats reset, replacement defaults, and programmatic scalar writes as authoritative", async () => {
  const { result } = renderHook(() => {
    const form = Reference.useForm({ defaultValues: { reference: "CUS-AU-1234" } });
    void form.formState.isDirty;
    return form;
  });
  await act(async () => result.current.setValue("region", "NZ", { shouldDirty: true }));
  expect(result.current.getValues("reference")).toBe("CUS-NZ-1234");
  expect(result.current.formState.isDirty).toBe(true);
  await act(async () => result.current.reset());
  expect(result.current.getValues()).toEqual({ region: "AU", reference: "CUS-AU-1234" });
  expect(result.current.formState.isDirty).toBe(false);
  await act(async () => result.current.reset({ region: "US", reference: "CUS-US-9876" }));
  expect(result.current.getValues()).toEqual({ region: "US", reference: "CUS-US-9876" });
  expect(result.current.formState.isDirty).toBe(false);
  await act(async () => result.current.setValue("reference", "CUS-US-5555", { shouldDirty: true }));
  await act(async () => result.current.setValue("region", "GB"));
  expect(result.current.getValues("reference")).toBe("CUS-GB-5555");
  await act(async () => result.current.reset());
  expect(result.current.getValues()).toEqual({ region: "US", reference: "CUS-US-9876" });
});

it("preserves authored text through batch source updates and accepts replacement canonical values", async () => {
  const { result } = renderHook(() => Reference.useForm({ defaultValues: { reference: "CUS-AU-1234" } }));
  await act(async () => {
    result.current.setValues({ region: "NZ" });
    expect(result.current.getValues("reference")).toBe("CUS-NZ-1234");
  });
  expect(result.current.getValues()).toEqual({ region: "NZ", reference: "CUS-NZ-1234" });
  await act(async () => result.current.setValues({ region: "US", reference: "CUS-US-9999" }));
  expect(result.current.getValues()).toEqual({ region: "US", reference: "CUS-US-9999" });
  await act(async () => result.current.setValues({ region: "GB" }));
  expect(result.current.getValues("reference")).toBe("CUS-GB-9999");
});

it("normalizes reset seeds into a clean canonical baseline that can be restored after editing", async () => {
  let form!: ReturnType<typeof Reference.useForm>;
  function Example() {
    form = Reference.useForm();
    void form.formState.isDirty;
    return <Form form={form} onSubmit={() => {}}><Reference.Field name="reference" /></Form>;
  }
  const user = userEvent.setup();
  render(<Example />);
  await act(async () => form.reset({ region: "NZ", reference: "" }));
  expect(form.getValues("reference")).toBe("CUS-NZ-");
  expect(form.formState.isDirty).toBe(false);
  await user.type(screen.getByLabelText("Reference"), "1234");
  expect(form.formState.isDirty).toBe(true);
  await user.clear(screen.getByLabelText("Reference"));
  expect(form.formState.isDirty).toBe(false);
});

it("uses a replacement reset baseline immediately within the same event", async () => {
  const { result } = renderHook(() => Reference.useForm({ defaultValues: { reference: "CUS-AU-0042" } }));
  await act(async () => {
    result.current.reset({ region: "NZ", reference: "CUS-NZ-0099" });
    result.current.reset();
  });
  expect(result.current.getValues()).toEqual({ region: "NZ", reference: "CUS-NZ-0099" });
});

it("replaces context affixes and transformed bindings while retaining authored text", async () => {
  const Resource = defineForm({
    region: { schema: z.string(), defaultValue: "Australia", label: "Region", component: "input" },
    name: { schema: z.string(), defaultValue: "acme-payments-aus", label: "Name", component: "segments",
      composition: { segments: [{ context: "organization.slug" }, { literal: "-" }, { input: true }, { literal: "-" },
        { binding: "region", transform: (value: unknown) => String(value).slice(0, 3).toLowerCase() }] } },
  });
  const { result, rerender } = renderHook(({ organization }) => Resource.useForm({ compositionContext: { organization } }), {
    initialProps: { organization: { slug: "acme" } },
  });
  await act(async () => result.current.setValue("region", "Britain"));
  rerender({ organization: { slug: "globex" } });
  expect(result.current.getValues()).toEqual({ region: "Britain", name: "globex-payments-bri" });
  await act(async () => result.current.reset({ region: "Canada", name: "globex-billing-can" }));
  rerender({ organization: { slug: "initech" } });
  expect(result.current.getValues("name")).toBe("initech-billing-can");
});

it("resets original and replacement baselines correctly after external context changes", async () => {
  const Email = defineForm({
    email: { schema: z.string(), defaultValue: "sam@acme.com", label: "Email", component: "segments",
      composition: { segments: [{ input: true }, { literal: "@" }, { context: "domain" }] } },
  });
  const { result, rerender } = renderHook(({ domain }) => {
    const form = Email.useForm({ compositionContext: { domain } });
    void form.formState.isDirty;
    return form;
  }, { initialProps: { domain: "acme.com" } });
  await act(async () => result.current.setValue("email", "edited@acme.com", { shouldDirty: true }));
  rerender({ domain: "globex.com" });
  await act(async () => result.current.reset());
  expect(result.current.getValues("email")).toBe("sam@globex.com");
  expect(result.current.formState.isDirty).toBe(false);
  await act(async () => result.current.reset({ email: "alex@globex.com" }));
  rerender({ domain: "initech.com" });
  await act(async () => result.current.reset());
  expect(result.current.getValues("email")).toBe("alex@initech.com");
  expect(result.current.formState.isDirty).toBe(false);
  await act(async () => result.current.setValue("email", "other@initech.com", { shouldDirty: true }));
  rerender({ domain: "example.com" });
  await act(async () => result.current.reset());
  expect(result.current.getValues("email")).toBe("alex@example.com");
  expect(result.current.formState.isDirty).toBe(false);
});

it("composes asynchronously loaded defaults before establishing the reset baseline", async () => {
  let resolve!: (values: { region: string; reference: string }) => void;
  const defaults = new Promise<{ region: string; reference: string }>((done) => { resolve = done; });
  const { result } = renderHook(() => {
    const form = Reference.useForm({ defaultValues: () => defaults });
    void form.formState.isLoading;
    void form.formState.isDirty;
    return form;
  });
  expect(result.current.formState.isLoading).toBe(true);
  await act(async () => resolve({ region: "NZ", reference: "CUS-NZ-0042" }));
  await waitFor(() => expect(result.current.formState.isLoading).toBe(false));
  expect(result.current.getValues()).toEqual({ region: "NZ", reference: "CUS-NZ-0042" });
  expect(result.current.formState.isDirty).toBe(false);
  await act(async () => result.current.setValue("region", "AU"));
  expect(result.current.getValues("reference")).toBe("CUS-AU-0042");
  await act(async () => result.current.reset());
  expect(result.current.getValues()).toEqual({ region: "NZ", reference: "CUS-NZ-0042" });
});

it("normalizes reactive values before RHF records its replacement baseline", async () => {
  const { result, rerender } = renderHook(({ values }) => {
    const form = Reference.useForm({ values });
    void form.formState.isDirty;
    return form;
  }, { initialProps: { values: { region: "AU", reference: "" } } });
  expect(result.current.getValues()).toEqual({ region: "AU", reference: "CUS-AU-" });
  expect(result.current.formState.isDirty).toBe(false);
  rerender({ values: { region: "NZ", reference: "CUS-NZ-0042" } });
  await waitFor(() => expect(result.current.getValues("reference")).toBe("CUS-NZ-0042"));
  await act(async () => result.current.setValue("reference", "CUS-NZ-1234", { shouldDirty: true }));
  expect(result.current.formState.isDirty).toBe(true);
  await act(async () => result.current.reset());
  expect(result.current.getValues()).toEqual({ region: "NZ", reference: "CUS-NZ-0042" });
  expect(result.current.formState.isDirty).toBe(false);
});

it("remaps both composition targets and sources for nested and explicitly bound sections", async () => {
  const Naming = defineSection({
    region: { schema: z.string(), defaultValue: "AU", label: "Region", component: "input" },
    reference: { schema: z.string(), defaultValue: "AU-42", label: "Reference", component: "segments",
      composition: { segments: [{ binding: "region" }, { literal: "-" }, { input: true }] } },
  });
  const Group = defineSection({ naming: Naming });
  const Host = defineForm({ first: Group, second: Group });
  const nested = renderHook(() => Host.useForm());
  await act(async () => nested.result.current.setValue("first.naming.region", "NZ"));
  expect(nested.result.current.getValues()).toEqual({
    first: { naming: { region: "NZ", reference: "NZ-42" } }, second: { naming: { region: "AU", reference: "AU-42" } },
  });
  expect(Host.bindSection("first").compositions[0]).toMatchObject({
    name: "first.naming.reference", composition: { segments: [{ binding: "first.naming.region" }, { literal: "-" }, { input: true }] },
  });
  expect(Host.defaultValues.first.naming.reference).toBe("AU-42");
  const schema = z.object({ location: z.string(), externalId: z.string() });
  const binding = Naming.bind<z.input<typeof schema>>({ id: "named", bindings: { region: "location", reference: "externalId" } });
  const definition = { schema, defaultValues: { location: "US", externalId: "US-0042" }, compositions: binding.compositions };
  const mapped = renderHook(() => useFormulate(definition));
  await act(async () => mapped.result.current.setValue("location", "GB"));
  expect(mapped.result.current.getValues()).toEqual({ location: "GB", externalId: "GB-0042" });
});

it("uses the explicit control's runtime and prevents disabled editor writes", async () => {
  let first!: ReturnType<typeof Reference.useForm>;
  let second!: ReturnType<typeof Reference.useForm>;
  function Example() {
    first = Reference.useForm({ defaultValues: { reference: "CUS-AU-1234" } });
    second = Reference.useForm({ disabled: true, defaultValues: { region: "NZ", reference: "CUS-NZ-5678" } });
    return <Form form={first} onSubmit={() => {}}>
      <Reference.Field name="reference" label="First" />
      <Reference.Field name="reference" control={second.control} label="Second" />
    </Form>;
  }
  render(<Example />);
  expect(screen.getByLabelText("First")).toHaveValue("1234");
  expect(screen.getByLabelText("Second")).toHaveValue("5678");
  fireEvent.change(screen.getByLabelText("Second"), { target: { value: "9999" } });
  expect(second.getValues("reference")).toBe("CUS-NZ-5678");
  expect(first.getValues("reference")).toBe("CUS-AU-1234");
});

it("preserves multiple authored segments through an explicit inverse parser", async () => {
  const Sku = defineForm({
    region: { schema: z.string(), defaultValue: "AU", label: "Region", component: "input" },
    sku: { schema: z.string(), defaultValue: "AU-TEE-XL", label: "SKU", component: "segments",
      composition: { segments: [{ binding: "region" }, { literal: "-" }, { input: true, label: "Style" }, { literal: "-" }, { input: true, label: "Size" }],
        parse: (value: string) => value.split("-").slice(1) } },
  });
  let form!: ReturnType<typeof Sku.useForm>;
  function Example() {
    form = Sku.useForm();
    return <Form form={form} onSubmit={() => {}}><Sku.Field name="sku" /></Form>;
  }
  render(<Example />);
  fireEvent.change(screen.getByLabelText("Style"), { target: { value: "CAP" } });
  await act(async () => form.setValue("region", "NZ"));
  expect(form.getValues("sku")).toBe("NZ-CAP-XL");
  expect(screen.getByLabelText("Style")).toHaveValue("CAP");
  expect(screen.getByLabelText("Size")).toHaveValue("XL");
  await act(async () => form.reset({ region: "US", sku: "US-SHIRT-M" }));
  expect(screen.getByLabelText("Style")).toHaveValue("SHIRT");
  expect(screen.getByLabelText("Size")).toHaveValue("M");
});

it("rejects feedback loops, duplicate targets, and ambiguous or invalid parsers", () => {
  const schema = z.object({ first: z.string(), second: z.string() });
  const defaultValues = { first: "a", second: "b" };
  const check = (compositions: readonly BoundStringComposition[]) => renderHook(() => useFormulate({ schema, defaultValues, compositions }));
  expect(() => check([
    { name: "first", composition: { segments: [{ binding: "second" }] } },
    { name: "second", composition: { segments: [{ binding: "first" }] } },
  ])).toThrow("Cyclic composed value binding");
  expect(() => check([{ name: "first", composition: { segments: [{ binding: "first" }] } }])).toThrow("Cyclic composed value binding");
  expect(() => check([
    { name: "first", composition: { segments: [{ literal: "a" }] } },
    { name: "first", composition: { segments: [{ literal: "b" }] } },
  ])).toThrow("Duplicate composed field");
  expect(() => check([{ name: "first", composition: { segments: [{ input: true }, { input: true }] } }])).toThrow("multiple input segments require an explicit composition parser");
  expect(() => check([{ name: "first", composition: { segments: [{ input: true }, { input: true }], parse: () => ["one"] } }])).toThrow("one string per input segment");
  const invalidTransform = { segments: [{ binding: "second", transform: () => 42 }] } as unknown as StringComposition;
  expect(() => check([{ name: "first", composition: invalidTransform }])).toThrow("transform must return a string");
});


it("reads bracket indices and dotted context keys without a React path-reader dependency", () => {
  const composer = createStringComposer([{ name: "result", composition: { segments: [
    { binding: "regions[0].code" }, { literal: "-" },
    { context: "settings['deployment'].suffix" }, { literal: "-" }, { context: "literal.key" },
    { context: "__proto__.toString" },
  ] } }]);
  const values = { result: "", regions: [{ code: "AU" }] };
  expect(composer.compose(values, { settings: { deployment: { suffix: "prod" } }, "literal.key": "fallback" }).values.result).toBe("AU-prod-fallback");
  expect(composer.compose(values, { settings: { deployment: { suffix: "test" } }, literal: { key: "nested" }, "literal.key": "fallback" }).values.result).toBe("AU-test-nested");
});
