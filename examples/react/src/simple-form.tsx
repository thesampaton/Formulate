import { useState } from "react";
import { Form } from "@formulate/react";
import { z } from "zod";
import { defineForm } from "./formulate";
import { SubmitButton } from "./submit-button";

const SignIn = defineForm({
  email: {
    schema: z.email("Enter a valid email address."),
    defaultValue: "",
    label: "Email",
    component: "input",
    componentProps: { type: "email", autoComplete: "username", placeholder: "you@example.com", className: "h-11" },
  },
  password: {
    schema: z.string().min(1, "Enter your password."),
    defaultValue: "",
    label: "Password",
    component: "input",
    componentProps: { type: "password", autoComplete: "current-password", className: "h-11" },
  },
});

export type SignInValues = z.output<typeof SignIn.schema>;

export function SimpleForm({ onSignIn }: { onSignIn: (values: SignInValues) => Promise<void> | void }) {
  const [submitted, setSubmitted] = useState(false);
  const form = SignIn.useForm();

  return (
    <Form form={form} onSubmit={async (values) => {
      setSubmitted(false);
      await onSignIn(values);
      setSubmitted(true);
    }}>
      <SignIn.Fields />
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      {submitted ? <p role="status">Demo sign-in accepted. No credentials were sent or saved.</p> : null}
    </Form>
  );
}
