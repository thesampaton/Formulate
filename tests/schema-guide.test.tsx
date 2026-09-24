import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "../examples/react/src/app";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

it("opens schema-driven forms from Start here and keeps it in the guide navigation", async () => {
  const user = userEvent.setup();
  render(<App />);

  const startHere = screen.getByText("Start here").closest<HTMLElement>('[data-slot="sidebar-group"]')!;
  const guideLink = within(startHere).getByRole("link", { name: "Schema-driven forms" });
  expect(guideLink).toHaveAttribute("href", "#/schema-driven");
  await user.click(guideLink);

  expect(await screen.findByRole("heading", { name: "One schema, one form" })).toBeInTheDocument();
  expect(guideLink).toHaveAttribute("aria-current", "page");
  expect(within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByText("Guide")).toBeInTheDocument();
  expect(document.title).toBe("Schema-driven forms · Formulate");

  const exampleLink = screen.getByRole("link", { name: "Try the workshop form" });
  expect(exampleLink).toHaveAttribute("href", "#/examples/schema");
  await user.click(exampleLink);
  expect(await screen.findByLabelText("Name", {}, { timeout: 5000 })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "00 Schema composition", current: "page" })).toBeInTheDocument();

  act(() => window.history.back());
  await waitFor(() => expect(guideLink).toHaveAttribute("aria-current", "page"));
  expect(await screen.findByRole("heading", { name: "Field keys" })).toBeInTheDocument();
});

it("opens a bookmarked guide with the complete authoring source and schema key descriptions", async () => {
  window.history.replaceState(null, "", "/#/schema-driven");
  render(<App />);

  const source = await screen.findByRole("region", { name: "Whole form source code" });
  expect(source).toHaveTextContent("export const WorkshopRegistration = defineForm({");
  expect(source).toHaveTextContent("contact: defineSection({");
  expect(source).toHaveTextContent('applicable: { binding: "needsInvoice", equals: true }');
  expect(source).toHaveTextContent("<WorkshopRegistration.Fields />");
  expect(screen.getByRole("heading", { name: "Field keys" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Form and section options" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Conditions and relationships" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "From editing values to a payload" })).toBeInTheDocument();

  const fields = within(screen.getByRole("table", { name: "Field keys" }));
  const schemaCell = fields.getByRole("rowheader", { name: "schema" });
  expect(schemaCell.closest("tr")).toHaveTextContent(/Zod/);
  const defaultCell = fields.getByRole("rowheader", { name: "defaultValue" });
  expect(defaultCell.closest("tr")).toHaveTextContent(/initial|starting/i);
  const applicableCell = fields.getByRole("rowheader", { name: "applicable" });
  expect(applicableCell.closest("tr")).toHaveTextContent(/condition/i);
  expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
});
