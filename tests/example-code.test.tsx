import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { App } from "../examples/react/src/app";
import CodePanel from "../examples/react/src/code-panel";

it("switches highlighted source excerpts without losing form edits and follows the selected example", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText("Email"), "draft@example.com");
  await user.click(await screen.findByRole("button", { name: "Definition" }));
  const definition = screen.getByRole("region", { name: "Definition source code" });
  expect(definition).toHaveTextContent("const SignIn = defineForm");
  expect(definition.querySelector(".hljs-keyword")).not.toBeNull();
  expect(screen.getByLabelText("Email")).toHaveValue("draft@example.com");
  const formButton = within(screen.getByRole("group", { name: "Code excerpts" })).getByRole("button", { name: "Form" });
  formButton.focus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("region", { name: "Form source code" })).toHaveTextContent("SignIn.useForm()");
  expect(screen.getByLabelText("Email")).toHaveValue("draft@example.com");
  await user.click(screen.getByRole("button", { name: "03 Email confirmation" }));
  expect(await screen.findByRole("region", { name: "Form source code" })).toHaveTextContent("EmailConfirmation.useForm()");
  await user.click(screen.getByRole("button", { name: "Definition" }));
  expect(screen.getByRole("region", { name: "Definition source code" })).toHaveTextContent("values.email === values.confirmEmail");
});

it("shows reusable section authoring as inert code with accessible keyboard scrolling", async () => {
  const user = userEvent.setup();
  render(<CodePanel example="customer" />);
  await user.click(screen.getByRole("button", { name: "Address" }));
  const source = screen.getByRole("region", { name: "Address source code" });
  expect(source).toHaveAttribute("tabindex", "0");
  expect(source).toHaveTextContent("defineSection");
  expect(source).toHaveTextContent('<Address.Field name="street"');
  expect(source.querySelector("input, select, [contenteditable], form")).toBeNull();
  expect(screen.getByRole("button", { name: "Address" })).toHaveAttribute("aria-pressed", "true");
});
