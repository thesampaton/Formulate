import { z } from "zod";
import { defineSection } from "@/lib/formulate-config";

export const employmentTypes = [
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
] as const;
export const managers = [
  { value: "alex", label: "Alex Morgan" },
  { value: "jordan", label: "Jordan Lee" },
] as const;

export const Employment = defineSection({
  employmentType: {
    schema: z.string().pipe(z.enum(["permanent", "contract"], { error: "Choose an employment type." })),
    defaultValue: "", label: "Employment type", component: "select",
    componentProps: { options: employmentTypes },
  },
  startDate: {
    schema: z.string().pipe(z.iso.date({ error: "Enter a valid start date." })),
    defaultValue: "", label: "Start date", component: "input",
    componentProps: { type: "date" },
  },
  managerId: {
    schema: z.string().pipe(z.enum(["alex", "jordan"], { error: "Choose a manager." })),
    defaultValue: "", label: "Manager", component: "select",
    componentProps: { options: managers },
  },
}, { title: "Employment" });

export type EmploymentValues = z.input<typeof Employment.schema>;
