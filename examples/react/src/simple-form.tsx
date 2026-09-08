import { Stack } from "./components/formulate/layouts";
import { useState } from "react";
import { z } from "zod";
import { defineForm } from "@/lib/formulate-config";
import { SubmitButton } from "./submit-button";
import { Email } from "./email";

const SignIn = defineForm({
  email: {
    ...Email,
    componentProps: { ...Email.componentProps, autoComplete: "username", className: "h-11" },
  },
  password: {
    schema: z.string().min(1, "Enter your password."),
    defaultValue: "",
    label: "Password",
    component: "input",
    componentProps: { type: "password", autoComplete: "current-password", className: "h-11" },
  },
}, { layout: Stack });

export type SignInValues = z.output<typeof SignIn.schema>;

export function SimpleForm({ onSignIn }: { onSignIn: (values: SignInValues) => Promise<void> | void }) {
  const [submitted, setSubmitted] = useState(false);
  const form = SignIn.useForm();

  return (
    <SignIn.Form form={form} onSubmit={async (values) => {
      setSubmitted(false);
      await onSignIn(values);
      setSubmitted(true);
    }}>
      <SignIn.Fields />
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      {submitted ? <p role="status">Demo sign-in accepted. No credentials were sent or saved.</p> : null}
    </SignIn.Form>
  );
}
