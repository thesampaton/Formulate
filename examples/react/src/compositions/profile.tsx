import { Profile } from "@/declarations/profile";
import type { ProfileValues } from "@/declarations/profile";
import { FormSubmitButton } from "@/components/formulate/form-actions";

export function ProfileForm({ onSave }: { onSave: (values: ProfileValues) => void | Promise<void> }) {
  const form = Profile.useForm();
  return <Profile.Form form={form} onSubmit={onSave}>
    <Profile.Fields />
    <FormSubmitButton>Save profile</FormSubmitButton>
  </Profile.Form>;
}
