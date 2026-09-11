import { z } from "zod";
import { defineForm, defineSection } from "@/lib/formulate-config";

import { defineChoice } from "@formulate/react";
import type { Choice, ChoiceLoader } from "@formulate/react";

export const regionChoices = defineChoice({
  getInput: (target: { accountId: string }) => target.accountId || null,
  getRequestKey: (input: string) => input,
  getLoader: (services: { listRegions: ChoiceLoader }) => services.listRegions,
  validateSelection: (selection: string, options: readonly Choice[]) => {
    if (!selection) return "Choose an available option.";
    const isAvailable = options.some((option) => option.value === selection);
    return isAvailable ? undefined : "The retained choice is unavailable. Choose another option.";
  },
  messages: { missing: "Choose an account first.", pending: "Checking available choices…", failed: "Choices could not be loaded. Retry to continue." },
});

export const accounts = [{ value: "A", label: "Account A" }, { value: "B", label: "Account B" }, { value: "C", label: "Account C" }];
export const DeploymentTarget = defineSection({
  accountId: {
    schema: z.string().pipe(z.enum(["A", "B", "C"], { error: "Choose an account." })),
    defaultValue: "", label: "Account", component: "select", componentProps: { options: accounts },
  },
  regionId: {
    schema: z.string(), choices: regionChoices, defaultValue: "", label: "Region", component: "select", componentProps: { options: [] },
  },
}, { title: "Deployment target" });

export const CloudDeployment = defineForm({
  environment: { schema: z.string().pipe(z.enum(["development", "production"])), defaultValue: "development", label: "Environment", component: "select",
    componentProps: { options: [{ value: "development", label: "Development" }, { value: "production", label: "Production" }] } },
  primary: DeploymentTarget,
  recovery: DeploymentTarget,
  production: {
    schema: z.string(), defaultValue: "", label: "Production change reference", component: "input",
  },
}, {
  schema: (schema) => schema.superRefine((values, context) => {
    if (values.environment === "production" && !values.production.trim()) context.addIssue({
      code: "custom", path: ["production"], message: "Enter a production change reference.",
    });
  }).transform(({ production, ...values }) => ({
    ...values, ...(values.environment === "production" ? { production: production.trim() } : {}),
  })),
});
export type CloudValues = z.input<typeof CloudDeployment.schema>;
export type CloudPayload = z.output<typeof CloudDeployment.schema>;
