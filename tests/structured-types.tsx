// Compile-only contract checks for object/array controls and presentation slots.
import { z } from "zod";
import { createFormulate, Page, Section } from "@formulate/react";
import { DateRangeControl, MultiSelectControl } from "../examples/react/src/components/formulate/picker-controls";

const { defineForm, defineSection } = createFormulate({ components: { range: DateRangeControl, multi: MultiSelectControl } });
const range = { schema: z.object({ from: z.date().nullable(), to: z.date().nullable() }), defaultValue: { from: null, to: null }, label: "Dates", component: "range" as const };
const Plans = defineSection({ dates: range });
const Trip = defineForm({ plans: Plans, interests: { schema: z.array(z.string()), defaultValue: [], label: "Interests", component: "multi", componentProps: { options: [] }, classNames: { label: "font-medium" } } });
export function StructuredTypes() {
  <Trip.Section name="plans" headingLevel={4} classNames={{ heading: "text-xl" }} bodyClassName="space-y-4" />;
  const bound = Trip.bindSection("plans");
  <bound.Section headingLevel={3} />;
  <Page pageId="trip" title="Trip" headingLevel={1} />;
  // @ts-expect-error Heading levels are real HTML heading levels.
  <Section title="Invalid" headingLevel={7} />;
  // @ts-expect-error Scalar strings cannot select an object editor.
  defineForm({ bad: { schema: z.string(), defaultValue: "", label: "Bad", component: "range" } });
  // @ts-expect-error Array options are required by this adapter.
  defineForm({ bad: { schema: z.array(z.string()), defaultValue: [], label: "Bad", component: "multi" } });
  // @ts-expect-error Arrays cannot use a date range editor.
  defineForm({ bad: { schema: z.array(z.string()), defaultValue: [], label: "Bad", component: "range" } });
  // @ts-expect-error A binding-owned event cannot be replaced through UI configuration.
  <Trip.Field name="interests" componentProps={{ onChange: () => {} }} />;
}
