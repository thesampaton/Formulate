import { Field } from "@/components/ui/field";
import { SignIn } from "@/declarations/sign-in";
import type { SignInValues } from "@/declarations/sign-in";
import { FormSubmitButton } from "@/components/formulate/form-actions";

export function SignInForm({ onSignIn }: { onSignIn: (values: SignInValues) => Promise<void> | void }) {
  const form = SignIn.useForm();

  return (
    <SignIn.Form form={form} onSubmit={onSignIn}>
      <SignIn.Fields />
      <Field orientation="horizontal"><FormSubmitButton pendingLabel="Signing in…">Sign in</FormSubmitButton></Field>
    </SignIn.Form>
  );
}
