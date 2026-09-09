import { useState } from "react";
import { EmailConfirmationForm } from "@/compositions/email-confirmation";
import type { EmailConfirmationValues } from "@/declarations/email-confirmation";

export function EmailConfirmationExample() {
  const [accepted, setAccepted] = useState<EmailConfirmationValues>();
  return <>
    <h2>Confirm your email</h2>
    <p className="card-description">Enter your email twice. Both addresses must be valid and match exactly.</p>
    <EmailConfirmationForm onConfirm={setAccepted} />
    {accepted ? <div role="status"><p>Last accepted demo values</p><pre>{JSON.stringify(accepted, null, 2)}</pre></div> : null}
  </>;
}
