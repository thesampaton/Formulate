import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useWatch } from "react-hook-form";
import { Form, Page, Section, useFormActionStatus, useFormNavigation } from "@formulate/react";
import { z } from "zod";
import { defineForm } from "./formulate";
import { NumberControl } from "./controls";
import { SubmitButton } from "./submit-button";

const RequestSettings = defineForm({
  showAdvanced: {
    schema: z.boolean(),
    defaultValue: false,
    label: "Show advanced options",
    component: "checkbox",
    className: "grid-cols-[18px_1fr] items-center [&>label]:col-start-2",
  },
  retries: {
    schema: z.number({ error: "Enter a retry count." }).int("Use a whole number.").min(0, "Use 0 to 10 retries.").max(10, "Use 0 to 10 retries."),
    defaultValue: 3,
    label: "Retries",
    description: "A whole number from 0 to 10.",
    component: "number",
    componentProps: { min: 0, max: 10, step: 1 },
  },
  timeoutSeconds: {
    schema: z.number({ error: "Enter a timeout." }).positive("Timeout must be greater than zero."),
    defaultValue: 30,
    label: "Timeout (seconds)",
    description: "Any number greater than zero.",
    component: "number",
    componentProps: { step: "any" },
  },
  endpoint: {
    schema: z.url("Enter a valid request URL."),
    defaultValue: "",
    label: "Request URL",
    description: "The destination for requests. This demo does not send a request.",
    component: "input",
    componentProps: { type: "url", placeholder: "https://api.example.com" },
  },
});

type Settings = z.output<typeof RequestSettings.schema>;
export type RequestConfiguration = { configuration: Pick<Settings, "retries" | "timeoutSeconds" | "endpoint"> };

function EditButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const { isPending } = useFormActionStatus();
  return <button type="button" className="secondary" disabled={isPending} onClick={onClick}>{children}</button>;
}

export function AdvancedOptions({ onSave }: { onSave: (payload: RequestConfiguration) => Promise<void> | void }) {
  const form = RequestSettings.useForm({
    shouldFocusError: false,
  });
  const navigation = useFormNavigation<Settings, "settings" | "destination" | "review">({
    form,
    initialPage: "settings",
    destinations: [
      { name: "retries", page: "settings", reveal: () => form.setValue("showAdvanced", true) },
      { name: "timeoutSeconds", page: "settings", reveal: () => form.setValue("showAdvanced", true) },
      { name: "showAdvanced", page: "settings" },
      { name: "endpoint", page: "destination" },
    ],
  });
  const { page } = navigation;
  const [saved, setSaved] = useState<RequestConfiguration | null>(null);
  const reviewHeading = useRef<HTMLDivElement>(null);
  const [showAdvanced, retries, timeoutSeconds, endpoint] = useWatch({
    control: form.control,
    name: ["showAdvanced", "retries", "timeoutSeconds", "endpoint"],
  });

  return (
    <Form form={form}
      navigation={page === "review" ? undefined : {
        id: navigation.revision,
        fields: page === "settings" ? ["showAdvanced", "retries", "timeoutSeconds"] : ["endpoint"],
        onValid: () => {
          if (page === "settings") navigation.goToField("endpoint");
          else navigation.goTo("review", () => reviewHeading.current?.focus());
        },
      }}
      onInvalid={(errors) => {
        if (!navigation.correct(errors)) form.setError("root.submit", { message: "Review the form errors before continuing." });
      }}
      onSubmit={async ({ retries, timeoutSeconds, endpoint }) => {
        const payload = { configuration: { retries, timeoutSeconds, endpoint } };
        setSaved(null);
        await onSave(payload);
        setSaved(payload);
      }}>
      <p className="step-indicator" aria-live="polite">
        Step {page === "settings" ? "1" : page === "destination" ? "2" : "3"} of 3 · {page === "settings" ? "Settings" : page === "destination" ? "Destination" : "Review"}
      </p>
      <Page id="settings" title="Request settings" active={page === "settings"}>
        <p>Start with the defaults, or adjust how requests retry and time out.</p>
        <RequestSettings.Field name="showAdvanced" />
        {showAdvanced ? (
          <Section title="Advanced options" description="These settings still apply when this section is hidden.">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <RequestSettings.Field name="retries" />
              <RequestSettings.Field name="timeoutSeconds">
                <NumberControl step="any" className="tabular-nums" />
              </RequestSettings.Field>
            </div>
          </Section>
        ) : null}
        <SubmitButton pendingLabel="Checking…">Next: destination</SubmitButton>
      </Page>
      <Page id="destination" title="Request destination" active={page === "destination"}>
        <p>Choose where requests will go.</p>
        <RequestSettings.Field name="endpoint" />
        <div className="actions">
          <button type="button" className="secondary" onClick={() => navigation.goToField("showAdvanced")}>Back to settings</button>
          <SubmitButton pendingLabel="Checking…">Review settings</SubmitButton>
        </div>
      </Page>
      <Page id="review" title="Review settings" active={page === "review"}>
        <div ref={reviewHeading} tabIndex={-1} role="group" aria-label="Configuration summary" className="review-summary">
          <p>These values will be used for every request.</p>
          <dl>
            <div><dt>Request URL</dt><dd className="break-all">{endpoint}</dd></div>
            <div><dt>Retries</dt><dd>{retries}</dd></div>
            <div><dt>Timeout</dt><dd>{timeoutSeconds} seconds</dd></div>
          </dl>
        </div>
        <div className="actions">
          <EditButton onClick={() => navigation.goToField("retries")}>Edit retries</EditButton>
          <EditButton onClick={() => navigation.goToField("endpoint")}>Edit destination</EditButton>
          <SubmitButton pendingLabel="Saving…">Save configuration</SubmitButton>
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
