import { RequestSettings } from "@/declarations/request-settings";
import type { Settings, RequestConfiguration } from "@/declarations/request-settings";
import { Stack, Row, ActionRow } from "@/components/formulate/layouts";
import { useRef } from "react";
import { useWatch } from "react-hook-form";
import { Page, Section, useFormNavigation } from "@formulate/react";
import { NumberControl } from "@/components/formulate/controls";
import { FormContinueButton, FormNavigationButton, FormSubmitButton } from "@/components/formulate/form-actions";

export function RequestSettingsForm({ onSave }: { onSave: (payload: RequestConfiguration) => Promise<void> | void }) {
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
  const reviewHeadingRef = useRef<HTMLDivElement>(null);
  const [showAdvanced, retries, timeoutSeconds, endpoint] = useWatch({
    control: form.control,
    name: ["showAdvanced", "retries", "timeoutSeconds", "endpoint"],
  });

  return (
    <RequestSettings.Form form={form}
      scopedAction={page === "review" ? undefined : {
        id: navigation.revision,
        errorPaths: page === "settings" ? ["showAdvanced", "retries", "timeoutSeconds"] : ["endpoint"],
        onValid: () => {
          if (page === "settings") navigation.goToField("endpoint");
          else navigation.goToPage("review", () => reviewHeadingRef.current?.focus());
        },
      }}
      onInvalid={(errors) => {
        if (!navigation.goToFirstError(errors)) form.setError("root.submit", { message: "Review the form errors before continuing." });
      }}
      onSubmit={({ retries, timeoutSeconds, endpoint }) => onSave({ configuration: { retries, timeoutSeconds, endpoint } })}>
      <p className="step-indicator" aria-live="polite">
        Step {page === "settings" ? "1" : page === "destination" ? "2" : "3"} of 3 · {page === "settings" ? "Settings" : page === "destination" ? "Destination" : "Review"}
      </p>
      <Page layout={Stack} pageId="settings" title="Request settings" active={page === "settings"}>
        <p>Start with the defaults, or adjust how requests retry and time out.</p>
        <RequestSettings.Field name="showAdvanced" />
        {showAdvanced ? (
          <Section layout={Stack} title="Advanced options" description="These settings still apply when this section is hidden.">
            <Row>
              <RequestSettings.Field name="retries" />
              <RequestSettings.Field name="timeoutSeconds">
                <NumberControl step="any" className="tabular-nums" />
              </RequestSettings.Field>
            </Row>
          </Section>
        ) : null}
        <FormContinueButton>Next: destination</FormContinueButton>
      </Page>
      <Page layout={Stack} pageId="destination" title="Request destination" active={page === "destination"}>
        <p>Choose where requests will go.</p>
        <RequestSettings.Field name="endpoint" />
        <ActionRow>
          <FormNavigationButton onClick={() => navigation.goToField("showAdvanced")}>Back to settings</FormNavigationButton>
          <FormContinueButton>Review settings</FormContinueButton>
        </ActionRow>
      </Page>
      <Page layout={Stack} pageId="review" title="Review settings" active={page === "review"}>
        <div ref={reviewHeadingRef} tabIndex={-1} role="group" aria-label="Configuration summary" className="review-summary">
          <p>These values will be used for every request.</p>
          <dl>
            <div><dt>Request URL</dt><dd className="break-all">{endpoint}</dd></div>
            <div><dt>Retries</dt><dd>{retries}</dd></div>
            <div><dt>Timeout</dt><dd>{timeoutSeconds} seconds</dd></div>
          </dl>
        </div>
        <ActionRow>
          <FormNavigationButton onClick={() => navigation.goToField("retries")}>Edit retries</FormNavigationButton>
          <FormNavigationButton onClick={() => navigation.goToField("endpoint")}>Edit destination</FormNavigationButton>
          <FormSubmitButton pendingLabel="Saving…">Save configuration</FormSubmitButton>
        </ActionRow>
      </Page>
    </RequestSettings.Form>
  );
}
