import { z } from "zod";
import { defineForm, defineSection } from "@/lib/formulate-config";

export const accounts = [{ value: "A", label: "Account A" }, { value: "B", label: "Account B" }, { value: "C", label: "Account C" }];
export const DeploymentTarget = defineSection({
  accountId: {
    schema: z.string().pipe(z.enum(["A", "B", "C"], { error: "Choose an account." })),
    defaultValue: "", label: "Account", component: "select", componentProps: { options: accounts },
  },
  regionId: {
    schema: z.string(), defaultValue: "", label: "Region", component: "select", componentProps: { options: [] },
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
