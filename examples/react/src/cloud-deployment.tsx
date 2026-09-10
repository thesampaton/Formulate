import { useCallback, useRef, useState } from "react";
import { CloudDeploymentForm } from "@/compositions/cloud-deployment";
import { exampleData } from "@/data/example-data";
import { Button } from "@/components/ui/button";
import type { ChoiceLoader } from "@/lib/choice-request";

export function CloudDeploymentExample() {
  const failNext = useRef(false);
  const [sample, setSample] = useState(0);
  const [accepted, setAccepted] = useState<unknown>(null);
  const listRegions = useCallback<ChoiceLoader>((account) => {
    const fail = failNext.current;
    failNext.current = false;
    // Deliberately ignore abort to exercise rejection of obsolete responses.
    return new Promise((resolve, reject) => setTimeout(() => fail ? reject(new Error("Demo lookup failed"))
      : resolve([1, 2].map((number) => ({ value: `${account}${number}`, label: `${account} region ${number}` }))), account === "B" ? 1500 : account === "C" ? 300 : 800));
  }, []);
  return <>
    <div aria-label="Demo controls" className="mb-6 flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={() => { setAccepted(null); setSample((value) => value + 1); }}>Load sample data</Button>
      <Button type="button" variant="outline" onClick={() => { failNext.current = true; }}>Fail next region lookup</Button>
    </div>
    <CloudDeploymentForm key={sample} defaultValues={sample ? structuredClone(exampleData.cloud) : undefined} listRegions={listRegions} onDeploy={setAccepted} />
    {accepted ? <div role="status" className="result"><p>Demo deployment request accepted:</p><pre>{JSON.stringify(accepted, null, 2)}</pre></div> : null}
  </>;
}
