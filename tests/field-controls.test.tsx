import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { createFormulate, defaultComponents, defineFieldControl, Form, useFieldControl, useFormulate } from "@formulate/react";

const LocalInput = defineFieldControl<string>()(function LocalInput({ prefix }: { prefix: string }) {
  const field = useFieldControl<string>();
  return <div><span>{prefix}</span><input {...field} onChange={(event) => field.onChange(event.target.value)} /></div>;
});

const { Field } = createFormulate({ components: { ...defaultComponents, input: LocalInput } });

it("shares custom controls between the map and child composition without losing binding, blur, or focus", async () => {
  const onSubmit = vi.fn();
  const schema = z.object({ first: z.string().min(1, "Enter the first value."), second: z.string().min(1) });
  function Example() {
    const form = useFormulate(schema, { defaultValues: { first: "", second: "" } });
    return <Form form={form} onSubmit={onSubmit}>
      <Field control={form.control} name="first" label="First" description="Custom mapped input."
        component="input" componentProps={{ prefix: "Mapped" }} />
      <Field control={form.control} name="second" label="Second"><div><LocalInput prefix="Composed" /></div></Field>
      <button type="submit">Send</button>
    </Form>;
  }
  const user = userEvent.setup();
  render(<Example />);
  const first = screen.getByLabelText("First");
  await user.click(first);
  await user.tab();
  await waitFor(() => expect(first).toHaveAccessibleDescription("Custom mapped input. Enter the first value."));
  await user.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(first).toHaveFocus());
  expect(screen.getByText("Mapped")).toBeInTheDocument();
  expect(screen.getByText("Composed")).toBeInTheDocument();
  await user.type(first, "one");
  await user.type(screen.getByLabelText("Second"), "two");
  await user.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]?.[0]).toEqual({ first: "one", second: "two" });
});
