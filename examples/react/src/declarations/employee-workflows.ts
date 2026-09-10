import { z } from "zod";
import { defineForm } from "@/lib/formulate-config";
import { Employment } from "./employment";

export const EmployeeOnboarding = defineForm({
  employment: Employment,
  equipment: {
    schema: z.string().trim().min(1, "Describe the equipment required."),
    defaultValue: "", label: "Equipment request", component: "input",
  },
});

export const InternalTransfer = defineForm({ proposedEmployment: Employment });

export type EmployeeOnboardingValues = z.input<typeof EmployeeOnboarding.schema>;
export type EmployeeOnboardingPayload = z.output<typeof EmployeeOnboarding.schema>;
export type InternalTransferValues = z.input<typeof InternalTransfer.schema>;
export type InternalTransferPayload = z.output<typeof InternalTransfer.schema>;
