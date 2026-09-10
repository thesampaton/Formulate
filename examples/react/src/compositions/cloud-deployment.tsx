import { Page } from "@formulate/react";
import { CloudDeployment, DeploymentTarget } from "@/declarations/cloud-deployment";
import { useCloudDeployment } from "@/hooks/use-cloud-deployment";
import type { CloudFormProps } from "@/hooks/use-cloud-deployment";
import type { ChoiceRequest } from "@/lib/choice-request";
import { Stack, ActionRow } from "@/components/formulate/layouts";
import { FormContinueButton, FormNavigationButton, FormSubmitButton } from "@/components/formulate/form-actions";
import { Button } from "@/components/ui/button";

function TargetFields({ title, request }: { title: string; request?: ChoiceRequest }) {
  const account = DeploymentTarget.useWatch("accountId");
  const region = DeploymentTarget.useWatch("regionId");
  const snapshot = request?.getSnapshot();
  return <Stack>
    <DeploymentTarget.Field name="accountId" label={`${title} account`} />
    <DeploymentTarget.Field name="regionId" label={`${title} region`} componentProps={{ options: snapshot?.input === account ? snapshot.options : [] }} />
    {region ? <p>Retained selection: {region}</p> : null}
    <p role="status">{title}: {request ? request.problem(account, region) ?? "Ready" : "Checking available choices…"}</p>
    {snapshot?.status === "failed" ? <Button type="button" variant="outline" onClick={request?.retry}>Retry {title.toLowerCase()} regions</Button> : null}
  </Stack>;
}

export function CloudDeploymentForm(props: CloudFormProps) {
  const flow = useCloudDeployment(props);
  return <CloudDeployment.Form aria-label="Cloud deployment" form={flow.form} navigation={flow.step}
    getValidationRevision={flow.getValidationRevision} onSubmit={props.onDeploy} onInvalid={flow.navigation.correct}>
    <h2>Cloud deployment</h2>
    <p>Choose two deployment targets. Production details are kept when you switch to development.</p>
    <CloudDeployment.Field name="environment" />
    <ActionRow>
      <FormNavigationButton onClick={() => flow.goTo("targets")}>Targets</FormNavigationButton>
      <FormNavigationButton disabled={flow.values.environment !== "production"} onClick={() => flow.goTo("production")}>Production</FormNavigationButton>
      <FormNavigationButton onClick={() => flow.goTo("review")}>Review</FormNavigationButton>
    </ActionRow>
    {flow.notice ? <p role="status">{flow.notice}</p> : null}
    <Page id="deployment-targets" title="Targets" active={flow.navigation.page === "targets"} layout={Stack}>
      <div ref={flow.targetsHeading} tabIndex={-1} role="group" aria-label="Deployment targets">
        <CloudDeployment.Section name="primary"><TargetFields title="Primary" request={flow.choices.get("primary")} /></CloudDeployment.Section>
        <CloudDeployment.Section name="recovery"><TargetFields title="Recovery" request={flow.choices.get("recovery")} /></CloudDeployment.Section>
      </div>
      <FormContinueButton>Continue</FormContinueButton>
    </Page>
    <Page id="deployment-production" title="Production configuration" active={flow.navigation.page === "production" && flow.values.environment === "production"} layout={Stack}>
      <CloudDeployment.Field name="production" />
      <ActionRow><FormNavigationButton onClick={() => flow.goTo("targets")}>Back</FormNavigationButton><FormContinueButton>Continue</FormContinueButton></ActionRow>
    </Page>
    <Page id="deployment-review" title="Review deployment" active={flow.navigation.page === "review"} layout={Stack}>
      <div ref={flow.review} tabIndex={-1} role="group" aria-label="Deployment summary">
        <p>Environment: {flow.values.environment}</p>
        <p>Primary: {flow.values.primary?.accountId} / {flow.values.primary?.regionId}</p>
        <p>Recovery: {flow.values.recovery?.accountId} / {flow.values.recovery?.regionId}</p>
        {flow.values.environment === "production" ? <p>Production change: {flow.values.production || "Required"}</p> : null}
        <p>Primary: {flow.choices.get("primary")?.problem(flow.form.getValues("primary.accountId"), flow.form.getValues("primary.regionId")) ?? "Ready"}</p>
        <p>Recovery: {flow.choices.get("recovery")?.problem(flow.form.getValues("recovery.accountId"), flow.form.getValues("recovery.regionId")) ?? "Ready"}</p>
      </div>
      <ActionRow><FormNavigationButton onClick={() => flow.goTo("targets")}>Edit targets</FormNavigationButton><FormSubmitButton>Deploy</FormSubmitButton></ActionRow>
    </Page>
  </CloudDeployment.Form>;
}
