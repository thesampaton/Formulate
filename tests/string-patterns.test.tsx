import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { createFormulate, defaultComponents, defineField, defineForm, field } from "@formulate/react";
import { ComposedInputControl } from "../examples/react/src/components/formulate/composed-input-control";
import { customerReferenceSchema, skuSchema, slugSchema } from "../examples/react/src/declarations/string-patterns";

it("reuses regex literals, string patterns, and flags without changing accepted strings", () => {
  expect(slugSchema.parse("payments-api")).toBe("payments-api");
  for (const invalid of ["", "Payments", "-payments", "payments-", "payments--api", "payments api", "payments\n"]) {
    expect(slugSchema.safeParse(invalid).success).toBe(false);
  }
  expect(customerReferenceSchema.parse("CUS-AU-0042")).toBe("CUS-AU-0042");
  for (const invalid of ["0042", "CUS-au-0042", "CUS-AU-42", "prefix-CUS-AU-0042", "CUS-AU-0042-suffix"]) {
    expect(customerReferenceSchema.safeParse(invalid).success).toBe(false);
  }
  expect(skuSchema.parse("sku-aB12")).toBe("sku-aB12");
  expect(skuSchema.safeParse("SKU-ab-12").success).toBe(false);
});

it("applies reusable patterns through normal form validation while preserving invalid editing values", async () => {
  const Slug = defineField({
    primitive: "text", schema: slugSchema.max(20), defaultValue: "", label: "Slug", component: "input",
  });
  const Article = defineForm({ slug: field(Slug) });
  const onSubmit = vi.fn();
  let form!: ReturnType<typeof Article.useForm>;
  function Example() {
    form = Article.useForm();
    return <Article.Form form={form} onSubmit={onSubmit}>
      <Article.Fields />
      <button>Save</button>
    </Article.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  const input = screen.getByLabelText("Slug");
  await user.type(input, "Invalid slug");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Use lowercase letters or digits separated by single hyphens.")).toBeInTheDocument();
  expect(input).toHaveValue("Invalid slug");
  expect(form.getValues()).toEqual({ slug: "Invalid slug" });
  expect(onSubmit).not.toHaveBeenCalled();
  await user.clear(input);
  await user.type(input, "payments-api");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]![0]).toEqual({ slug: "payments-api" });
});

it("checks the final composed string, including changes to system-authored segments", async () => {
  const ui = createFormulate({ components: { ...defaultComponents, composedInput: ComposedInputControl } });
  const Customer = ui.defineForm({
    region: { schema: z.string(), defaultValue: "AU", label: "Region", component: "input" },
    reference: {
      schema: customerReferenceSchema, defaultValue: "CUS-AU-0042", label: "Reference", component: "composedInput",
      composition: { segments: [{ literal: "CUS-" }, { binding: "region" }, { literal: "-" }, { input: true }] },
    },
  });
  const onSubmit = vi.fn();
  let form!: ReturnType<typeof Customer.useForm>;
  function Example() {
    form = Customer.useForm();
    return <Customer.Form form={form} onSubmit={onSubmit}>
      <Customer.Fields />
      <button>Save</button>
    </Customer.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  const reference = screen.getByRole("textbox", { name: "Reference" });
  const region = screen.getByRole("textbox", { name: "Region" });
  expect(reference).toHaveValue("0042");
  await user.clear(region);
  await user.type(region, "au");
  await waitFor(() => expect(form.getValues("reference")).toBe("CUS-au-0042"));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Use CUS-, a two-letter region, and four digits (for example CUS-AU-0042).")).toBeInTheDocument();
  expect(reference).toHaveValue("0042");
  expect(onSubmit).not.toHaveBeenCalled();
  await user.clear(region);
  await user.type(region, "NZ");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]![0]).toEqual({ region: "NZ", reference: "CUS-NZ-0042" });
});
