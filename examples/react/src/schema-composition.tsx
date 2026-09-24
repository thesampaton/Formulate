import { useState } from "react";
import { WorkshopRegistrationForm } from "@/compositions/workshop-registration";
import type { Registration } from "@/compositions/workshop-registration";

export function SchemaCompositionExample() {
  const [registered, setRegistered] = useState<Registration>();
  return <>
    <h2>Workshop registration</h2>
    <p className="card-description">One schema defines the contact section, validation, defaults and invoice condition. Select “I need an invoice” to reveal the required company field.</p>
    <WorkshopRegistrationForm onRegister={setRegistered} />
    {registered ? <pre role="status" aria-label="Registration payload" className="result">{JSON.stringify(registered, null, 2)}</pre> : null}
  </>;
}
