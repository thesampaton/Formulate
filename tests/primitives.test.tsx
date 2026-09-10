import { useEffect, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { Field, Form, Page, Section, useFormulate } from "@formulate/react";

it("keeps schema validation alive on a hidden page and parses without rewriting editing values", async () => {
  const onSubmit = vi.fn();
  const schema = z.object({ contact: z.object({ email: z.email().transform((value) => value.toLowerCase()) }) });
  function Example() {
    const form = useFormulate(schema, { defaultValues: { contact: { email: "" } } });
    const [editing, setEditing] = useState(true);
    return <Form form={form} onSubmit={onSubmit} onInvalid={() => setEditing(true)}>
      <Page id="details" title="Details" active={editing}>
        <Section title="Contact"><Section title="Email details">
          <Field control={form.control} name="contact.email" label="Contact email" component="input" />
        </Section></Section>
      </Page>
      <button type="button" onClick={() => setEditing(!editing)}>Toggle editor</button>
      <button type="submit">Submit</button>
    </Form>;
  }
  const user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "Toggle editor" }));
  await user.click(screen.getByRole("button", { name: "Submit" }));
  expect(await screen.findByLabelText("Contact email")).toHaveAttribute("aria-invalid", "true");
  expect(onSubmit).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText("Contact email"), "Person@Example.com");
  await user.click(screen.getByRole("button", { name: "Toggle editor" }));
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]?.[0]).toEqual({ contact: { email: "person@example.com" } });
  await user.click(screen.getByRole("button", { name: "Toggle editor" }));
  expect(screen.getByLabelText("Contact email")).toHaveValue("Person@Example.com");
});

it("preserves a page's React and DOM state while pausing its effects", async () => {
  const connect = vi.fn();
  const disconnect = vi.fn();
  function Editor() {
    const [expanded, setExpanded] = useState(false);
    useEffect(() => { connect(); return disconnect; }, []);
    return <>
      <button onClick={() => setExpanded(!expanded)}>Expand details</button>
      {expanded ? <input aria-label="Local draft" defaultValue="" /> : null}
    </>;
  }
  function Example() {
    const [active, setActive] = useState(true);
    return <>
      <button onClick={() => setActive(!active)}>Switch page</button>
      <Page id="editor" title="Editor" active={active}><Editor /></Page>
    </>;
  }
  const user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "Expand details" }));
  const draft = screen.getByLabelText("Local draft");
  await user.type(draft, "Keep this draft");
  await user.click(screen.getByRole("button", { name: "Switch page" }));
  expect(draft).not.toBeVisible();
  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(connect).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Switch page" }));
  expect(screen.getByLabelText("Local draft")).toBe(draft);
  expect(draft).toBeVisible();
  expect(draft).toHaveValue("Keep this draft");
  expect(connect).toHaveBeenCalledTimes(2);
});

it("retains uncontrolled RHF inputs through scoped Actions and final success", async () => {
  const schema = z.object({ value: z.string().min(1) });
  const save = vi.fn();
  function Example() {
    const form = useFormulate(schema, { defaultValues: { value: "" } });
    const [review, setReview] = useState(false);
    return <Form form={form} onSubmit={save} navigation={review ? undefined : {
      id: "edit", fields: ["value"], onValid: () => setReview(true),
    }}>
      <Page id="edit" title="Edit" active={!review}>
        <input aria-label="Uncontrolled value" {...form.register("value")} />
      </Page>
      <button type="submit">{review ? "Save" : "Continue"}</button>
    </Form>;
  }
  const user = userEvent.setup();
  render(<Example />);
  const input = screen.getByLabelText("Uncontrolled value");
  await user.type(input, "Retained");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(input).not.toBeVisible();
  expect(input).toHaveValue("Retained");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith({ value: "Retained" }, expect.anything()));
  expect(input).toHaveValue("Retained");
});
