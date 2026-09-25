import { useState } from "react";
import { ControlGalleryForm } from "@/compositions/control-gallery";
import type { ControlGalleryValues } from "@/declarations/control-gallery";

export function ControlGalleryExample() {
  const [saved, setSaved] = useState<ControlGalleryValues>();
  return <div className="control-gallery-demo">
    <p className="control-gallery-reference-link"><a href="#/examples/controls?section=api">Browse the binding API for these controls ↓</a></p>
    <ControlGalleryForm onSave={setSaved} />
    {saved ? <pre role="status" aria-label="Saved control values" className="result">{JSON.stringify(saved, null, 2)}</pre> : null}
  </div>;
}
