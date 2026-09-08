import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { defineForm } from "@/lib/formulate-config";
import { Stack } from "./components/formulate/layouts";
import { Name } from "./name";
import { Email } from "./email";
import { SubmitButton } from "./submit-button";

const Profile = defineForm({ name: Name, email: Email }, { layout: Stack });

export function ResponsiveLayout() {
  const form = Profile.useForm();
  const [width, setWidth] = useState(100);
  const [saved, setSaved] = useState(false);
  return <>
    <h2>A layout you can reuse</h2>
    <p className="card-description">First and last name share a row when there is room. Reduce the form width to see them stack.</p>
    <p className="text-xs font-medium">Form width · {width}%</p>
    <Slider aria-label="Form width" min={45} max={100} value={[width]}
      className="mt-3 mb-6" onValueChange={([next]) => setWidth(next!)} />
    <div style={{ width: `${width}%` }}>
      <Profile.Form form={form} onSubmit={() => setSaved(true)}>
        <Profile.Fields />
        <SubmitButton>Save profile</SubmitButton>
        {saved ? <p role="status">Demo profile accepted.</p> : null}
      </Profile.Form>
    </div>
  </>;
}
