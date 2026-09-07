import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { Field, Form, Page, Section, useFormulate } from "@formulate/react";

it("keeps schema validation alive on an unmounted page and parses without rewriting editing values", async () => {
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
