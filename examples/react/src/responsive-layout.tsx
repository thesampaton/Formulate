import { ProfileForm } from "@/compositions/profile";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useId, useState } from "react";

export function ResponsiveLayout() {
  const [width, setWidth] = useState(100);
  const [stackNames, setStackNames] = useState(false);
  const [saved, setSaved] = useState(false);
  const widthLabel = useId();
  return <>
    <h2>Change the layout, keep the form</h2>
    <p className="card-description">A section can provide a default layout, and its host can override it without changing the fields. Toggle the stacked layout or narrow this Name section to compare them.</p>
    <Button type="button" variant="outline" aria-pressed={stackNames}
      className="mb-5" onClick={() => setStackNames((current) => !current)}>Stack name fields</Button>
    <p className="text-xs font-medium"><span id={widthLabel}>Form width</span> · {width}%</p>
    <Slider aria-labelledby={widthLabel} min={45} max={100} value={[width]}
      className="mt-3 mb-6" onValueChange={(next) => setWidth(typeof next === "number" ? next : next[0]!)} />
    <div style={{ width: `${width}%` }}>
      <ProfileForm stackNames={stackNames} onSave={() => setSaved(true)} />
      {saved ? <p role="status">Demo profile accepted.</p> : null}
    </div>
  </>;
}
