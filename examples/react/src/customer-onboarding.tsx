import { useState } from "react";
import { CustomerForm } from "@/compositions/customer";
import type { CustomerPayload, CustomerValues } from "@/declarations/customer";

export function CustomerOnboarding({ onCreate, defaultValues }: {
  onCreate: (payload: CustomerPayload) => void | Promise<void>;
  defaultValues?: CustomerValues;
}) {
  const [saved, setSaved] = useState<CustomerPayload | null>(null);
  return <>
    <CustomerForm defaultValues={defaultValues} onCreate={async (payload) => {
      setSaved(null);
      await onCreate(payload);
      setSaved(payload);
    }} />
    {saved ? <div role="status" className="result"><p>Demo creation accepted. Last submitted payload:</p><pre>{JSON.stringify(saved, null, 2)}</pre></div> : null}
  </>;
}
