import { useState } from "react";
import { RequestSettingsForm } from "@/compositions/request-settings";
import type { RequestConfiguration } from "@/declarations/request-settings";

export function AdvancedOptions({ onSave }: {
  onSave: (payload: RequestConfiguration) => void | Promise<void>;
}) {
  const [saved, setSaved] = useState<RequestConfiguration | null>(null);
  return <>
    <RequestSettingsForm onSave={async (payload) => {
      setSaved(null);
      await onSave(payload);
      setSaved(payload);
    }} />
    {saved ? <div role="status" className="result"><p>Demo save accepted. Last submitted payload:</p><pre>{JSON.stringify(saved, null, 2)}</pre></div> : null}
  </>;
}
