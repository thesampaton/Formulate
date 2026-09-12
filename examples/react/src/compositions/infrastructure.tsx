import { Form, Page } from "@formulate/react";
import { bindResource, Resource } from "@/declarations/infrastructure";
import type { InfrastructureValues } from "@/declarations/infrastructure";
import { Field } from "@/lib/formulate-config";
import { useInfrastructure } from "@/hooks/use-infrastructure";
import type { InfrastructureProps } from "@/hooks/use-infrastructure";
import { Field as FieldContainer, FieldGroup } from "@/components/ui/field";
import { FormNavigationButton, FormSubmitButton } from "@/components/formulate/form-actions";
import { Button } from "@/components/ui/button";

function ResourceFields({ flow, index, resourceId, resourceValues }: {
  flow: ReturnType<typeof useInfrastructure>;
  index: number;
  resourceId: string;
  resourceValues: Partial<InfrastructureValues["resources"][number]> | undefined;
}) {
  const sizeChoices = Resource.useChoice("machineSize");
  return <>
    <Resource.Field name="name" label={`Resource ${index + 1} name`} />
    <Resource.Field name="machineSize" label={`Resource ${index + 1} size`} componentProps={{ options: sizeChoices?.options ?? [] }} />
    <p>Selected size: {resourceValues?.machineSize || "None"}</p>
    {sizeChoices?.status === "failed" ? <FieldContainer orientation="horizontal"><Button type="button" variant="outline" onClick={sizeChoices.retry}>Retry sizes</Button></FieldContainer> : null}
    <FieldContainer orientation="horizontal" className="flex-wrap">
      <Button type="button" variant="outline" disabled={index === 0} onClick={() => {
        flow.resourceArray.move(index, index - 1);
        flow.goToResourceField(resourceId, "name");
      }}>Move up</Button>
      <Button type="button" variant="outline" onClick={() => {
        flow.resourceArray.remove(index);
        flow.goToResourceField(resourceId, "name");
      }}>Remove</Button>
    </FieldContainer>
  </>;
}

export function InfrastructureForm(props: InfrastructureProps) {
  const flow = useInfrastructure(props);
  return <Form aria-label="Infrastructure request" form={flow.form} onSubmit={flow.previewOrProvision} onInvalid={flow.handleInvalid} getValidationRevision={flow.getValidationRevision}>
    <h2>Infrastructure request</h2>
    <p>Account: {props.accountId}. Save an unfinished draft or preview a plan before provisioning.</p>
    <FieldContainer orientation="horizontal" className="flex-wrap">
      <Button type="button" variant="outline" disabled={flow.draftPending} onClick={() => void flow.saveDraft()}>Save draft</Button>
      <Button type="button" variant="outline" disabled={flow.draftPending} onClick={() => void flow.restoreDraft()}>Restore draft</Button>
      <FormNavigationButton onClick={() => flow.goToPage("configure")}>Configure</FormNavigationButton>
      <FormNavigationButton onClick={() => flow.goToPage("review")}>Review</FormNavigationButton>
    </FieldContainer>
    <p role="status">{flow.savedCurrent ? "Draft saved" : "Draft has unsaved changes"}{flow.planCurrent ? " · Current plan" : " · New plan required"}</p>
    {flow.feedback ? <p role="status">{flow.feedback}</p> : null}
    <Page pageId="infrastructure-configure" title="Configure resources" active={flow.page === "configure"} layout={FieldGroup}>
      <Field control={flow.form.control} name="regionId" label="Region" component="select" componentProps={{ options: [{ value: "east", label: "East" }, { value: "west", label: "West" }] }} />
      <div ref={flow.resourceListRef} tabIndex={-1} role="group" aria-label="Resources">
        {flow.resourceArray.fields.map((item, index) => {
          const resource = bindResource(item.resourceId, index);
          const resourceValues = flow.values.resources?.[index];
          return <fieldset key={item.id} className="mb-6 rounded-lg border border-border p-4" data-resource-id={item.resourceId}>
            <legend>Resource {index + 1}</legend>
            <Resource.Bind control={flow.form.control} layout={FieldGroup} binding={resource}>
              <ResourceFields flow={flow} index={index} resourceId={item.resourceId} resourceValues={resourceValues} />
            </Resource.Bind>
          </fieldset>;
        })}
        <Button type="button" variant="outline" onClick={() => {
          const resourceId = crypto.randomUUID();
          flow.resourceArray.append({ resourceId, name: "", machineSize: "" }, { shouldFocus: false });
          flow.goToResourceField(resourceId, "name");
        }}>Add resource</Button>
      </div>
      <FieldContainer orientation="horizontal"><FormSubmitButton pendingLabel="Preparing plan…">Preview plan</FormSubmitButton></FieldContainer>
    </Page>
    <Page pageId="infrastructure-review" title="Review infrastructure" active={flow.page === "review"} layout={FieldGroup}>
      <div ref={flow.reviewHeadingRef} tabIndex={-1} role="group" aria-label="Infrastructure summary">
      <p>Region: {flow.values.regionId || "Required"}</p>
      <ul>{flow.values.resources?.map((item) => <li key={item.resourceId}>
        {item.name || "Unnamed resource"} · {item.machineSize || "Size required"}{" "}
        <FormNavigationButton onClick={() => flow.goToResourceField(item.resourceId!, "name")}>Edit {item.name || "unnamed resource"}</FormNavigationButton>
      </li>)}</ul>
      <p>{flow.planCurrent ? "The plan matches this configuration." : "Preview a new plan before provisioning."}</p>
      </div>
      <FieldContainer orientation="horizontal"><FormSubmitButton>Provision</FormSubmitButton></FieldContainer>
    </Page>
  </Form>;
}
