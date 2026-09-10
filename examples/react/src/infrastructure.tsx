import { useState } from "react";
import { InfrastructureForm } from "@/compositions/infrastructure";
import { exampleData } from "@/data/example-data";
import type { DraftAdapter } from "@/declarations/infrastructure";
import type { ChoiceLoader } from "@formulate/react";
import { Button } from "@/components/ui/button";

// The application owns storage/version policy; only fictional resource editing
// values are stored here. No validation, request state or plan is persisted.
const drafts: DraftAdapter = {
  save: async (draft) => { localStorage.setItem("formulate.infrastructure.v1", JSON.stringify(draft)); },
  load: async () => JSON.parse(localStorage.getItem("formulate.infrastructure.v1") ?? "null"),
};
const sizes: ChoiceLoader = async () => [{ value: "small", label: "Small" }, { value: "large", label: "Large" }];
const previewPlan = async () => ({ reference: crypto.randomUUID() });

export function InfrastructureExample() {
  const [sample, setSample] = useState(0);
  const [accepted, setAccepted] = useState<unknown>(null);
  return <>
    <Button type="button" variant="outline" className="mb-6" onClick={() => { setAccepted(null); setSample((value) => value + 1); }}>Load sample data</Button>
    <InfrastructureForm key={sample} accountId="A" defaultValues={sample ? structuredClone(exampleData.infrastructure) : undefined}
      listMachineSizes={sizes} drafts={drafts} previewPlan={previewPlan} onProvision={setAccepted} />
    {accepted ? <div role="status" className="result"><p>Demo provisioning request accepted:</p><pre>{JSON.stringify(accepted, null, 2)}</pre></div> : null}
  </>;
}
