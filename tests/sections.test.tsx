import { StrictMode, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defineForm, defineSection, Form, useFormulate } from "@formulate/react";
import { z } from "zod";

const Contact = defineSection({
  email: { schema: z.email(), defaultValue: "", label: "Contact email", component: "input" },
}, { title: "Contact" });
const Details = defineSection({
  contact: Contact,
  reference: { schema: z.string().trim().min(1), defaultValue: " default ", label: "Reference", component: "input" },
}, { title: "Details" });
const Registration = defineForm({ first: Details, second: Details });

function NestedForm({ onSubmit }: { onSubmit: (values: z.output<typeof Registration.schema>) => void }) {
  const form = Registration.useForm();
  const [showFirst, setShowFirst] = useState(true);
  return <Form form={form} onSubmit={onSubmit}>
    <button type="button" onClick={() => setShowFirst(!showFirst)}>Toggle first</button>
    {showFirst ? <Registration.Section name="first"><Details.Subsection name="contact" /><Details.Field name="reference" /></Registration.Section> : null}
    <Registration.Section name="second" />
    <button type="submit">Save</button>
  </Form>;
}

describe("recursive section definitions", () => {
  it("binds nested uses independently, retains hidden edits and rules, and parses without overwriting values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = render(<StrictMode><NestedForm onSubmit={onSubmit} /></StrictMode>);
    const [first, second] = screen.getAllByLabelText("Contact email");
    expect(first!.id).not.toBe(second!.id);
    await user.type(first!, "bad-address");
    await user.type(second!, "second@example.com");
    const [reference] = screen.getAllByLabelText("Reference");
    await user.clear(reference!);
    await user.type(reference!, " retained ");
    view.rerender(<StrictMode><NestedForm onSubmit={onSubmit} /></StrictMode>);
    expect(screen.getAllByLabelText("Reference")[0]).toBe(reference);
    await user.click(screen.getByRole("button", { name: "Toggle first" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Toggle first" }));
    const restored = screen.getAllByLabelText("Contact email")[0]!;
    await waitFor(() => expect(restored).toHaveAttribute("aria-invalid", "true"));
    await user.clear(restored);
    await user.type(restored, "first@example.com");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toEqual({
      first: { contact: { email: "first@example.com" }, reference: "retained" },
      second: { contact: { email: "second@example.com" }, reference: "default" },
    });
    expect(screen.getAllByLabelText("Reference")[0]).toHaveValue(" retained ");
    expect(Registration.fieldNames).toEqual(["first.contact.email", "first.reference", "second.contact.email", "second.reference"]);
    expect(Details.Subsection).toBe(Details.Section);
  });

  it("routes explicit member maps through nested sections without extra value owners", async () => {
    const onSubmit = vi.fn();
    function Mapped() {
      const form = useFormulate(z.object({ person: Contact.schema, code: z.string() }), {
        defaultValues: { person: { email: "mapped@example.com" }, code: "local code" },
      });
      return <Form form={form} onSubmit={onSubmit}>
        <Details.Bind control={form.control} bindings={{ contact: "person", reference: "code" }} />
        <button type="submit">Save</button>
      </Form>;
    }
    render(<Mapped />);
    expect(screen.getByLabelText("Contact email")).toHaveValue("mapped@example.com");
    fireEvent.submit(screen.getByRole("button", { name: "Save" }).closest("form")!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toEqual({ person: { email: "mapped@example.com" }, code: "local code" });
  });

  it("keeps separate form runtimes independent and reports a missing matching section use", async () => {
    const user = userEvent.setup();
    render(<><NestedForm onSubmit={vi.fn()} /><NestedForm onSubmit={vi.fn()} /></>);
    const inputs = screen.getAllByLabelText("Contact email");
    await user.type(inputs[0]!, "first@example.com");
    expect(inputs[2]).toHaveValue("");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(() => render(<Contact.Field name="email" />)).toThrow("matching Section or Bind use");
    } finally { consoleError.mockRestore(); }
  });
});
