import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { defineForm, Field, Form, useFormulate } from "@formulate/react";

it("uses form context by default and lets a standalone field choose its runtime", async () => {
  const schema = z.object({ email: z.string() });
  const submitFirst = vi.fn();
  const submitSecond = vi.fn();
  function Example() {
    const first = useFormulate(schema, { defaultValues: { email: "first" } });
    const second = useFormulate(z.object({ email: z.string(), note: z.string() }), { defaultValues: { email: "second", note: "" } });
    return <>
      <Form form={first} onSubmit={submitFirst}>
        <Field name="email" label="Context field" component="input" />
        <Field control={second.control} name="note" label="Explicit override" component="input" />
        <button type="submit">Submit first</button>
      </Form>
      <Field control={second.control} name="email" label="Standalone field" component="input" />
      <Form form={second} onSubmit={submitSecond}><button type="submit">Submit second</button></Form>
    </>;
  }
  const user = userEvent.setup();
  render(<Example />);
  await user.type(screen.getByLabelText("Context field"), "-edit");
  await user.type(screen.getByLabelText("Standalone field"), "-edit");
  await user.type(screen.getByLabelText("Explicit override"), "belongs to second");
  await user.click(screen.getByRole("button", { name: "Submit first" }));
  await user.click(screen.getByRole("button", { name: "Submit second" }));
  expect(submitFirst.mock.calls[0]?.[0]).toEqual({ email: "first-edit" });
  expect(submitSecond.mock.calls[0]?.[0]).toEqual({ email: "second-edit", note: "belongs to second" });
});

it("derives editing defaults and parsed output from declarations while keeping controls stable across edits", async () => {
  const Contact = defineForm({
    email: {
      schema: z.email().transform((value) => value.toLowerCase()),
      defaultValue: "Person@Example.com",
      label: "Email",
      component: "input",
      componentProps: { type: "email", placeholder: "Your email" },
    },
    years: {
      schema: z.string().min(1).transform(Number).pipe(z.number().int().min(0)),
      defaultValue: "3",
      label: "Years",
      component: "input",
    },
  });
  const onSubmit = vi.fn();
  function Example() {
    const form = useFormulate(Contact);
    return <Form form={form} onSubmit={onSubmit}>
      <Contact.Field name="email" componentProps={{ className: "email-control" }} />
      <Contact.Field name="years" />
      <button type="submit">Save</button>
    </Form>;
  }
  const user = userEvent.setup();
  render(<Example />);
  const email = screen.getByLabelText("Email");
  expect(email).toHaveAttribute("type", "email");
  expect(email).toHaveAttribute("placeholder", "Your email");
  expect(email).toHaveClass("email-control");
  await user.type(email, ".au");
  expect(screen.getByLabelText("Email")).toBe(email);
  expect(email).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]?.[0]).toEqual({ email: "person@example.com.au", years: 3 });
  expect(email).toHaveValue("Person@Example.com.au");
  expect(screen.getByLabelText("Years")).toHaveValue("3");
});

it("requires context or an explicit control and rejects ambiguous definition keys", () => {
  expect(() => render(<Field name="email" label="Email" component="input" />)).toThrow("needs a parent Form or an explicit control");
  expect(() => defineForm({
    "contact.email": { schema: z.string(), defaultValue: "", label: "Email", component: "input" },
  })).toThrow("flat identifier keys");
});

it("prefills selected fields without losing declared defaults and keeps that baseline on reset", async () => {
  const Preferences = defineForm({
    email: { schema: z.string(), defaultValue: "default@example.com", label: "Email", component: "input" },
    enabled: { schema: z.boolean(), defaultValue: true, label: "Enabled", component: "checkbox" },
    retries: { schema: z.number(), defaultValue: 3, label: "Retries", component: "number" },
    timeout: { schema: z.number(), defaultValue: 30, label: "Timeout", component: "number" },
  });
  const onSubmit = vi.fn();
  function Example() {
    const form = Preferences.useForm({ defaultValues: { email: "", enabled: false, retries: 0 } });
    return <Form form={form} onSubmit={onSubmit}>
      <Preferences.Fields />
      <button type="button" onClick={() => form.reset()}>Reset</button>
      <button type="submit">Save</button>
    </Form>;
  }
  const user = userEvent.setup();
  const { rerender } = render(<Example />);
  expect(screen.getByLabelText("Email")).toHaveValue("");
  expect(screen.getByLabelText("Enabled")).not.toBeChecked();
  expect(screen.getByLabelText("Retries")).toHaveValue(0);
  expect(screen.getByLabelText("Timeout")).toHaveValue(30);
  await user.type(screen.getByLabelText("Email"), "edited@example.com");
  rerender(<Example />);
  expect(screen.getByLabelText("Email")).toHaveValue("edited@example.com");
  await user.click(screen.getByRole("button", { name: "Reset" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(onSubmit.mock.calls[0]?.[0]).toEqual({ email: "", enabled: false, retries: 0, timeout: 30 });
  expect(Preferences.defaultValues).toEqual({ email: "default@example.com", enabled: true, retries: 3, timeout: 30 });
});
