import { useState } from "react";
import { ComposedValuesForm } from "@/compositions/composed-values";
import type { ComposedValuesOutput } from "@/declarations/composed-values";

export function ComposedValuesExample() {
  const [saved, setSaved] = useState<ComposedValuesOutput>();
  return <>
    <h2>One value from several parts</h2>
    <p className="card-description">Each field stores one complete string, even when you edit only some of its parts. Muted parts come from fixed text, other fields or the selected organization.</p>
    <ComposedValuesForm onSave={setSaved} />
    {saved ? <pre role="status" aria-label="Saved composed values" className="result">{JSON.stringify(saved, null, 2)}</pre> : null}
  </>;
}
