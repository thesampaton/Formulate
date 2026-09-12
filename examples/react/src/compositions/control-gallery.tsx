import { ControlGallery } from "@/declarations/control-gallery";
import type { ControlGalleryValues } from "@/declarations/control-gallery";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/formulate/form-actions";
import { Section } from "@/lib/formulate";
import { Field, FieldGroup } from "@/components/ui/field";
import { exampleData } from "@/data/example-data";

export function ControlGalleryForm({ onSave }: { onSave: (values: ControlGalleryValues) => void }) {
  const form = ControlGallery.useForm();
  return <ControlGallery.Form form={form} onSubmit={onSave}>
    <Field orientation="horizontal" className="flex-wrap">
      <Button type="button" variant="outline" onClick={() => form.reset(exampleData.controls)}>Load sample</Button>
      <Button type="button" variant="outline" onClick={() => form.reset(ControlGallery.defaultValues)}>Reset</Button>
    </Field>
    <Section title="Text">
      <FieldGroup className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
        <ControlGallery.Field name="input" />
        <ControlGallery.Field name="textarea" />
        <ControlGallery.Field name="inputOTP" />
      </FieldGroup>
    </Section>
    <Section title="Booleans">
      <FieldGroup className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
        <ControlGallery.Field name="checkbox" orientation="horizontal" />
        <ControlGallery.Field name="switch" orientation="horizontal" />
      </FieldGroup>
    </Section>
    <Section title="Choices">
      <FieldGroup className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
        <ControlGallery.Field name="select" />
        <ControlGallery.Field name="radioGroup" />
        <ControlGallery.Field name="combobox" />
        <ControlGallery.Field name="command" />
        <ControlGallery.Field name="toggleGroup" />
        <ControlGallery.Field name="multiToggleGroup" />
      </FieldGroup>
    </Section>
    <Section title="Numbers and dates">
      <FieldGroup className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
        <ControlGallery.Field name="slider" />
        <ControlGallery.Field name="calendar" />
        <ControlGallery.Field name="datePicker" />
      </FieldGroup>
    </Section>
    <Field orientation="horizontal"><FormSubmitButton>Save values</FormSubmitButton></Field>
  </ControlGallery.Form>;
}
