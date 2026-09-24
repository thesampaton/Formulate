import { Form, GraphRenderer, Page } from "@formulate/react";
import { CloudDeployment, DeploymentTarget } from "@/declarations/cloud-deployment";
import { useCloudDeployment } from "@/hooks/use-cloud-deployment";
import type { CloudFormProps } from "@/hooks/use-cloud-deployment";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormContinueButton, FormNavigationButton, FormSubmitButton } from "@/components/formulate/form-actions";
import { Button } from "@/components/ui/button";

function RegionField({ title, statusMessage }: { title: string; statusMessage?: string }) {
  const region = DeploymentTarget.useWatch("regionId");
  const regionChoices = DeploymentTarget.useChoice("regionId");

  return <FieldGroup>
    <DeploymentTarget.Field name="regionId" label={`${title} region`} componentProps={{ options: regionChoices?.options ?? [] }} />
    {region ? <p>Retained selection: {region}</p> : null}
    <p role="status">{title}: {statusMessage ?? regionChoices?.validationMessage ?? "Ready"}</p>
    {regionChoices?.status === "failed" ? <Field orientation="horizontal"><Button type="button" variant="outline" onClick={regionChoices?.retry}>Retry {title.toLowerCase()} regions</Button></Field> : null}
  </FieldGroup>;
}

function TargetStatus({ title, statusMessage }: { title: string; statusMessage?: string }) {
  const regionChoices = DeploymentTarget.useChoice("regionId");
  return <p>{title}: {statusMessage ?? regionChoices?.validationMessage ?? "Ready"}</p>;
}

export function CloudDeploymentForm(props: CloudFormProps) {
  const flow = useCloudDeployment(props);
  return <Form aria-label="Cloud deployment" form={flow.form} scopedAction={flow.scopedAction}
    onSubmit={props.onDeploy} onInvalid={flow.navigation.goToFirstError}>
    <h2>Cloud deployment</h2>
    <p>Choose two deployment targets. Production details are kept when you switch to development.</p>
    <CloudDeployment.Field name="environment" />
    <Field orientation="horizontal" className="flex-wrap">
      <FormNavigationButton onClick={() => flow.goToPage("targets")}>Targets</FormNavigationButton>
      <FormNavigationButton disabled={!flow.productionApplicable} onClick={() => flow.goToPage("production")}>Production</FormNavigationButton>
      <FormNavigationButton onClick={() => flow.goToPage("review")}>Review</FormNavigationButton>
    </Field>
    {flow.notice ? <p role="status">{flow.notice}</p> : null}
    <Page pageId="deployment-targets" title="Targets" active={flow.navigation.page === "targets"} layout={FieldGroup}>
      <div ref={flow.targetsHeadingRef} tabIndex={-1} role="group" aria-label="Deployment targets">
        <GraphRenderer graph={flow.graph} inspection={flow.form.inspection} rootId="targets"
          renderField={(node) => {
            if (node.bind === "resourceName") return <CloudDeployment.Field name="resourceName" />;
            const title = node.bind?.startsWith("primary.") ? "Primary" : "Recovery";
            return node.bind?.endsWith("accountId")
              ? <DeploymentTarget.Field name="accountId" label={`${title} account`} />
              : <RegionField title={title} statusMessage={flow.form.inspection.nodes[node.id]?.issues[0]} />;
          }}
          renderContainer={(node, children) => node.id === "primary"
            ? <flow.primary.Section>{children}</flow.primary.Section>
            : node.id === "recovery" ? <flow.recovery.Section>{children}</flow.recovery.Section> : children} />
      </div>
      <Field orientation="horizontal"><FormContinueButton>Continue</FormContinueButton></Field>
    </Page>
    <Page pageId="deployment-production" title="Production configuration" active={flow.navigation.page === "production" && flow.productionApplicable} layout={FieldGroup}>
      <GraphRenderer graph={flow.graph} inspection={flow.form.inspection} rootId="production-page" renderField={() => <CloudDeployment.Field name="production" />} />
      <Field orientation="horizontal" className="flex-wrap"><FormNavigationButton onClick={() => flow.goToPage("targets")}>Back</FormNavigationButton><FormContinueButton>Continue</FormContinueButton></Field>
    </Page>
    <Page pageId="deployment-review" title="Review deployment" active={flow.navigation.page === "review"} layout={FieldGroup}>
      <div ref={flow.reviewHeadingRef} tabIndex={-1} role="group" aria-label="Deployment summary">
        <p>Environment: {flow.values.environment}</p>
        <p>Primary: {flow.values.primary?.accountId} / {flow.values.primary?.regionId}</p>
        <p>Recovery: {flow.values.recovery?.accountId} / {flow.values.recovery?.regionId}</p>
        {flow.productionApplicable ? <p>Production change: {flow.values.production || "Required"}</p> : null}
        <flow.primary.Section><TargetStatus title="Primary" statusMessage={flow.form.inspection.nodes["primary.regionId"]?.issues[0]} /></flow.primary.Section>
        <flow.recovery.Section><TargetStatus title="Recovery" statusMessage={flow.form.inspection.nodes["recovery.regionId"]?.issues[0]} /></flow.recovery.Section>
      </div>
      <Field orientation="horizontal" className="flex-wrap"><FormNavigationButton onClick={() => flow.goToPage("targets")}>Edit targets</FormNavigationButton><FormSubmitButton>Deploy</FormSubmitButton></Field>
    </Page>
  </Form>;
}
