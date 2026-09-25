import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "../examples/react/src/app";
import { exampleGroups } from "../examples/react/src/example-navigation";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

const examples = exampleGroups.flatMap((group) => group.examples);

it.each(examples)("teaches a focused capability on $title", async ({ id, title }) => {
  window.history.replaceState(null, "", `/#/examples/${id}`);
  render(<App />);

  expect(await screen.findByRole("heading", { name: title, level: 1 }, { timeout: 10000 })).toBeInTheDocument();
  expect(screen.getByText("New here")).toBeInTheDocument();
  const demo = screen.getByRole("heading", { name: "Try it" }).closest("section")!;
  await waitFor(() => expect(demo.querySelector("form")).not.toBeNull());
  const walkthrough = screen.getByRole("heading", { name: "How it works" }).closest("section")!;
  const steps = within(walkthrough).getAllByRole("listitem");
  expect(steps.length).toBeGreaterThanOrEqual(2);
  expect(steps.length).toBeLessThanOrEqual(4);
  const firstCode = within(steps[0]!).getByRole("region", { name: /source code$/ });
  expect(firstCode.querySelectorAll(".source-code-line").length).toBeLessThanOrEqual(24);
  expect(screen.getByRole("heading", { name: "Complete source" })).toBeInTheDocument();
  expect(screen.queryByRole("group", { name: "Code categories" })).not.toBeInTheDocument();
});

it("keeps the live form intact while inspecting and copying focused source", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("link", { name: "00 Form lifecycle" }));
  await user.type(await screen.findByLabelText("Email", {}, { timeout: 5000 }), "draft@example.com");
  const firstCode = await screen.findByRole("region", { name: "Define the value contract source code" });
  expect(firstCode).toHaveTextContent("const SignIn = defineForm");
  await waitFor(() => expect(firstCode.querySelector(".source-code-token[style]")).not.toBeNull());
  expect(firstCode.querySelector("code")?.textContent?.split("\n")).toHaveLength(firstCode.querySelectorAll(".source-code-line").length);
  await user.click(screen.getByRole("button", { name: "Copy Define the value contract code" }));
  expect(await navigator.clipboard.readText()).toContain("const SignIn = defineForm");
  expect(screen.getByLabelText("Email")).toHaveValue("draft@example.com");

  await user.click(screen.getByText("Composition", { exact: true }));
  expect(screen.getByRole("region", { name: "Composition source code" })).toHaveTextContent("SignIn.useForm()");
  expect(screen.getByLabelText("Email")).toHaveValue("draft@example.com");
});

it("shows the step validation example's short excerpts and complete files on demand", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("link", { name: "02 Step validation" }));

  const firstExcerpt = await screen.findByRole("region", { name: "Scope Continue to the current step source code" });
  expect(firstExcerpt).toHaveTextContent("const scopedAction");
  expect(firstExcerpt).toHaveTextContent("errorPaths");
  expect(firstExcerpt).not.toHaveTextContent("import ");
  expect(screen.getByRole("region", { name: "Use one form for Continue and Save source code" })).toHaveTextContent("scopedAction={scopedAction}");
  expect(screen.getByRole("region", { name: "Return to fields across steps source code" })).toHaveTextContent("destinations");

  await user.click(screen.getByRole("checkbox", { name: "Show advanced options" }));
  expect(screen.getByRole("checkbox", { name: "Show advanced options" })).toBeChecked();
  await user.click(screen.getByText("Composition", { exact: true }));
  expect(screen.getByRole("region", { name: "Composition source code" })).toHaveTextContent("import { RequestSettings }");
  expect(screen.getByRole("checkbox", { name: "Show advanced options" })).toBeChecked();
});
