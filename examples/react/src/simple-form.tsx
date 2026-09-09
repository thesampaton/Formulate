import { useState } from "react";
import { SignInForm } from "@/compositions/sign-in";
import type { SignInValues } from "@/declarations/sign-in";

export function SimpleForm({ onSignIn }: { onSignIn: (values: SignInValues) => Promise<void> | void }) {
  const [submitted, setSubmitted] = useState(false);
  return <>
    <SignInForm onSignIn={async (values) => {
      setSubmitted(false);
      await onSignIn(values);
      setSubmitted(true);
    }} />
    {submitted ? <p role="status">Demo sign-in accepted. No credentials were sent or saved.</p> : null}
  </>;
}
