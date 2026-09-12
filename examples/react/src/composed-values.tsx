import { useState } from "react";
import { ComposedValuesForm } from "@/compositions/composed-values";
import type { ComposedValuesOutput } from "@/declarations/composed-values";

export function ComposedValuesExample() {
  const [saved, setSaved] = useState<ComposedValuesOutput>();
  return <>
    <h2>Partly yours, partly supplied</h2>
    <p className="card-description">Edit the plain text segments; the muted segments are supplied for you. Each composed control owns one string. Change a shared value or switch organization to see the derived strings update.</p>
    <ComposedValuesForm onSave={setSaved} />
    {saved ? <pre role="status" aria-label="Saved composed values" className="result">{JSON.stringify(saved, null, 2)}</pre> : null}
  </>;
}
