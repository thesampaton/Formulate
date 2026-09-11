import { useState } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Booking } from "../examples/react/src/declarations/structured-editing";
import { FormulatePortalProvider, Page, Section } from "@formulate/react";
import { exampleData } from "../examples/react/src/data/example-data";
import { StructuredEditingExample } from "../examples/react/src/structured-editing";

it("focuses a structured root and describes a nested validation issue on its trigger", async () => {
  const onSubmit = vi.fn();
  function Example() {
    const form = Booking.useForm();
    return <Booking.Form form={form} onSubmit={onSubmit}><Booking.Fields /><button>Save</button></Booking.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Save" }));
  const dates = screen.getByRole("button", { name: /Travel dates/ });
  await waitFor(() => expect(dates).toHaveFocus());
  expect(dates).toHaveAttribute("aria-invalid", "true");
  expect(dates).toHaveAccessibleDescription("Choose a start and end date. Escape closes the calendar. Choose a start date.");
  expect(onSubmit).not.toHaveBeenCalled();
});

it("keeps focus changes within the portalled editor untouched, validates on close, and restores trigger focus", async () => {
  let form!: ReturnType<typeof Booking.useForm>;
  function Example() {
    form = Booking.useForm();
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    return <FormulatePortalProvider container={container}>
      <Booking.Form form={form} onSubmit={() => {}}><Booking.Fields /></Booking.Form>
      <div ref={setContainer} data-testid="portal" />
    </FormulatePortalProvider>;
  }
  render(<Example />);
  const user = userEvent.setup();
  const activities = screen.getByRole("button", { name: /^Activities / });
  activities.focus();
  await user.keyboard("{Enter}");
  const dialog = await screen.findByRole("dialog", { name: "Activities" });
  expect(screen.getByTestId("portal")).toContainElement(dialog);
  const walking = within(dialog).getByRole("checkbox", { name: "Walking" });
  await waitFor(() => expect(walking).toHaveFocus());
  await user.keyboard("{Tab}");
  expect(within(dialog).getByRole("checkbox", { name: "Museums" })).toHaveFocus();
  expect(form.getFieldState("activities").isTouched).toBe(false);
  await user.keyboard("{Escape}");
  await waitFor(() => expect(activities).toHaveFocus());
  await waitFor(() => expect(activities).toHaveAttribute("aria-invalid", "true"));
  expect(form.getFieldState("activities").isTouched).toBe(true);
  await user.keyboard("{Enter}");
  await user.keyboard(" ");
  await user.keyboard("{Tab} ");
  await user.click(screen.getByRole("button", { name: "Done" }));
  expect(form.getValues("activities")).toEqual(["walking", "museum"]);
  expect(activities).toHaveAccessibleName("Activities Walking, Museums");
  await waitFor(() => expect(activities).not.toHaveAttribute("aria-invalid"));
});

it("edits a partial date range, clears it, and submits transformed output without replacing editing Dates", async () => {
  let form!: ReturnType<typeof Booking.useForm>;
  const onSubmit = vi.fn();
  function Example() {
    form = Booking.useForm({ defaultValues: exampleData.structured });
    return <Booking.Form form={form} onSubmit={onSubmit}><Booking.Fields /><button>Save</button></Booking.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /^Travel dates / }));
  expect(await screen.findByRole("dialog", { name: "Travel dates" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Clear dates" }));
  expect(form.getValues("dates")).toEqual({ from: null, to: null });
  const calendar = screen.getByRole("dialog", { name: "Travel dates" });
  // Calendar's full accessible day names disambiguate dates from navigation buttons.
  await user.click(within(calendar).getByRole("button", { name: /September 14th, 2026/ }));
  expect(form.getValues("dates.from")).toEqual(new Date(2026, 8, 14));
  await user.click(within(calendar).getByRole("button", { name: /September 18th, 2026/ }));
  await user.click(screen.getByRole("button", { name: "Done" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]![0]).toEqual({ dates: { from: "2026-09-14", to: "2026-09-18" }, activities: ["walking", "museum"] });
  expect(form.getValues("dates.from")).toBeInstanceOf(Date);
});

it("closes an open portal across Activity hiding, retains structured values, and handles hidden reset and disabled forms", async () => {
  let form!: ReturnType<typeof Booking.useForm>;
  let setActive!: (value: boolean) => void;
  let setDisabled!: (value: boolean) => void;
  function Example() {
    const [active, updateActive] = useState(true);
    const [disabled, updateDisabled] = useState(false);
    setActive = updateActive;
    setDisabled = updateDisabled;
    form = Booking.useForm({ defaultValues: exampleData.structured, disabled });
    return <Booking.Form form={form} onSubmit={() => {}}>
      <Page title="Booking" pageId="booking" active={active}><Booking.Fields /></Page>
    </Booking.Form>;
  }
  render(<Example />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /^Activities / }));
  expect(await screen.findByRole("dialog")).toBeVisible();
  act(() => setActive(false));
  expect(screen.queryByRole("dialog")).toBeNull();
  act(() => setActive(true));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("button", { name: /^Activities / })).toHaveTextContent("Walking, Museums");
  await user.click(screen.getByRole("button", { name: /^Activities / }));
  expect(await screen.findByRole("dialog")).toBeVisible();
  await user.keyboard("{Escape}");
  act(() => setActive(false));
  act(() => form.reset({ dates: { from: null, to: null }, activities: [] }));
  act(() => setActive(true));
  expect(screen.getByRole("button", { name: /^Activities / })).toHaveTextContent("Choose options");
  await user.click(screen.getByRole("button", { name: /^Activities / }));
  act(() => setDisabled(true));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByRole("button", { name: /^Activities / })).toBeDisabled();
});

it("applies field/body/heading slots, increments nested headings and permits explicit levels", () => {
  function Example() {
    const form = Booking.useForm();
    return <Booking.Form form={form} onSubmit={() => {}} bodyClassName="form-body">
      <Page title="Visit" pageId="visit" bodyClassName="page-body" classNames={{ heading: "page-title" }}>
        <Section title="Plans"><Section title="Dates">
          <Booking.Field name="dates" classNames={{ label: "date-label", content: "date-content", description: "date-help" }} />
          <Section title="Fine detail" headingLevel={6}><Section title="Still fine" /></Section>
        </Section></Section>
      </Page>
    </Booking.Form>;
  }
  const { container } = render(<Example />);
  expect(screen.getByRole("heading", { level: 2, name: "Visit" })).toHaveClass("page-title");
  expect(screen.getByRole("heading", { level: 3, name: "Plans" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 4, name: "Dates" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 6, name: "Still fine" })).toBeInTheDocument();
  expect(container.querySelector(".date-label")).toHaveTextContent("Travel dates");
  expect(container.querySelector(".date-content")).toContainElement(screen.getByRole("button", { name: /^Travel dates / }));
  expect(container.querySelector(".page-body")).toBeInTheDocument();
  expect(container.querySelector(".form-body")).toBeInTheDocument();
});

it("demonstrates a scoped theme and reset in the selectable example", async () => {
  const user = userEvent.setup();
  render(<StructuredEditingExample />);
  await user.click(screen.getByRole("button", { name: "Load sample" }));
  await user.click(screen.getByRole("button", { name: "Toggle theme" }));
  await user.click(screen.getByRole("button", { name: /^Activities / }));
  const dialog = await screen.findByRole("dialog", { name: "Activities" });
  expect(dialog.closest(".dark")).not.toBeNull();
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Save visit" }));
  expect(await screen.findByRole("status")).toHaveTextContent("2026-09-14");
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByRole("button", { name: /^Travel dates / })).toHaveTextContent("Choose dates");
});
