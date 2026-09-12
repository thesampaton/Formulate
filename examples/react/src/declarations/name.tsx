import { z } from "zod";
import { LayoutBody } from "@/lib/formulate";
import type { SectionPresentationProps } from "@/lib/formulate";
import { FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";
import { defineSection } from "@/lib/formulate-config";

// A reusable field group with local names and its own default presentation.
export const Name = defineSection({
  firstName: {
    schema: z.string().trim().min(1, "Enter a first name."),
    defaultValue: "", label: "First name", component: "input",
    componentProps: { autoComplete: "given-name" },
  },
  lastName: {
    schema: z.string().trim().min(1, "Enter a last name."),
    defaultValue: "", label: "Last name", component: "input",
    componentProps: { autoComplete: "family-name" },
  },
}, { title: "Name", presentation: NameFields });

function NameFields({ title, layout, bodyClassName }: SectionPresentationProps) {
  return <FieldSet>
    <FieldLegend>{title}</FieldLegend>
    <LayoutBody layout={layout} bodyClassName={bodyClassName}>
      {layout === undefined ? <FieldGroup className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
        <Name.Fields />
      </FieldGroup> : <Name.Fields />}
    </LayoutBody>
  </FieldSet>;
}
