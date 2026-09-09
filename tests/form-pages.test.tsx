import { Form } from "@formulate/react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { FormTabs, FormTabPage, useFormPage } from "../examples/react/src/components/formulate/form-tabs";
import { FormStepLayout } from "../examples/react/src/components/formulate/form-page-layouts";

function TestForm({ children }: { children: ReactNode }) {
  const form = useForm({ defaultValues: {} });
  return <Form form={form} onSubmit={() => undefined}>{children}</Form>;
}

function CompactLayout({ children }: { children?: ReactNode }) {
  const { current } = useFormPage();
  return <div data-testid="compact"><p>Compact {current.label}</p>{children}</div>;
}

it("inherits a stable page layout and supports local layout and action overrides", async () => {
  function Example() {
    const [page, setPage] = useState<"first" | "second" | "third">("first");
    const [custom, setCustom] = useState(false);
    return <>
      <button type="button" onClick={() => setCustom(!custom)}>Change footer</button>
      <FormTabs value={page} onValueChange={setPage} label="Example pages" pageLayout={FormStepLayout}
        pages={[{ id: "first", label: "First", status: "incomplete" }, { id: "second", label: "Second", status: "incomplete" }, { id: "third", label: "Third", status: "incomplete" }]}>
        <FormTabPage value="first" title="First page" actions={custom ? <button type="button">Custom action</button> : undefined}>
          <input aria-label="Draft" defaultValue="" />
        </FormTabPage>
        <FormTabPage value="second" title="Second page" layout={CompactLayout}><p>Second content</p></FormTabPage>
        <FormTabPage value="third" title="Third page" layout={null}><p>Third content</p></FormTabPage>
      </FormTabs>
    </>;
  }
  const user = userEvent.setup();
  render(<TestForm><Example /></TestForm>);
  const draft = screen.getByLabelText("Draft");
  await user.type(draft, "Keep this");
  expect(screen.getByRole("button", { name: "Continue to second" })).toHaveAttribute("type", "submit");
  await user.click(screen.getByRole("button", { name: "Change footer" }));
  expect(screen.queryByRole("button", { name: "Continue to second" })).toBeNull();
  expect(screen.getByRole("button", { name: "Custom action" })).toBeInTheDocument();
  expect(screen.getByLabelText("Draft")).toBe(draft);
  expect(draft).toHaveValue("Keep this");
  await user.click(screen.getByRole("tab", { name: "Second: Incomplete" }));
  expect(screen.getByTestId("compact")).toHaveTextContent("Compact Second");
  expect(within(screen.getByRole("tabpanel")).queryByRole("button")).toBeNull();
  await user.click(screen.getByRole("tab", { name: "Third: Incomplete" }));
  const third = screen.getByRole("region", { name: "Third page" });
  expect(third.querySelector('[data-slot="field-group"]')).toBeNull();
  expect(within(third).queryByRole("button")).toBeNull();
});

it("derives Back from available page order and uses the parent's focus navigation callback", async () => {
  const navigate = vi.fn();
  const select = vi.fn();
  render(<TestForm><FormTabs value="review" onValueChange={select} onNavigate={navigate} label="Ordered pages" pageLayout={FormStepLayout}
    pages={[{ id: "details", label: "Details", status: "complete" }, { id: "skipped", label: "Skipped", status: "incomplete", disabled: true }, { id: "review", label: "Review", status: "ready" }]}>
    <FormTabPage value="review" title="Review"><p>Ready</p></FormTabPage>
  </FormTabs></TestForm>);
  const user = userEvent.setup();
  expect(screen.getByRole("tab", { name: "Skipped: Incomplete" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Back to details" }));
  expect(navigate).toHaveBeenCalledWith("details");
  expect(select).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Submit" })).toHaveAttribute("type", "submit");
});
