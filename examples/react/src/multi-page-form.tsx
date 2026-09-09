import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MultiPageForm } from "@/compositions/multi-page-form";
import type { ProfileFormProps } from "@/hooks/use-profile-pages";
import { exampleData } from "@/data/example-data";

export function MultiPageExample({ onSave = () => undefined, defaultValues }: Partial<ProfileFormProps>) {
  const [sample, setSample] = useState(0);
  const [pending, setPending] = useState(false);
  return <>
    <Button type="button" variant="outline" className="mb-6" disabled={pending}
      onClick={() => setSample((version) => version + 1)}>Load sample data</Button>
    <MultiPageForm key={sample} defaultValues={sample ? structuredClone(exampleData.multiPage) : defaultValues}
      onSave={async (payload) => {
        setPending(true);
        try { await onSave(payload); } finally { setPending(false); }
      }} />
  </>;
}
