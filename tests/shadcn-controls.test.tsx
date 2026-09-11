import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { defineForm } from "../examples/react/src/lib/formulate-config";
import { FormSubmitButton } from "../examples/react/src/components/formulate/form-actions";
import { Page } from "@formulate/react";

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
      <FormSubmitButton>Save</FormSubmitButton>
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

it("retains selected values when Activity reconnects controls and still allows RHF to clear them", async () => {
  const onSubmit = vi.fn();
  function Example() {
    const form = Preferences.useForm();
    const [active, setActive] = useState(true);
    return <Preferences.Form form={form} onSubmit={onSubmit}>
      <Page pageId="preferences" title="Preferences" active={active}><Preferences.Fields /></Page>
      <button type="button" onClick={() => setActive(!active)}>Toggle page</button>
      <button type="button" onClick={() => form.reset()}>Reset</button>
      <FormSubmitButton>Save</FormSubmitButton>
    </Preferences.Form>;
  }
  const user = userEvent.setup();
  render(<Example />);
  const country = screen.getByRole("combobox", { name: "Country" });
  const enabled = screen.getByRole("checkbox", { name: "Enabled" });
  await user.click(country);
  await user.click(await screen.findByRole("option", { name: "Australia" }));
  await user.click(enabled);
  await user.click(screen.getByRole("button", { name: "Toggle page" }));
  expect(country).not.toBeVisible();
  await user.click(screen.getByRole("button", { name: "Toggle page" }));
  expect(screen.getByRole("combobox", { name: "Country" })).toBe(country);
  expect(country).toHaveTextContent("Australia");
  expect(enabled).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ country: "AU", enabled: true }, expect.anything()));
  await user.click(screen.getByRole("button", { name: "Toggle page" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  await user.click(screen.getByRole("button", { name: "Toggle page" }));
  expect(country).toHaveTextContent("Choose");
  expect(enabled).not.toBeChecked();
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(country).toHaveAttribute("aria-invalid", "true"));
  expect(onSubmit).toHaveBeenCalledTimes(1);
});
