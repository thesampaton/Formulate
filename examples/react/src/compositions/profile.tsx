import { Field, FieldGroup } from "@/components/ui/field";
import { Profile } from "@/declarations/profile";
import type { ProfileValues } from "@/declarations/profile";
import { FormSubmitButton } from "@/components/formulate/form-actions";

export function ProfileForm({ onSave, stackNames = false }: {
  onSave: (values: ProfileValues) => void | Promise<void>;
  stackNames?: boolean;
}) {
  const form = Profile.useForm();
  return <Profile.Form form={form} onSubmit={onSave}>
    <Profile.Section
      name="name"
      layout={stackNames ? FieldGroup : undefined}
    />
    <Profile.Field name="email" />
    <Field orientation="horizontal"><FormSubmitButton>Save profile</FormSubmitButton></Field>
  </Profile.Form>;
}
