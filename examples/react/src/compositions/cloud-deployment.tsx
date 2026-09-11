import { Page } from "@formulate/react";
import { CloudDeployment, DeploymentTarget } from "@/declarations/cloud-deployment";
import { useCloudDeployment } from "@/hooks/use-cloud-deployment";
import type { CloudFormProps } from "@/hooks/use-cloud-deployment";
import { Stack, ActionRow } from "@/components/formulate/layouts";
import { FormContinueButton, FormNavigationButton, FormSubmitButton } from "@/components/formulate/form-actions";
import { Button } from "@/components/ui/button";

function TargetFields({ title }: { title: string }) {
  const region = DeploymentTarget.useWatch("regionId");
  const regionChoices = DeploymentTarget.useChoice("regionId");

  return <Stack>
    <DeploymentTarget.Field name="accountId" label={`${title} account`} />
    <DeploymentTarget.Field name="regionId" label={`${title} region`} componentProps={{ options: regionChoices?.options ?? [] }} />
    {region ? <p>Retained selection: {region}</p> : null}
    <p role="status">{title}: {regionChoices ? regionChoices.validationMessage ?? "Ready" : "Checking available choices…"}</p>
    {regionChoices?.status === "failed" ? <Button type="button" variant="outline" onClick={regionChoices?.retry}>Retry {title.toLowerCase()} regions</Button> : null}
  </Stack>;
}

function TargetStatus({ title }: { title: string }) {
  const regionChoices = DeploymentTarget.useChoice("regionId");
  return <p>{title}: {regionChoices?.validationMessage ?? "Ready"}</p>;
}

export function CloudDeploymentForm(props: CloudFormProps) {
  const flow = useCloudDeployment(props);
  return <CloudDeployment.Form aria-label="Cloud deployment" form={flow.form} scopedAction={flow.scopedAction}
    onSubmit={props.onDeploy} onInvalid={flow.navigation.goToFirstError}>
    <h2>Cloud deployment</h2>
    <p>Choose two deployment targets. Production details are kept when you switch to development.</p>
    <CloudDeployment.Field name="environment" />
    <ActionRow>
      <FormNavigationButton onClick={() => flow.goToPage("targets")}>Targets</FormNavigationButton>
      <FormNavigationButton disabled={flow.values.environment !== "production"} onClick={() => flow.goToPage("production")}>Production</FormNavigationButton>
      <FormNavigationButton onClick={() => flow.goToPage("review")}>Review</FormNavigationButton>
    </ActionRow>
    {flow.notice ? <p role="status">{flow.notice}</p> : null}
    <Page pageId="deployment-targets" title="Targets" active={flow.navigation.page === "targets"} layout={Stack}>
      <div ref={flow.targetsHeadingRef} tabIndex={-1} role="group" aria-label="Deployment targets">
        <flow.primary.Section><TargetFields title="Primary" /></flow.primary.Section>
        <flow.recovery.Section><TargetFields title="Recovery" /></flow.recovery.Section>
      </div>
      <FormContinueButton>Continue</FormContinueButton>
    </Page>
    <Page pageId="deployment-production" title="Production configuration" active={flow.navigation.page === "production" && flow.values.environment === "production"} layout={Stack}>
      <CloudDeployment.Field name="production" />
      <ActionRow><FormNavigationButton onClick={() => flow.goToPage("targets")}>Back</FormNavigationButton><FormContinueButton>Continue</FormContinueButton></ActionRow>
    </Page>
    <Page pageId="deployment-review" title="Review deployment" active={flow.navigation.page === "review"} layout={Stack}>
      <div ref={flow.reviewHeadingRef} tabIndex={-1} role="group" aria-label="Deployment summary">
        <p>Environment: {flow.values.environment}</p>
        <p>Primary: {flow.values.primary?.accountId} / {flow.values.primary?.regionId}</p>
        <p>Recovery: {flow.values.recovery?.accountId} / {flow.values.recovery?.regionId}</p>
        {flow.values.environment === "production" ? <p>Production change: {flow.values.production || "Required"}</p> : null}
        <flow.primary.Section><TargetStatus title="Primary" /></flow.primary.Section>
        <flow.recovery.Section><TargetStatus title="Recovery" /></flow.recovery.Section>
      </div>
      <ActionRow><FormNavigationButton onClick={() => flow.goToPage("targets")}>Edit targets</FormNavigationButton><FormSubmitButton>Deploy</FormSubmitButton></ActionRow>
    </Page>
  </CloudDeployment.Form>;
}
