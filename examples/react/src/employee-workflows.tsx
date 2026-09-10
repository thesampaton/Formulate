import { useState } from "react";
import { EmployeeOnboardingForm } from "@/compositions/employee-onboarding";
import { InternalTransferForm } from "@/compositions/internal-transfer";
import { exampleData } from "@/data/example-data";
import { Button } from "@/components/ui/button";

export function EmployeeWorkflowsExample() {
  const [sample, setSample] = useState(0);
  const [accepted, setAccepted] = useState<unknown>(null);
  return <>
    <p className="card-description">Set up a new employee or arrange an internal transfer. Each request keeps its own answers.</p>
    <Button type="button" variant="outline" className="mb-6" onClick={() => { setAccepted(null); setSample((value) => value + 1); }}>Load sample data</Button>
    <div key={sample} className="grid gap-10">
      <EmployeeOnboardingForm defaultValues={sample ? structuredClone(exampleData.employment.onboarding) : undefined} onSubmit={setAccepted} />
      <hr className="border-border" />
      <InternalTransferForm defaultValues={sample ? structuredClone(exampleData.employment.transfer) : undefined} onSubmit={setAccepted} />
    </div>
    {accepted ? <div role="status" className="result mt-6"><p>Demo request accepted. Last submitted payload:</p><pre>{JSON.stringify(accepted, null, 2)}</pre></div> : null}
  </>;
}
