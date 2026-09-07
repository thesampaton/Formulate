import { useEffect, useRef, useState } from "react";
import type { FieldErrors, FieldPath } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Form, Page, Section, useFormulate } from "@formulate/react";
import { z } from "zod";
import { Field } from "./formulate";
import { NumberControl } from "./controls";

const settingsSchema = z.object({
  showAdvanced: z.boolean(),
  retries: z.number({ error: "Enter a retry count." }).int("Use a whole number.").min(0, "Use 0 to 10 retries.").max(10, "Use 0 to 10 retries."),
  timeoutSeconds: z.number({ error: "Enter a timeout." }).positive("Timeout must be greater than zero."),
});

type Settings = z.output<typeof settingsSchema>;
export type RequestConfiguration = { configuration: Pick<Settings, "retries" | "timeoutSeconds"> };

export function AdvancedOptions({ onSave }: { onSave: (payload: RequestConfiguration) => Promise<void> | void }) {
  const form = useFormulate(settingsSchema, {
    defaultValues: { showAdvanced: false, retries: 3, timeoutSeconds: 30 },
    shouldFocusError: false,
  });
  const [page, setPage] = useState<"settings" | "review">("settings");
  const [focusTarget, setFocusTarget] = useState<FieldPath<Settings> | "heading" | null>(null);
  const [saved, setSaved] = useState<RequestConfiguration | null>(null);
  const reviewHeading = useRef<HTMLDivElement>(null);
  const showAdvanced = useWatch({ control: form.control, name: "showAdvanced" });
  const retries = useWatch({ control: form.control, name: "retries" });
  const timeoutSeconds = useWatch({ control: form.control, name: "timeoutSeconds" });

  // Navigation/reveal commits first; the target editor must exist before focusing.
  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget === "heading") reviewHeading.current?.focus();
    else form.setFocus(focusTarget);
    setFocusTarget(null);
  }, [focusTarget, page, showAdvanced, form.setFocus]);

  function correct(errors: FieldErrors<Settings>) {
    const target = errors.retries ? "retries" : errors.timeoutSeconds ? "timeoutSeconds" : "showAdvanced";
    setPage("settings");
    if (target !== "showAdvanced") form.setValue("showAdvanced", true);
    setFocusTarget(target);
  }

  return (
    <Form form={form} onInvalid={correct} onSubmit={async ({ retries, timeoutSeconds }) => {
      // Enter on the editing page follows the same guard as the Review button.
      if (page === "settings") {
        setPage("review");
        setFocusTarget("heading");
        return;
      }
      const payload = { configuration: { retries, timeoutSeconds } };
      setSaved(null);
      await onSave(payload);
      setSaved(payload);
    }}>
      <p className="step-indicator" aria-live="polite">
        Step {page === "settings" ? "1" : "2"} of 2 · {page === "settings" ? "Settings" : "Review"}
      </p>
      <Page id="settings" title="Request settings" active={page === "settings"}>
        <p>Start with the defaults, or adjust how requests retry and time out.</p>
        <Field control={form.control} name="showAdvanced" label="Show advanced options"
          className="grid-cols-[18px_1fr] items-center [&>label]:col-start-2" component="checkbox" />
        {showAdvanced ? (
          <Section title="Advanced options" description="These settings still apply when this section is hidden.">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field control={form.control} name="retries" label="Retries" description="A whole number from 0 to 10."
                component="number" componentProps={{ min: 0, max: 10, step: 1 }} />
              <Field control={form.control} name="timeoutSeconds" label="Timeout (seconds)" description="Any number greater than zero.">
                <NumberControl step="any" className="tabular-nums" />
              </Field>
            </div>
          </Section>
        ) : null}
        <button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Checking…" : "Review settings"}
        </button>
      </Page>
      <Page id="review" title="Review settings" active={page === "review"}>
        <div ref={reviewHeading} tabIndex={-1} role="group" aria-label="Configuration summary" className="review-summary">
          <p>These values will be used for every request.</p>
          <dl>
            <div><dt>Retries</dt><dd>{retries}</dd></div>
            <div><dt>Timeout</dt><dd>{timeoutSeconds} seconds</dd></div>
          </dl>
        </div>
        <div className="actions">
          <button type="button" className="secondary" disabled={form.formState.isSubmitting} onClick={() => {
            setPage("settings");
            setFocusTarget("showAdvanced");
          }}>Back to settings</button>
          <button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving…" : "Save configuration"}
          </button>
        </div>
      </Page>
      {saved ? (
        <div role="status" className="result">
          <p>Demo save accepted. Last submitted payload:</p>
          <pre>{JSON.stringify(saved, null, 2)}</pre>
        </div>
      ) : null}
    </Form>
  );
}
