import { useState } from "react";
import { useWatch } from "react-hook-form";
import { ComposedValues, type ComposedValuesOutput } from "@/declarations/composed-values";
import { Section } from "@/lib/formulate";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { FormSubmitButton } from "@/components/formulate/form-actions";
import { exampleData } from "@/data/example-data";

const contexts = {
  acme: { organization: { slug: "acme" } },
  globex: { organization: { slug: "globex" } },
};

export function ComposedValuesForm({ onSave }: { onSave: (values: ComposedValuesOutput) => void }) {
  const [organization, setOrganization] = useState<keyof typeof contexts>("acme");
  const form = ComposedValues.useForm({ compositionContext: contexts[organization] });
  const values = useWatch({ control: form.control });

  return <ComposedValues.Form form={form} onSubmit={onSave}>
    <Field orientation="horizontal" className="flex-wrap">
      <Button type="button" variant="outline" onClick={() => {
        form.reset({ ...exampleData.composed, resourceName: `${organization}-prd-payments-aue1` });
      }}>Load sample</Button>
      <Button type="button" variant="outline" onClick={() => form.reset(ComposedValues.defaultValues)}>Reset</Button>
      <Button type="button" variant="outline" onClick={() => setOrganization(organization === "acme" ? "globex" : "acme")}>
        Switch organization ({organization})
      </Button>
    </Field>
    <Section title="Shared values">
      <FieldGroup className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
        <ComposedValues.Field name="environment" />
        <ComposedValues.Field name="region" />
      </FieldGroup>
    </Section>
    <Section title="Prefixes and suffixes">
      <ComposedValues.Field name="email" />
      <ComposedValues.Field name="url" />
    </Section>
    <Section title="Bound and transformed segments">
      <ComposedValues.Field name="resourceName" />
      <ComposedValues.Field name="customerReference" />
    </Section>
    <Section title="Multiple editable parts"><ComposedValues.Field name="sku" /></Section>
    <Section title="String patterns"><ComposedValues.Field name="plainSlug" /></Section>
    <section aria-labelledby="canonical-values-heading" className="grid gap-2">
      <h3 id="canonical-values-heading" className="text-sm font-medium">Current canonical values</h3>
      <pre aria-label="Current canonical values" className="result whitespace-pre-wrap break-all">{JSON.stringify(values, null, 2)}</pre>
    </section>
    <Field orientation="horizontal"><FormSubmitButton>Save values</FormSubmitButton></Field>
  </ComposedValues.Form>;
}
