import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { expect, it } from "vitest";
import { z } from "zod";
import { createFormulate, defaultComponents, defineFieldControl, Field, Form, useComposedFieldBinding } from "@formulate/react";

const SegmentEditor = defineFieldControl<string>()(function SegmentEditor() {
  const field = useComposedFieldBinding();
  const inputIndex = field.segments.findIndex((segment) => segment.kind === "input");
  return <input id={field.id} ref={field.ref} disabled={field.disabled} onBlur={field.onBlur}
    value={field.segments[inputIndex]?.value ?? ""}
    onChange={(event) => field.onInputChange(inputIndex, event.target.value)} />;
});
const { defineForm } = createFormulate({ components: { ...defaultComponents, segments: SegmentEditor } });
const Reference = defineForm({
  region: { schema: z.string(), defaultValue: "AU", label: "Region", component: "input" },
  reference: { schema: z.string(), defaultValue: "AU-0042", label: "Reference", component: "segments",
    composition: { segments: [{ binding: "region" }, { literal: "-" }, { input: true }] } },
});

it("connects a plain RHF field without exposing context metadata to its native input", async () => {
  let form!: UseFormReturn<{ title: string }>;
  function Example() {
    form = useForm({ defaultValues: { title: "Example" } });
    return <Field name="title" control={form.control} label="Title" component="input" />;
  }
  const { container } = render(<Example />);
  const input = screen.getByRole("textbox", { name: "Title" });
  expect(input).toHaveValue("Example");
  expect(input).toHaveAttribute("name", "title");
  expect(container.querySelector("[binding], [control], [composition]")).toBeNull();
  await userEvent.setup().type(input, " updated");
  expect(form.getValues("title")).toBe("Example updated");
});

it("uses an explicit composition runtime outside a Form provider", async () => {
  let form!: ReturnType<typeof Reference.useForm>;
  function Example() {
    form = Reference.useForm();
    return <Reference.Field name="reference" control={form.control} />;
  }
  render(<Example />);
  const input = screen.getByRole("textbox", { name: "Reference" });
  expect(input).toHaveValue("0042");
  const user = userEvent.setup();
  await user.clear(input);
  await user.type(input, "1234");
  expect(form.getValues("reference")).toBe("AU-1234");
  await act(async () => form.setValue("region", "NZ"));
  expect(form.getValues("reference")).toBe("NZ-1234");
  expect(input).toHaveValue("1234");
});

it("does not inherit an enclosing composition runtime for an explicit plain RHF owner", () => {
  function Example() {
    const outer = Reference.useForm();
    const plain = useForm({ defaultValues: { region: "NZ", reference: "NZ-5678" } });
    return <Form form={outer} onSubmit={() => {}}>
      <Reference.Field name="reference" control={plain.control} />
    </Form>;
  }
  expect(() => render(<Example />)).toThrow('Field "reference" needs a Formulate composition runtime.');
});
