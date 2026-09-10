import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { Form } from "@formulate/react";
import { useChoiceForm } from "../examples/react/src/hooks/use-choice-form";
import type { ChoiceLoader } from "../examples/react/src/lib/choice-request";

it("cancels a pending submit when the choice service is replaced even if its input, options and revision count match", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const schema = z.object({ region: z.string() }).superRefine(async () => { await gate; });
  const fields = () => [{ id: "region", name: "region" as const, input: "A" }];
  const options = [{ value: "east", label: "East" }];
  const first: ChoiceLoader = async () => options;
  const replacement: ChoiceLoader = async () => options;
  const onSubmit = vi.fn();
  function Harness({ loader }: { loader: ChoiceLoader }) {
    const flow = useChoiceForm({ schema, fields, loader, defaultValues: { region: "east" } });
    return <Form form={flow.form} onSubmit={onSubmit} getValidationRevision={flow.getValidationRevision}>
      <p>{flow.choices.get("region")?.getSnapshot().status}</p><button type="submit">Deploy</button>
    </Form>;
  }
  const view = render(<StrictMode><Harness loader={first} /></StrictMode>);
  await screen.findByText("ready");
  fireEvent.submit(screen.getByRole("button", { name: "Deploy" }).closest("form")!);
  expect(screen.getByRole("button", { name: "Deploy" }).closest("form")).toHaveAttribute("aria-busy", "true");
  view.rerender(<StrictMode><Harness loader={replacement} /></StrictMode>);
  await screen.findByText("ready");
  await act(async () => release());
  expect(onSubmit).not.toHaveBeenCalled();
  fireEvent.submit(screen.getByRole("button", { name: "Deploy" }).closest("form")!);
  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ region: "east" }, expect.anything()));
});
