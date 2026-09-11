import { useState } from "react";
import { FormulatePortalProvider, Page, Section } from "@/lib/formulate";
import { Booking } from "@/declarations/structured-editing";
import type { BookingOutput } from "@/declarations/structured-editing";
import { Button } from "@/components/ui/button";
import { Stack, ActionRow } from "@/components/formulate/layouts";
import { FormSubmitButton } from "@/components/formulate/form-actions";
import { exampleData } from "@/data/example-data";

export function StructuredEditingExample() {
  const form = Booking.useForm();
  const [active, setActive] = useState(true);
  const [dark, setDark] = useState(false);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [saved, setSaved] = useState<BookingOutput>();
  return <div className={dark ? "dark rounded-lg bg-background p-4 text-foreground" : ""}>
    <FormulatePortalProvider container={portal}>
      <Booking.Form form={form} onSubmit={setSaved}>
        <ActionRow>
          <Button type="button" variant="outline" onClick={() => setActive(!active)}>{active ? "Hide editors" : "Show editors"}</Button>
          <Button type="button" variant="outline" onClick={() => setDark(!dark)}>Toggle theme</Button>
          <Button type="button" variant="outline" onClick={() => { form.reset(Booking.defaultValues); setSaved(undefined); }}>Reset</Button>
          <Button type="button" variant="outline" onClick={() => form.reset(exampleData.structured)}>Load sample</Button>
        </ActionRow>
        <Page pageId="booking" title="Plan a visit" active={active} layout={Stack} classNames={{ heading: "text-2xl" }}>
          <p>A partial date range and several activities each remain one editing value. The popups share this panel’s theme.</p>
          <Section title="Your plans" layout={Stack}>
            <Booking.Fields />
          </Section>
          <FormSubmitButton>Save visit</FormSubmitButton>
        </Page>
        {saved ? <pre role="status" className="result">{JSON.stringify(saved, null, 2)}</pre> : null}
      </Booking.Form>
      <div ref={setPortal} data-example-portal="booking" />
    </FormulatePortalProvider>
  </div>;
}
