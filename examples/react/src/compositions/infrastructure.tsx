import { Form, Page } from "@formulate/react";
import { Resource } from "@/declarations/infrastructure";
import { Field } from "@/lib/formulate-config";
import { useInfrastructure } from "@/hooks/use-infrastructure";
import type { InfrastructureProps } from "@/hooks/use-infrastructure";
import { ActionRow, Stack } from "@/components/formulate/layouts";
import { FormNavigationButton, FormSubmitButton } from "@/components/formulate/form-actions";
import { Button } from "@/components/ui/button";

export function InfrastructureForm(props: InfrastructureProps) {
  const flow = useInfrastructure(props);
  return <Form aria-label="Infrastructure request" form={flow.form} onSubmit={flow.submit} onInvalid={flow.correct} getValidationRevision={flow.getValidationRevision}>
    <h2>Infrastructure request</h2>
    <p>Account: {props.accountId}. Save an unfinished draft or preview a plan before provisioning.</p>
    <ActionRow>
      <Button type="button" variant="outline" disabled={flow.draftPending} onClick={() => void flow.draft("save")}>Save draft</Button>
      <Button type="button" variant="outline" disabled={flow.draftPending} onClick={() => void flow.draft("restore")}>Restore draft</Button>
      <FormNavigationButton onClick={() => flow.setPage("configure")}>Configure</FormNavigationButton>
      <FormNavigationButton onClick={() => flow.setPage("review")}>Review</FormNavigationButton>
    </ActionRow>
    <p role="status">{flow.savedCurrent ? "Draft saved" : "Draft has unsaved changes"}{flow.planCurrent ? " · Current plan" : " · New plan required"}</p>
    {flow.feedback ? <p role="status">{flow.feedback}</p> : null}
    <Page id="infrastructure-configure" title="Configure resources" active={flow.page === "configure"} layout={Stack}>
      <Field control={flow.form.control} name="regionId" label="Region" component="select" componentProps={{ options: [{ value: "east", label: "East" }, { value: "west", label: "West" }] }} />
      <div ref={flow.collection} tabIndex={-1} role="group" aria-label="Resources">
        {flow.array.fields.map((item, index) => {
          const request = flow.choices.get(item.resourceId);
          const current = flow.values.resources?.[index];
          return <fieldset key={item.id} className="mb-6 rounded-lg border border-border p-4" data-resource-id={item.resourceId}>
            <legend>Resource {index + 1}</legend>
            <Resource.Bind control={flow.form.control} layout={Stack} bindings={{ name: `resources.${index}.name`, machineSize: `resources.${index}.machineSize` }}>
              <Resource.Field name="name" label={`Resource ${index + 1} name`} />
              <Resource.Field name="machineSize" label={`Resource ${index + 1} size`} componentProps={{ options: request?.getSnapshot().options ?? [] }} />
              <p>Selected size: {current?.machineSize || "None"}</p>
              {request?.getSnapshot().status === "failed" ? <Button type="button" variant="outline" onClick={request.retry}>Retry sizes</Button> : null}
              <ActionRow>
                <Button type="button" variant="outline" disabled={index === 0} onClick={() => { flow.array.move(index, index - 1); flow.correctResource(item.resourceId, "name"); }}>Move up</Button>
                <Button type="button" variant="outline" onClick={() => { flow.array.remove(index); flow.correctResource(item.resourceId, "name"); }}>Remove</Button>
              </ActionRow>
            </Resource.Bind>
          </fieldset>;
        })}
        <Button type="button" variant="outline" onClick={() => {
          const resourceId = crypto.randomUUID();
          flow.array.append({ resourceId, name: "", machineSize: "" }, { shouldFocus: false });
          flow.correctResource(resourceId, "name");
        }}>Add resource</Button>
      </div>
      <FormSubmitButton pendingLabel="Preparing plan…">Preview plan</FormSubmitButton>
    </Page>
    <Page id="infrastructure-review" title="Review infrastructure" active={flow.page === "review"} layout={Stack}>
      <div ref={flow.review} tabIndex={-1} role="group" aria-label="Infrastructure summary">
      <p>Region: {flow.values.regionId || "Required"}</p>
      <ul>{flow.values.resources?.map((item) => <li key={item.resourceId}>
        {item.name || "Unnamed resource"} · {item.machineSize || "Size required"}{" "}
        <FormNavigationButton onClick={() => flow.correctResource(item.resourceId!, "name")}>Edit {item.name || "unnamed resource"}</FormNavigationButton>
      </li>)}</ul>
      <p>{flow.planCurrent ? "The plan matches this configuration." : "Preview a new plan before provisioning."}</p>
      </div>
      <FormSubmitButton>Provision</FormSubmitButton>
    </Page>
  </Form>;
}
