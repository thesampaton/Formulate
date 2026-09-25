import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { App } from "../examples/react/src/app";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

afterEach(() => vi.unstubAllGlobals());

it.each(["", "#/overview", "#/examples/missing"])("opens the overview for %j", (hash) => {
  window.history.replaceState(null, "", `/${hash}`);
  render(<App />);
  expect(screen.getByRole("link", { name: "Overview", current: "page" })).toHaveAttribute("href", "#/overview");
  expect(screen.getByRole("img", { name: /^Anatomy of a composed Formulate form/ })).toBeInTheDocument();
  expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Composition source code" })).not.toBeInTheDocument();
});

it("opens a bookmarked example with its matching navigation state", async () => {
  window.history.replaceState(null, "", "/#/examples/multiPage");
  render(<App />);
  expect(screen.getByRole("link", { name: "06 Page completion", current: "page" })).toHaveAttribute("href", "#/examples/multiPage");
  expect(await screen.findByLabelText("First name", {}, { timeout: 5000 })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
});

it("keeps a control API deep link on the controls page", async () => {
  window.history.replaceState(null, "", "/#/examples/controls?section=combobox");
  const user = userEvent.setup();
  render(<App />);

  expect(await screen.findByRole("heading", { name: "Control binding API" }, { timeout: 10000 })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "10 Interchangeable controls", current: "page" })).toHaveAttribute("href", "#/examples/controls");

  const reference = screen.getByRole("region", { name: "Control binding API" });
  const innerNav = within(reference).getByRole("navigation", { name: "Controls on this page" });
  expect(within(innerNav).getAllByRole("link")).toHaveLength(14);
  expect(within(reference).getByRole("link", { name: "shadcn Combobox docs ↗" })).toHaveAttribute("href", "https://ui.shadcn.com/docs/components/base/combobox");
  expect(within(reference).getByRole("region", { name: "Dependent choice binding source code" })).toHaveTextContent('componentProps={{ options: view?.options ?? [] }}');

  await user.click(within(innerNav).getByRole("link", { name: "Select" }));
  expect(window.location.hash).toBe("#/examples/controls?section=select");
  const select = document.getElementById("control-select")!;
  expect(within(select).getByText("readonly ControlOption[]")).toBeInTheDocument();
  expect(within(select).getByRole("link", { name: "shadcn Select docs ↗" })).toBeInTheDocument();
});

it("supports keyboard navigation and starts a fresh form when returning to an example", async () => {
  const user = userEvent.setup();
  render(<App />);
  screen.getByRole("link", { name: "00 Form lifecycle" }).focus();
  await user.keyboard("{Enter}");
  await user.type(await screen.findByLabelText("Email"), "draft@example.com");
  expect(window.location.hash).toBe("#/examples/simple");

  await user.click(screen.getByRole("link", { name: "03 Cross-field validation" }));
  expect(await screen.findByRole("heading", { name: "Confirm your email" })).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toHaveValue("");

  await user.click(screen.getByRole("link", { name: "00 Form lifecycle" }));
  expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toHaveValue("");
});

it("follows browser back and forward navigation between the overview and examples", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("link", { name: "00 Form lifecycle" }));
  expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "03 Cross-field validation" }));
  expect(await screen.findByRole("heading", { name: "Confirm your email" })).toBeInTheDocument();

  act(() => window.history.back());
  await waitFor(() => expect(screen.getByRole("link", { name: "00 Form lifecycle" })).toHaveAttribute("aria-current", "page"));
  expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();

  act(() => window.history.back());
  await waitFor(() => expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page"));
  expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();

  act(() => window.history.forward());
  await waitFor(() => expect(screen.getByRole("link", { name: "00 Form lifecycle" })).toHaveAttribute("aria-current", "page"));
  expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
});

it("opens mobile navigation by keyboard and closes it after selecting an example", async () => {
  vi.stubGlobal("innerWidth", 390);
  const user = userEvent.setup();
  render(<App />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  screen.getByRole("button", { name: "Toggle Sidebar" }).focus();
  await user.keyboard("{Enter}");
  const sidebar = await screen.findByRole("dialog", { name: "Sidebar" });
  await user.click(within(sidebar).getByRole("link", { name: "00 Form lifecycle" }));
  expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
});
