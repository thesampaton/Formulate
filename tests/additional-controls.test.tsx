import { useState } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { Page } from "@formulate/react";
import { defineForm } from "../examples/react/src/lib/formulate-config";
import { ControlGalleryForm } from "../examples/react/src/compositions/control-gallery";
import { ControlGallery } from "../examples/react/src/declarations/control-gallery";
import { exampleData } from "../examples/react/src/data/example-data";

const options = [{ value: "AU", label: "Australia" }, { value: "NZ", label: "New Zealand" }, { value: "US", label: "United States", disabled: true }];
const dateSchema = z.date().nullable().refine((value) => value !== null, "Choose a date.");

it("binds textarea, switch, numeric slider and string OTP through editing, blur, focus and submission", async () => {
  const Definition = defineForm({
    note: { schema: z.string().min(1, "Enter a note."), defaultValue: "", label: "Note", description: "A short note.", component: "textarea", componentProps: { rows: 3 } },
    enabled: { schema: z.boolean(), defaultValue: false, label: "Enabled", component: "switch" },
    level: { schema: z.number().max(10, "Use ten or less."), defaultValue: 3, label: "Level", component: "slider", componentProps: { min: 0, max: 20, step: 1 } },
    code: { schema: z.string().length(6), defaultValue: "", label: "Code", component: "inputOTP" },
  });
  const submit = vi.fn();
  let form!: ReturnType<typeof Definition.useForm>;
  function Example() {
    form = Definition.useForm();
    return <Definition.Form form={form} onSubmit={submit}><Definition.Fields /><button>Save</button></Definition.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  const note = screen.getByRole("textbox", { name: "Note" });
  await user.click(note); await user.tab();
  await waitFor(() => expect(note).toHaveAccessibleDescription("A short note. Enter a note."));
  await user.type(note, "Hello\nWorld");
  await user.click(screen.getByRole("switch", { name: "Enabled" }));
  const slider = screen.getByRole("slider", { name: "Level" });
  slider.focus(); await user.keyboard("{ArrowRight}");
  expect(form.getValues("level")).toBe(4);
  await user.type(screen.getByRole("textbox", { name: "Code" }), "012345");
  expect(submit).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]![0]).toEqual({ note: "Hello\nWorld", enabled: true, level: 4, code: "012345" });
  await act(async () => { form.setValue("level", 11); });
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(slider).toHaveFocus());
  expect(slider).toHaveAttribute("aria-invalid", "true");
  expect(slider).toHaveAccessibleDescription("Use ten or less.");
});

it("treats radio and toggle groups as one field each, with distinct scalar and array values", async () => {
  const Definition = defineForm({
    radio: { schema: z.string().min(1), defaultValue: "", label: "Radio", component: "radioGroup", componentProps: { options, orientation: "horizontal" } },
    toggle: { schema: z.string(), defaultValue: "", label: "Toggle", component: "toggleGroup", componentProps: { options } },
    multiple: { schema: z.array(z.string()), defaultValue: [], label: "Multiple", component: "multiToggleGroup", componentProps: { options } },
  });
  let form!: ReturnType<typeof Definition.useForm>;
  function Example() {
    form = Definition.useForm();
    return <Definition.Form form={form} onSubmit={() => {}}><Definition.Fields /><button>Save</button></Definition.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  const radio = within(screen.getByRole("radiogroup", { name: "Radio" }));
  await user.click(radio.getByRole("radio", { name: "Australia" }));
  await user.keyboard("{ArrowRight>}");
  await waitFor(() => expect(form.getValues("radio")).toBe("NZ"));
  await user.keyboard("{/ArrowRight}");
  expect(form.getFieldState("radio").isTouched).toBe(false);
  expect(radio.getByRole("radio", { name: "United States" })).toHaveAttribute("aria-disabled", "true");
  const toggle = within(screen.getByRole("group", { name: "Toggle" }));
  await user.click(toggle.getByRole("button", { name: "Australia" }));
  expect(form.getFieldState("radio").isTouched).toBe(true);
  expect(form.getValues("toggle")).toBe("AU");
  await user.click(toggle.getByRole("button", { name: "Australia" }));
  expect(form.getValues("toggle")).toBe("");
  const multiple = within(screen.getByRole("group", { name: "Multiple" }));
  await user.click(multiple.getByRole("button", { name: "Australia" }));
  await user.click(multiple.getByRole("button", { name: "New Zealand" }));
  expect(form.getValues("multiple")).toEqual(["AU", "NZ"]);
  await user.click(multiple.getByRole("button", { name: "Australia" }));
  expect(form.getValues("multiple")).toEqual(["NZ"]);
  expect(multiple.getByRole("button", { name: "United States" })).toBeDisabled();
});

it("keeps Command search/highlight separate from the committed value and prevents Enter from submitting", async () => {
  const Definition = defineForm({ country: { schema: z.string().min(1), defaultValue: "", label: "Country", component: "command", componentProps: { options } } });
  const submit = vi.fn();
  let form!: ReturnType<typeof Definition.useForm>;
  function Example() {
    form = Definition.useForm();
    return <Definition.Form form={form} onSubmit={submit}><Definition.Fields /><button>Save</button></Definition.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  const input = screen.getByRole("combobox", { name: "Country" });
  await user.type(input, "New");
  expect(form.getValues("country")).toBe("");
  await user.keyboard("{ArrowDown}{Enter}");
  expect(form.getValues("country")).toBe("NZ");
  expect(submit).not.toHaveBeenCalled();
  expect(new FormData(input.closest("form")!).getAll("country")).toEqual(["NZ"]);
  expect(screen.getByText("Selected: New Zealand")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear selection" }));
  expect(form.getValues("country")).toBe("");
  expect(form.getFieldState("country").isTouched).toBe(false);
  await user.tab();
  expect(form.getFieldState("country").isTouched).toBe(true);
});

it("commits Combobox options, preserves values across Activity, and resets without storing search text", async () => {
  const Definition = defineForm({ country: { schema: z.string().min(1, "Choose a country."), defaultValue: "", label: "Country", component: "combobox", componentProps: { options } } });
  let form!: ReturnType<typeof Definition.useForm>;
  function Example() {
    form = Definition.useForm();
    const [active, setActive] = useState(true);
    return <Definition.Form form={form} onSubmit={() => {}}>
      <Page title="Choices" pageId="choices" active={active}><Definition.Fields /></Page>
      <button type="button" onClick={() => setActive(!active)}>Toggle page</button>
      <button type="button" onClick={() => form.reset()}>Reset</button><button>Save</button>
    </Definition.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  const input = screen.getByRole("combobox", { name: "Country" });
  await user.type(input, "New");
  expect(form.getValues("country")).toBe("");
  await user.click(await screen.findByRole("option", { name: "New Zealand" }));
  expect(form.getValues("country")).toBe("NZ");
  expect(screen.getByRole("button", { name: "Clear selection" })).toBeInTheDocument();
  expect(new FormData(input.closest("form")!).getAll("country")).toEqual(["NZ"]);
  await user.click(screen.getByRole("button", { name: "Toggle page" }));
  expect(input).not.toBeVisible();
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Toggle page" }));
  expect(input).toHaveValue("New Zealand");
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(input).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(input).toHaveFocus());
  expect(input).toHaveAccessibleDescription("Choose a country.");
});

it("edits, clears and focuses a nullable DatePicker and closes its popup on blur", async () => {
  const Definition = defineForm({ date: { schema: dateSchema, defaultValue: null, label: "Visit", component: "datePicker", componentProps: { defaultMonth: new Date(2026, 8, 1) } } });
  let form!: ReturnType<typeof Definition.useForm>;
  const submit = vi.fn();
  function Example() {
    form = Definition.useForm();
    return <Definition.Form form={form} onSubmit={submit}><Definition.Fields /><button>Save</button></Definition.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  const trigger = screen.getByRole("button", { name: /Visit/ });
  await user.click(trigger);
  await user.click(await screen.findByRole("button", { name: /September 14th, 2026/ }));
  expect(form.getValues("date")).toEqual(new Date(2026, 8, 14));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(form.getFieldState("date").isTouched).toBe(true);
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]![0].date).toBeInstanceOf(Date);
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "Clear date" }));
  expect(form.getValues("date")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(trigger).toHaveAccessibleDescription("Choose a date.");
});

it("focuses a day inside Calendar on validation and waits for focus to leave the whole calendar before blur", async () => {
  const Definition = defineForm({ date: { schema: dateSchema, defaultValue: null, label: "Calendar date", component: "calendar", componentProps: { defaultMonth: new Date(2026, 8, 1), disabledDates: new Date(2026, 8, 13) } } });
  let form!: ReturnType<typeof Definition.useForm>;
  function Example() {
    form = Definition.useForm();
    return <Definition.Form form={form} onSubmit={() => {}}><Definition.Fields /><button>Save</button></Definition.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Save" }));
  const calendar = screen.getByRole("group", { name: "Calendar date" });
  await waitFor(() => expect(calendar).toContainElement(document.activeElement as HTMLElement));
  expect(document.activeElement).toHaveAccessibleDescription("Choose a date.");
  await user.keyboard("{ArrowRight}");
  expect(form.getFieldState("date").isTouched).toBe(false);
  expect(screen.getByRole("button", { name: /September 13th, 2026/ })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: /September 14th, 2026/ }));
  expect(form.getValues("date")).toEqual(new Date(2026, 8, 14));
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(form.getFieldState("date").isTouched).toBe(true);
});

it("submits all gallery controls with typed sample values", async () => {
  const submit = vi.fn();
  render(<ControlGalleryForm onSave={submit} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Load sample" }));
  await user.click(screen.getByRole("button", { name: "Save values" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]![0]).toEqual(exampleData.controls);
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByRole("textbox", { name: "InputOTP" })).toHaveValue("");
  expect(screen.getByRole("switch", { name: "Switch" })).not.toBeChecked();
  expect(screen.getByRole("combobox", { name: "Combobox" })).toHaveValue("");
  expect(screen.getByRole("slider", { name: "Slider" })).toHaveAttribute("aria-valuenow", "50");
});

it("disables every control and closes an open date/choice popup without changing values", async () => {
  let form!: ReturnType<typeof ControlGallery.useForm>;
  let setDisabled!: (disabled: boolean) => void;
  function Example() {
    const [disabled, updateDisabled] = useState(false);
    setDisabled = updateDisabled;
    form = ControlGallery.useForm({ disabled, defaultValues: exampleData.controls });
    return <ControlGallery.Form form={form} onSubmit={() => {}}><ControlGallery.Fields /></ControlGallery.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /DatePicker/ }));
  expect(await screen.findByRole("dialog")).toBeInTheDocument();
  await act(async () => setDisabled(true));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  for (const name of ["Input", "Textarea", "InputOTP"]) expect(screen.getByRole("textbox", { name })).toBeDisabled();
  for (const name of ["Select", "Combobox", "Command"]) expect(screen.getByRole("combobox", { name })).toBeDisabled();
  expect(screen.getByRole("checkbox", { name: "Checkbox" })).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByRole("switch", { name: "Switch" })).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByRole("slider", { name: "Slider" })).toBeDisabled();
  expect(screen.getByRole("button", { name: /DatePicker/ })).toBeDisabled();
  const radios = within(screen.getByRole("radiogroup", { name: "RadioGroup" }));
  expect(radios.getByRole("radio", { name: "Australia" })).toHaveAttribute("aria-disabled", "true");
  const toggles = within(screen.getByRole("group", { name: "ToggleGroup (multiple)" }));
  expect(toggles.getByRole("button", { name: "Australia" })).toBeDisabled();
  const calendar = within(screen.getByRole("group", { name: "Calendar" }));
  expect(calendar.getByRole("button", { name: /September 14th, 2026/ })).toBeDisabled();
  await act(async () => setDisabled(false));
  await user.click(screen.getByRole("combobox", { name: "Combobox" }));
  await user.keyboard("{ArrowDown}");
  expect(await screen.findByRole("option", { name: "Australia" })).toBeInTheDocument();
  await act(async () => setDisabled(true));
  await waitFor(() => expect(screen.queryByRole("listbox", { name: "Combobox" })).not.toBeInTheDocument());
  expect(form.getValues()).toEqual(exampleData.controls);
});
