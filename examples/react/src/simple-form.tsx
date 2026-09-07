import { useState } from "react";
import { Form, useFormulate } from "@formulate/react";
import { z } from "zod";
import { Field } from "./formulate";

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type SignInValues = z.output<typeof signInSchema>;

export function SimpleForm({ onSignIn }: { onSignIn: (values: SignInValues) => Promise<void> | void }) {
  const [submitted, setSubmitted] = useState(false);
  const form = useFormulate(signInSchema, { defaultValues: { email: "", password: "" } });

  return (
    <Form form={form} onSubmit={async (values) => {
      setSubmitted(false);
      await onSignIn(values);
      setSubmitted(true);
    }}>
      <Field control={form.control} name="email" label="Email" component="input"
        componentProps={{ type: "email", autoComplete: "username", placeholder: "you@example.com", className: "h-11" }} />
      <Field control={form.control} name="password" label="Password" component="input"
        componentProps={{ type: "password", autoComplete: "current-password", className: "h-11" }} />
      <button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      {submitted ? <p role="status">Demo sign-in accepted. No credentials were sent or saved.</p> : null}
    </Form>
  );
}
