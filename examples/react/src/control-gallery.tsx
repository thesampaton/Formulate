import { useState } from "react";
import { ControlGalleryForm } from "@/compositions/control-gallery";
import type { ControlGalleryValues } from "@/declarations/control-gallery";

export function ControlGalleryExample() {
  const [saved, setSaved] = useState<ControlGalleryValues>();
  return <div className="control-gallery-demo">
    <ControlGalleryForm onSave={setSaved} />
    {saved ? <pre role="status" aria-label="Saved control values" className="result">{JSON.stringify(saved, null, 2)}</pre> : null}
  </div>;
}
