import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { createFormulate, defaultComponents, defineField, defineFieldControl, defineForm, defineSection, field, useFieldBinding } from "@formulate/react";
import { Country, Currency, DateRange, Email, Password, Percentage, Phone, Url } from "../examples/react/src/declarations/common-fields";

it("reuses schema and presentation through sections with independent values, overrides, and reset defaults", async () => {
  const Contact = defineSection({ email: field(Email, { componentProps: { autoComplete: "off" } }) });
  const Contacts = defineForm({
    first: Contact,
    second: Contact,
    billing: field(Email, { defaultValue: "billing@example.com", label: "Billing", componentProps: { placeholder: "Billing address" } }),
  });
  const submit = vi.fn();
  function Example() {
    const form = Contacts.useForm();
    return <Contacts.Form form={form} onSubmit={submit}>
      <Contacts.Section name="first"><Contact.Field name="email" label="First" /></Contacts.Section>
      <Contacts.Section name="second"><Contact.Field name="email" label="Second" componentProps={{ className: "second-email" }} /></Contacts.Section>
      <Contacts.Field name="billing" />
      <button>Save</button>
      <button type="button" onClick={() => form.reset()}>Reset</button>
    </Contacts.Form>;
  }
  const user = userEvent.setup();
  const { container } = render(<Example />);
  const first = screen.getByLabelText("First");
  const second = screen.getByLabelText("Second");
  expect(first).toHaveAttribute("type", "email");
  expect(first).toHaveAttribute("autocomplete", "off");
  expect(second).toHaveAttribute("placeholder", "you@example.com");
  expect(second).toHaveClass("second-email");
  expect(container.querySelector("[primitive], [schema], [defaultValue]")).toBeNull();
  await user.type(first, "first@example.com");
  expect(second).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  expect(submit).not.toHaveBeenCalled();
  await user.type(second, "second@example.com");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]![0]).toEqual({ first: { email: "first@example.com" }, second: { email: "second@example.com" }, billing: "billing@example.com" });
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(first).toHaveValue("");
  expect(second).toHaveValue("");
  expect(screen.getByLabelText("Billing")).toHaveValue("billing@example.com");
  expect(Email.defaultValue).toBe("");
  expect(Email.componentProps.autoComplete).toBe("email");
});

it("lets the same boolean semantics use different controls and the same key use different local implementations", async () => {
  const Switch = defineFieldControl<boolean>()(function Switch() {
    const { value, onChange, ...binding } = useFieldBinding<boolean>();
    return <button {...binding} type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)} />;
  });
  const Enabled = defineField({ primitive: "boolean", schema: z.boolean(), defaultValue: false, label: "Enabled", component: "checkbox" });
  const firstMap = createFormulate({ components: { ...defaultComponents, switch: Switch } });
  const secondMap = createFormulate({ components: { checkbox: Switch } });
  const First = firstMap.defineForm({
    check: firstMap.field(Enabled, { label: "Checkbox" }),
    toggle: firstMap.field(Enabled, { label: "Switch", component: "switch" }),
  });
  const Second = secondMap.defineForm({ enabled: secondMap.field(Enabled, { label: "Local switch" }) });
  const submit = vi.fn();
  function Example() {
    const first = First.useForm();
    const second = Second.useForm();
    return <>
      <First.Form form={first} onSubmit={submit}><First.Fields /><button>Save</button></First.Form>
      <Second.Form form={second} onSubmit={() => {}}><Second.Fields /></Second.Form>
    </>;
  }
  render(<Example />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("checkbox", { name: "Checkbox" }));
  await user.click(screen.getByRole("switch", { name: "Switch" }));
  expect(screen.getByRole("switch", { name: "Local switch" })).toHaveAttribute("aria-checked", "false");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0]![0]).toEqual({ check: true, toggle: true });
  expect(Enabled.primitive).toBe("boolean");
});

it("replaces control props as a unit, supports connected children, and keeps user-defined parsing and metadata", () => {
  const Money = field(Currency, { component: "number", componentProps: { step: "1" } });
  expect(Money.componentProps).toEqual({ step: "1" });
  expect(Money.schema).toBe(Currency.schema);
  expect(Money.primitive).toBe("number");
  const Composed = field(Email, { children: <span>Custom editor</span> });
  expect(Composed).not.toHaveProperty("component");
  expect(Composed).not.toHaveProperty("componentProps");
  const ProjectCode = defineField({
    primitive: "text", schema: z.string().regex(/^PRJ-\d+$/).transform((value) => Number(value.slice(4))).meta({ description: "Internal project ID" }),
    defaultValue: "PRJ-1", label: "Project", component: "input",
  });
  const Project = defineForm({ project: field(ProjectCode, { defaultValue: "PRJ-42" }) });
  expect(Project.defaultValues).toEqual({ project: "PRJ-42" });
  expect(Project.schema.parse(Project.defaultValues)).toEqual({ project: 42 });
  expect(ProjectCode.schema.meta()).toEqual({ description: "Internal project ID" });
});

it("keeps structured defaults independent between mounted forms", async () => {
  const Range = defineFieldControl<z.input<typeof DateRange.schema>>()(() => null);
  const ui = createFormulate({ components: { dateRange: Range } });
  const Booking = ui.defineForm({ dates: ui.field(DateRange) });
  let first!: ReturnType<typeof Booking.useForm>;
  let second!: ReturnType<typeof Booking.useForm>;
  function Example() {
    first = Booking.useForm();
    second = Booking.useForm();
    return <button onClick={() => first.setValue("dates.from", new Date(2026, 8, 12))}>Set date</button>;
  }
  render(<Example />);
  await userEvent.setup().click(screen.getByRole("button"));
  expect(first.getValues("dates.from")).toEqual(new Date(2026, 8, 12));
  expect(second.getValues("dates")).toEqual({ from: null, to: null });
  expect(DateRange.defaultValue).toEqual({ from: null, to: null });
});

it("establishes explicit common-field validation and editing contracts", () => {
  for (const [definition, valid, invalid] of [
    [Email, "person@example.com", "not-an-email"],
    [Password, "present", ""],
    [Url, "https://example.com", "not a URL"],
    [Phone, "+61 (2) 1234 5678", "call me"],
    [Currency, -12.5, Infinity],
    [Percentage, 50.5, 101],
    [Country, "AU", "Australia"],
    [DateRange, { from: new Date(2026, 8, 12), to: new Date(2026, 8, 13) }, { from: new Date(2026, 8, 13), to: new Date(2026, 8, 12) }],
  ] as const) {
    expect(definition.schema.safeParse(valid).success).toBe(true);
    expect(definition.schema.safeParse(invalid).success).toBe(false);
  }
  expect(Currency.schema.safeParse(NaN).success).toBe(false);
  expect(Percentage.schema.safeParse(-1).success).toBe(false);
  expect(Phone.schema.safeParse("123").success).toBe(false);
  expect(DateRange.schema.safeParse({ from: new Date(), to: null }).success).toBe(false);
  expect(DateRange.schema.safeParse(DateRange.defaultValue).success).toBe(false);
});
