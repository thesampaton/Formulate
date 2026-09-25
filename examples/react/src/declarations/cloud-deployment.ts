import { z } from "zod";
import { defineChoice, defineField } from "@formulate/react";
import type { Choice, ChoiceLoader } from "@formulate/react";
import { defineForm, defineSection, field } from "@/lib/formulate-config";

export const regionChoices = defineChoice({
  dependencies: ["accountId"],
  getInput: (target: { accountId: string }) => target.accountId || null,
  getRequestKey: (input: string) => input,
  getLoader: (services: { listRegions: ChoiceLoader }) => services.listRegions,
  validateSelection: (selection: string, options: readonly Choice[]) => {
    if (!selection) return "Choose an available option.";
    const isAvailable = options.some((option) => option.value === selection);
    return isAvailable ? undefined : "The retained choice is unavailable. Choose another option.";
  },
  messages: {
    missing: "Choose an account first.",
    pending: "Checking available choices…",
    failed: "Choices could not be loaded. Retry to continue.",
  },
});

export const accounts = [
  { value: "A", label: "Account A" },
  { value: "B", label: "Account B" },
  { value: "C", label: "Account C" },
];
export const DeploymentTarget = defineSection({
  accountId: {
    schema: z.string().pipe(z.enum(["A", "B", "C"], { error: "Choose an account." })),
    defaultValue: "", label: "Account", component: "select", componentProps: { options: accounts },
  },
  regionId: {
    schema: z.string().min(1, "Choose an available option."), choices: regionChoices,
    defaultValue: "", label: "Region", component: "select", componentProps: { options: [] },
  },
}, { title: "Deployment target", definitionId: "cloud.deployment-target" });

// Reusing this definition carries its value contract and composition with it.
export const DeploymentName = defineField({
  primitive: "text", definitionId: "cloud.deployment-name",
  schema: z.string(), defaultValue: "", label: "Deployment name",
  component: "input", componentProps: { readOnly: true },
  composition: { segments: [{ binding: "environment" }, { literal: "-" }, { binding: "primary.accountId" }] },
});

export const CloudDeployment = defineForm({
  environment: {
    schema: z.string().pipe(z.enum(["development", "production"])),
    defaultValue: "development", label: "Environment", component: "select",
    componentProps: { options: [{ value: "development", label: "Development" }, { value: "production", label: "Production" }] },
  },
  primary: DeploymentTarget.use({ id: "primary", bind: "primary" }),
  recovery: DeploymentTarget.use({ id: "recovery", bind: "recovery" }),
  resourceName: field(DeploymentName, { id: "deployment-name", bind: "resourceName" }),
  production: {
    applicable: { binding: "environment", equals: "production" },
    schema: z.string().trim().min(1, "Enter a production change reference."),
    defaultValue: "", label: "Production change reference", component: "input",
  },
}, {
  id: "deployment", definitionId: "cloud.deployment",
  children: [
    "environment",
    { id: "targets", role: "page", label: "Targets", children: ["primary", "recovery", "resourceName"] },
    { id: "production-page", role: "page", label: "Production configuration", children: ["production"] },
  ],
});
export type CloudValues = z.input<typeof CloudDeployment.schema>;
export type CloudPayload = Omit<z.output<typeof CloudDeployment.schema>, "production"> & { production?: string };

/** Export is a projection of the authored definition; no graph edits are needed. */
export function createCloudGraph(listRegions: ChoiceLoader) {
  return CloudDeployment.toPortable({ services: { listRegions } });
}
