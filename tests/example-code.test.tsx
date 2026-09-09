import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { App } from "../examples/react/src/app";
import CodePanel from "../examples/react/src/code-panel";

it("switches highlighted source excerpts without losing form edits and follows the selected example", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText("Email"), "draft@example.com");
  await user.click(await screen.findByRole("button", { name: "Declaration" }));
  const definition = screen.getByRole("region", { name: "Declaration source code" });
  expect(definition).toHaveTextContent("const SignIn = defineForm");
  expect(definition.querySelector(".hljs-keyword")).not.toBeNull();
  expect(screen.getByLabelText("Email")).toHaveValue("draft@example.com");
  const formButton = within(screen.getByRole("group", { name: "Code excerpts" })).getByRole("button", { name: "Composition" });
  formButton.focus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("region", { name: "Composition source code" })).toHaveTextContent("SignIn.useForm()");
  expect(screen.getByLabelText("Email")).toHaveValue("draft@example.com");
  await user.click(screen.getByRole("button", { name: "03 Email confirmation" }));
  expect(await screen.findByRole("region", { name: "Composition source code" })).toHaveTextContent("EmailConfirmation.useForm()");
  await user.click(screen.getByRole("button", { name: "Declaration" }));
  expect(screen.getByRole("region", { name: "Declaration source code" })).toHaveTextContent("values.email === values.confirmEmail");
});

it("shows reusable section authoring as inert code with accessible keyboard scrolling", async () => {
  const user = userEvent.setup();
  render(<CodePanel example="customer" />);
  await user.click(screen.getByRole("button", { name: "Fields & sections" }));
  await user.click(screen.getByRole("button", { name: "Address" }));
  const source = screen.getByRole("region", { name: "Address source code" });
  expect(source).toHaveAttribute("tabindex", "0");
  expect(source).toHaveTextContent("defineSection");
  expect(source).toHaveTextContent('<Address.Field name="street"');
  expect(source.querySelector("input, select, [contenteditable], form")).toBeNull();
  expect(screen.getByRole("button", { name: "Address" })).toHaveAttribute("aria-pressed", "true");
});

it("shows the actual responsive composition without demo resizing scaffolding", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "05 Reusable layouts" }));
  const source = await screen.findByRole("region", { name: "Composition source code" });
  expect(source).toHaveTextContent('import { Profile } from "@/declarations/profile"');
  expect(source).toHaveTextContent("<Profile.Fields />");
  expect(source).not.toHaveTextContent(/Slider|setWidth|setSaved/);
  expect(screen.getByRole("slider", { name: "Form width" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Sample data" }));
  expect(screen.getByRole("region", { name: "Sample data source code" })).toHaveTextContent('"firstName": " Ada "');
});

it("separates responsibilities and installation metadata while preserving the live form", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "06 Multi-page form" }));
  await user.type(screen.getByLabelText("First name"), "Ada");
  await user.click(await screen.findByRole("button", { name: "Actions" }));
  expect(screen.getByRole("region", { name: "Action buttons source code" })).toHaveTextContent("FormContinueButton");
  expect(screen.getByText("@formulate/actions")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Page actions" }));
  expect(screen.getByText("@formulate/navigation")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Layouts" }));
  expect(screen.getByRole("region", { name: "Content & action rows source code" })).toHaveTextContent("function ActionRow");
  await user.click(screen.getByRole("button", { name: "Fields & sections" }));
  await user.click(screen.getByRole("button", { name: "Address" }));
  expect(screen.getByText("Local source · no registry item yet")).toBeInTheDocument();
  expect(screen.getByLabelText("First name")).toHaveValue("Ada");
});
