import { useState } from "react";
import { ControlGalleryForm } from "@/compositions/control-gallery";
import type { ControlGalleryValues } from "@/declarations/control-gallery";

export function ControlGalleryExample() {
  const [saved, setSaved] = useState<ControlGalleryValues>();
  return <>
    <h2>Control gallery</h2>
    <p className="card-description">Reusable text, boolean, choice, number and date fields with local shadcn Base UI controls. Load sample values or edit the controls to compare their behavior.</p>
    <ControlGalleryForm onSave={setSaved} />
    {saved ? <pre role="status" aria-label="Saved control values" className="result">{JSON.stringify(saved, null, 2)}</pre> : null}
  </>;
}
