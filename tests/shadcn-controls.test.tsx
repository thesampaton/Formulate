import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { defineForm } from "../examples/react/src/lib/formulate-config";
import { SubmitButton } from "../examples/react/src/submit-button";

const Preferences = defineForm({
  country: {
    schema: z.string().min(1, "Choose a country."), defaultValue: "", label: "Country", component: "select",
    description: "Where you live.", componentProps: { placeholder: "Choose", options: [{ value: "AU", label: "Australia" }] },
  },
  enabled: { schema: z.boolean(), defaultValue: false, label: "Enabled", component: "checkbox", orientation: "horizontal" },
});

it("connects the installed Select trigger and Checkbox through focus, blur, keyboard changes and submission", async () => {
  const onSubmit = vi.fn();
  function Example() {
    const form = Preferences.useForm();
    return <Preferences.Form form={form} onSubmit={onSubmit}>
      <Preferences.Fields />
      <SubmitButton>Save</SubmitButton>
    </Preferences.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  const country = screen.getByRole("combobox", { name: "Country" });
  await user.click(country);
  await user.keyboard("{Escape}{Tab}");
  await waitFor(() => expect(country).toHaveAttribute("aria-invalid", "true"));
  expect(country).toHaveAccessibleDescription("Where you live. Choose a country.");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(country).toHaveFocus());
  await user.keyboard("{ArrowDown}");
  await user.click(await screen.findByRole("option", { name: "Australia" }));
  const enabled = screen.getByRole("checkbox", { name: "Enabled" });
  enabled.focus();
  await user.keyboard(" ");
  expect(enabled).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]![0]).toEqual({ country: "AU", enabled: true });
});
