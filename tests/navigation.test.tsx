import { StrictMode, useRef, useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { Field, Form, Page, useFormNavigation, useFormulate } from "@formulate/react";
import { FormSubmitButton } from "../examples/react/src/components/formulate/form-actions";

const schema = z.object({
  first: z.object({ value: z.string().min(1, "First value is required.") }),
  second: z.string().min(1, "Second value is required."),
});
type Values = z.input<typeof schema>;

function Harness({ validation = schema, onSubmit = vi.fn(), onInvalid = vi.fn(), initialFirst = "valid", initialSecond = "", getValidationRevision }: {
  validation?: z.ZodType<Values, Values>;
  onSubmit?: (values: Values) => Promise<void> | void;
  onInvalid?: () => void;
  initialFirst?: string;
  initialSecond?: string;
  getValidationRevision?: () => string | number;
}) {
  const form = useFormulate(validation, {
    mode: "onSubmit", shouldFocusError: false,
    defaultValues: { first: { value: initialFirst }, second: initialSecond },
  });
  const [shown, setShown] = useState(true);
  const summary = useRef<HTMLDivElement>(null);
  const navigation = useFormNavigation<Values, "first" | "second" | "review">({
    form, initialPage: "first",
    destinations: [
      { name: "first.value", page: "first", reveal: () => setShown(true) },
      { name: "second", page: "second" },
    ],
  });
  return <Form form={form} onSubmit={onSubmit} getValidationRevision={getValidationRevision}
    navigation={navigation.page === "review" ? undefined : {
      id: navigation.revision,
      // An object path scopes its descendant errors; correction uses the leaf editor.
      fields: navigation.page === "first" ? ["first"] : ["second"],
      onValid: () => {
        if (navigation.page === "first") navigation.goToField("second");
        else navigation.goTo("review", () => summary.current?.focus());
      },
    }}
    onInvalid={(errors) => {
      onInvalid();
      if (!navigation.correct(errors)) form.setError("root.submit", { message: "No correction destination is available." });
    }}>
    <Page id="first" title="First page" active={navigation.page === "first"}>
      {shown ? <Field control={form.control} name="first.value" label="First value" component="input" /> : null}
      <button type="button" onClick={() => setShown(false)}>Hide first editor</button>
      <FormSubmitButton pendingLabel="Checking…">Next</FormSubmitButton>
    </Page>
    <Page id="second" title="Second page" active={navigation.page === "second"}>
      <Field control={form.control} name="second" label="Second value" component="input" />
      <FormSubmitButton pendingLabel="Checking…">Review</FormSubmitButton>
    </Page>
    <Page id="review" title="Review page" active={navigation.page === "review"}>
      <div ref={summary} role="group" aria-label="Summary" tabIndex={-1}>Ready to save</div>
      <FormSubmitButton pendingLabel="Saving…">Save</FormSubmitButton>
    </Page>
    <button type="button" onClick={() => navigation.goTo("first")}>Return to first</button>
    <button type="button" onClick={() => navigation.goTo("review")}>Jump to review</button>
    <button type="button" onClick={() => form.setValue("first.value", "")}>Invalidate first</button>
    <button type="button" onClick={() => form.reset()}>Reset values</button>
    <button type="button" onClick={() => {
      navigation.goToField("first.value");
      navigation.goTo("review");
    }}>Replace correction</button>
  </Form>;
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

it("scopes Next to one page, revalidates all pages on Save, and routes nested errors to their revealed editor", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<StrictMode><Harness onSubmit={onSubmit} /></StrictMode>);
  await user.click(screen.getByRole("button", { name: "Hide first editor" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  const second = await screen.findByLabelText("Second value");
  expect(second).toHaveFocus();
  expect(second).not.toHaveAttribute("aria-invalid", "true");
  await user.click(screen.getByRole("button", { name: "Review" }));
  expect(second).toHaveAccessibleDescription("Second value is required.");
  expect(onSubmit).not.toHaveBeenCalled();
  await user.type(second, "ready{Enter}");
  expect(await screen.findByRole("group", { name: "Summary" })).toHaveFocus();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Invalidate first" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  const first = await screen.findByLabelText("First value");
  await waitFor(() => expect(first).toHaveFocus());
  expect(first).toHaveAccessibleDescription("First value is required.");
  expect(onSubmit).not.toHaveBeenCalled();
  await user.type(first, "fixed{Enter}");
  expect(await screen.findByLabelText("Second value")).toHaveValue("ready");
  await user.click(screen.getByRole("button", { name: "Review" }));
  await user.click(await screen.findByRole("button", { name: "Save" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0]?.[0]).toEqual({ first: { value: "fixed" }, second: "ready" });
});

it("runs a cross-page rule at final submission and reports unmapped errors without guessing a field", async () => {
  const user = userEvent.setup();
  const validation = schema.refine(({ first, second }) => first.value !== second, {
    message: "Values must differ.",
  });
  const onSubmit = vi.fn();
  render(<Harness validation={validation} onSubmit={onSubmit} />);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(await screen.findByLabelText("Second value"), "valid{Enter}");
  await user.click(await screen.findByRole("button", { name: "Save" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No correction destination is available.");
  expect(screen.getByRole("heading", { name: "Review page" })).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

it("replaces an earlier focus request when navigation happens again before commit", async () => {
  const user = userEvent.setup();
  render(<StrictMode><Harness /></StrictMode>);
  await user.click(screen.getByRole("button", { name: "Hide first editor" }));
  await user.click(screen.getByRole("button", { name: "Replace correction" }));
  expect(screen.getByRole("heading", { name: "Review page" })).toBeInTheDocument();
  expect(screen.queryByLabelText("First value")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Replace correction" })).toHaveFocus();
});

it("assigns a cross-page rule to its correction field and checks it again at final submission", async () => {
  const user = userEvent.setup();
  const validation = schema.refine(({ first, second }) => first.value !== second, {
    path: ["first", "value"], message: "Choose different values.",
  });
  const onSubmit = vi.fn();
  render(<Harness validation={validation} onSubmit={onSubmit} />);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(await screen.findByLabelText("Second value"), "valid{Enter}");
  await user.click(await screen.findByRole("button", { name: "Save" }));
  const first = await screen.findByLabelText("First value");
  expect(first).toHaveFocus();
  expect(first).toHaveAccessibleDescription("Choose different values.");
  expect(onSubmit).not.toHaveBeenCalled();
});

it.each(["navigate", "edit", "reset", "unmount"] as const)("ignores a pending navigation result after %s and blocks duplicate checks", async (cancel) => {
  const gate = deferred();
  const check = vi.fn(async () => { await gate.promise; });
  const validation = schema.superRefine(check);
  const onInvalid = vi.fn();
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  const { unmount } = render(<Harness validation={validation} onInvalid={onInvalid} onSubmit={onSubmit} />);
  const form = screen.getByRole("button", { name: "Next" }).closest("form")!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => expect(check).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("button", { name: "Checking…" })).toBeDisabled();
  expect(form).toHaveAttribute("aria-busy", "true");
  if (cancel === "navigate") await user.click(screen.getByRole("button", { name: "Return to first" }));
  if (cancel === "edit") await user.type(screen.getByLabelText("First value"), "-new");
  if (cancel === "reset") await user.click(screen.getByRole("button", { name: "Reset values" }));
  if (cancel === "unmount") unmount();
  await act(async () => { gate.resolve(); await gate.promise; });
  expect(onInvalid).not.toHaveBeenCalled();
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.queryByLabelText("Second value")).not.toBeInTheDocument();
  if (cancel !== "unmount") {
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByLabelText("Second value")).toHaveFocus();
  }
});

it("does not reveal an editor for a stale invalid result after the user leaves", async () => {
  const gate = deferred();
  const check = vi.fn(async () => { await gate.promise; });
  const user = userEvent.setup();
  const onInvalid = vi.fn();
  render(<Harness validation={schema.superRefine(check)} onInvalid={onInvalid} initialFirst="" />);
  await user.click(screen.getByRole("button", { name: "Hide first editor" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(check).toHaveBeenCalledTimes(1));
  await user.click(screen.getByRole("button", { name: "Jump to review" }));
  await act(async () => { gate.resolve(); await gate.promise; });
  expect(onInvalid).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "Review page" })).toBeInTheDocument();
  expect(screen.queryByLabelText("First value")).not.toBeInTheDocument();
});

it("cancels final validation before calling the application when the page changes", async () => {
  const gate = deferred();
  const check = vi.fn(async () => { await gate.promise; });
  const onSubmit = vi.fn();
  const onInvalid = vi.fn();
  const user = userEvent.setup();
  render(<Harness validation={schema.superRefine(check)} onSubmit={onSubmit} onInvalid={onInvalid} initialSecond="ready" />);
  await user.click(screen.getByRole("button", { name: "Jump to review" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(check).toHaveBeenCalledTimes(1));
  await user.click(screen.getByRole("button", { name: "Return to first" }));
  await act(async () => { gate.resolve(); await gate.promise; });
  expect(onSubmit).not.toHaveBeenCalled();
  expect(onInvalid).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "First page" })).toBeInTheDocument();
});

it("releases pending state after a thrown check and allows navigation retry", async () => {
  let fail = true;
  const validation = schema.superRefine(async () => {
    if (fail) { fail = false; throw new Error("Private validation service detail"); }
  });
  const user = userEvent.setup();
  render(<Harness validation={validation} />);
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to submit. Please try again.");
  expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(await screen.findByLabelText("Second value")).toHaveFocus();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("suppresses a validation exception from an attempt invalidated by a newer edit", async () => {
  const gate = deferred();
  const check = vi.fn(async () => { await gate.promise; throw new Error("Stale validation failure"); });
  const user = userEvent.setup();
  render(<Harness validation={schema.superRefine(check)} />);
  await user.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(check).toHaveBeenCalledTimes(1));
  await user.type(screen.getByLabelText("First value"), "-new");
  await act(async () => { gate.resolve(); await gate.promise; });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
});

it.each([
  ["scope", "valid"], ["scope", "invalid"], ["scope", "throw"],
  ["final", "valid"], ["final", "invalid"], ["final", "throw"],
] as const)("cancels a %s %s check when external evidence changes without a render, then permits retry", async (action, outcome) => {
  const gate = deferred();
  let revision = 0;
  let obsolete = true;
  const check = vi.fn(async (_, context: z.RefinementCtx) => {
    if (obsolete && outcome === "invalid") context.addIssue({ code: "custom", path: ["first", "value"], message: "Old evidence" });
    await gate.promise;
    if (obsolete && outcome === "throw") throw new Error("Old service failure");
  });
  const onSubmit = vi.fn();
  const onInvalid = vi.fn();
  const user = userEvent.setup();
  render(<Harness validation={schema.superRefine(check)} initialSecond="ready"
    onSubmit={onSubmit} onInvalid={onInvalid} getValidationRevision={() => revision} />);
  if (action === "final") await user.click(screen.getByRole("button", { name: "Jump to review" }));
  fireEvent.submit(screen.getByRole("button", { name: action === "final" ? "Save" : "Next" }).closest("form")!);
  await waitFor(() => expect(check).toHaveBeenCalledTimes(1));
  // A → B → A can have identical data and still be a different evidence lifetime.
  revision += 2;
  await act(async () => gate.resolve());
  expect(onSubmit).not.toHaveBeenCalled();
  expect(onInvalid).not.toHaveBeenCalled();
  // RHF may publish old field errors; cancellation suppresses coordination and submission errors.
  expect(screen.queryByText("Unable to submit. Please try again.")).toBeNull();
  expect(screen.queryByLabelText("Second value")).toBeNull();
  obsolete = false;
  await user.click(screen.getByRole("button", { name: action === "final" ? "Save" : "Next" }));
  if (action === "final") await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  else expect(await screen.findByLabelText("Second value")).toHaveFocus();
});
