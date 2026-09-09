import type { ReactNode } from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { defineForm, defineSection, Form, Page, Section, LayoutBody } from "@formulate/react";
import { Name } from "../examples/react/src/declarations/name";
import { defineForm as defineStyledForm } from "../examples/react/src/lib/formulate-config";
import { Stack } from "../examples/react/src/components/formulate/layouts";
import { ResponsiveLayout } from "../examples/react/src/responsive-layout";

function FormLayout({ children }: { children?: ReactNode }) { return <div data-testid="form-layout">{children}</div>; }
function PageLayout({ children }: { children?: ReactNode }) { return <div data-testid="page-layout">{children}</div>; }
function SectionLayout({ children }: { children?: ReactNode }) { return <div data-testid="section-layout">{children}</div>; }

it("applies layouts only to their container bodies and preserves DOM/tab order and submission", async () => {
  const Contact = defineSection({ email: { schema: z.email(), defaultValue: "", component: "input", label: "Email" } }, { layout: SectionLayout });
  const Registration = defineForm({ contact: Contact }, { layout: FormLayout });
  const onSubmit = vi.fn();
  function Example() {
    const form = Registration.useForm();
    return <Registration.Form form={form} onSubmit={onSubmit}>
      <Page id="details" title="Details" layout={PageLayout}>
        <Registration.Section name="contact" title="Contact" />
        <button>Save</button>
      </Page>
    </Registration.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  expect(within(screen.getByTestId("form-layout")).getByRole("region", { name: "Details" })).toBeInTheDocument();
  expect(within(screen.getByTestId("page-layout")).queryByRole("heading", { name: "Details" })).toBeNull();
  expect(within(screen.getByTestId("section-layout")).queryByRole("heading", { name: "Contact" })).toBeNull();
  await user.tab();
  expect(screen.getByLabelText("Email")).toHaveFocus();
  await user.type(screen.getByLabelText("Email"), "person@example.com");
  await user.tab();
  expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
  await user.keyboard("{Enter}");
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]![0]).toEqual({ contact: { email: "person@example.com" } });
});

it("replaces definition defaults, supports null, and passes layouts into custom presentations and Bind", () => {
  const Group = defineSection({ value: { schema: z.string(), defaultValue: "", component: "input", label: "Value" } }, {
    layout: SectionLayout,
    render: ({ title, layout }) => <Section title={title}><LayoutBody layout={layout}><Group.Fields /></LayoutBody></Section>,
  });
  const ExampleForm = defineForm({ first: Group, second: Group, third: Group }, { layout: FormLayout });
  function Example() {
    const form = ExampleForm.useForm();
    return <ExampleForm.Form form={form} onSubmit={() => undefined} layout={null}>
      <ExampleForm.Section name="first" layout={PageLayout} />
      <ExampleForm.Section name="second" layout={null} />
      <Group.Bind control={form.control} bindings={{ value: "third.value" }} />
    </ExampleForm.Form>;
  }
  render(<Example />);
  expect(screen.queryByTestId("form-layout")).toBeNull();
  expect(screen.getAllByTestId("page-layout")).toHaveLength(1);
  expect(screen.getAllByTestId("section-layout")).toHaveLength(1);
  expect(screen.getAllByLabelText("Value").map((input) => input.getAttribute("name"))).toEqual(["first.value", "second.value", "third.value"]);
});

it("supports direct form layouts and explicit section children without extra value owners", () => {
  const Group = defineSection({ value: { schema: z.string(), defaultValue: "", component: "input", label: "Value" } }, { layout: SectionLayout });
  const Definition = defineForm({ group: Group });
  function Example() {
    const form = Definition.useForm();
    return <Form form={form} onSubmit={() => undefined} layout={FormLayout}>
      <Definition.Section name="group"><Group.Field name="value" /></Definition.Section>
      <Page id="inactive" title="Inactive" active={false} layout={PageLayout}><p>Hidden</p></Page>
    </Form>;
  }
  render(<Example />);
  expect(within(screen.getByTestId("section-layout")).getByLabelText("Value")).toHaveAttribute("name", "group.value");
  expect(screen.queryByTestId("page-layout")).toBeNull();
});

it("reuses the shadcn Name group with independent bindings, layouts, accessible errors and parsed values", async () => {
  const Contacts = defineStyledForm({ primary: Name, secondary: Name }, { layout: Stack });
  const onSubmit = vi.fn();
  function Example() {
    const form = Contacts.useForm();
    return <Contacts.Form form={form} onSubmit={onSubmit}>
      <Contacts.Section name="primary" title="Primary" />
      <Contacts.Section name="secondary" title="Secondary" layout={Stack} />
      <button>Save</button>
    </Contacts.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  const primary = screen.getByRole("group", { name: "Primary" });
  const secondary = screen.getByRole("group", { name: "Secondary" });
  expect(primary.querySelector('[data-formulate-layout="row"]')).not.toBeNull();
  expect(secondary.querySelector('[data-formulate-layout="row"]')).toBeNull();
  await user.click(screen.getByRole("button", { name: "Save" }));
  const first = within(primary).getByLabelText("First name");
  await waitFor(() => expect(first).toHaveFocus());
  expect(first).toHaveAccessibleDescription("Enter a first name.");
  expect(first).toHaveAttribute("aria-invalid", "true");
  await user.type(first, " Ada ");
  await user.type(within(primary).getByLabelText("Last name"), "Lovelace");
  expect(within(secondary).getByLabelText("First name")).toHaveValue("");
  await user.type(within(secondary).getByLabelText("First name"), "Grace");
  await user.type(within(secondary).getByLabelText("Last name"), "Hopper");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]![0]).toEqual({ primary: { firstName: "Ada", lastName: "Lovelace" }, secondary: { firstName: "Grace", lastName: "Hopper" } });
});

it("retains edited controls while changing the example's available width", async () => {
  render(<ResponsiveLayout />);
  const user = userEvent.setup();
  const first = screen.getByLabelText("First name");
  await user.type(first, "Ada");
  screen.getByRole("slider", { name: "Form width" }).focus();
  await user.keyboard("{Home}");
  expect(screen.getByText("Form width · 45%")).toBeInTheDocument();
  expect(screen.getByLabelText("First name")).toBe(first);
  expect(first).toHaveValue("Ada");
});
