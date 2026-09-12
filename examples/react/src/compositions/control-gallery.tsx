import { ControlGallery } from "@/declarations/control-gallery";
import type { ControlGalleryValues } from "@/declarations/control-gallery";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/formulate/form-actions";
import { Section } from "@/lib/formulate";
import { ActionRow, Row } from "@/components/formulate/layouts";
import { exampleData } from "@/data/example-data";

export function ControlGalleryForm({ onSave }: { onSave: (values: ControlGalleryValues) => void }) {
  const form = ControlGallery.useForm();
  return <ControlGallery.Form form={form} onSubmit={onSave}>
    <ActionRow>
      <Button type="button" variant="outline" onClick={() => form.reset(exampleData.controls)}>Load sample</Button>
      <Button type="button" variant="outline" onClick={() => form.reset(ControlGallery.defaultValues)}>Reset</Button>
    </ActionRow>
    <Section title="Text" layout={Row}>
      <ControlGallery.Field name="input" />
      <ControlGallery.Field name="textarea" />
      <ControlGallery.Field name="inputOTP" />
    </Section>
    <Section title="Booleans" layout={Row}>
      <ControlGallery.Field name="checkbox" orientation="horizontal" />
      <ControlGallery.Field name="switch" orientation="horizontal" />
    </Section>
    <Section title="Choices" layout={Row}>
      <ControlGallery.Field name="select" />
      <ControlGallery.Field name="radioGroup" />
      <ControlGallery.Field name="combobox" />
      <ControlGallery.Field name="command" />
      <ControlGallery.Field name="toggleGroup" />
      <ControlGallery.Field name="multiToggleGroup" />
    </Section>
    <Section title="Numbers and dates" layout={Row}>
      <ControlGallery.Field name="slider" />
      <ControlGallery.Field name="calendar" />
      <ControlGallery.Field name="datePicker" />
    </Section>
    <FormSubmitButton>Save values</FormSubmitButton>
  </ControlGallery.Form>;
}
