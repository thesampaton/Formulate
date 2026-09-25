import { useState } from "react";
import { WorkshopRegistrationForm } from "@/compositions/workshop-registration";
import type { Registration } from "@/compositions/workshop-registration";

export function SchemaCompositionExample() {
  const [registered, setRegistered] = useState<Registration>();
  return <>
    <h2>Workshop registration</h2>
    <p className="card-description">The schema renders a nested contact section and applies the company field only when an invoice is needed. Select “I need an invoice” to see the condition take effect.</p>
    <WorkshopRegistrationForm onRegister={setRegistered} />
    {registered ? <pre role="status" aria-label="Registration payload" className="result">{JSON.stringify(registered, null, 2)}</pre> : null}
  </>;
}
