import { z } from "zod";
import { defineSection } from "@/lib/formulate-config";

import { defineChoice } from "@formulate/react";
import type { Choice, ChoiceLoader } from "@formulate/react";

export const machineSizeChoices = defineChoice({
  input: (_resource: { machineSize: string }, context: { accountId: string; regionId: string; listMachineSizes: ChoiceLoader }) =>
    context.regionId ? JSON.stringify([context.accountId, context.regionId]) : null,
  key: (input: string) => input,
  loader: (context: { accountId: string; regionId: string; listMachineSizes: ChoiceLoader }) => context.listMachineSizes,
  validate: (selection: string, options: readonly Choice[]) => !selection ? "Choose an available option."
    : options.some((option) => option.value === selection) ? undefined : "The retained choice is unavailable. Choose another option.",
  messages: { missing: "Choose a region first.", pending: "Checking available choices…", failed: "Choices could not be loaded. Retry to continue." },
});

export const resourceBindings = (index: number) => ({ name: `resources.${index}.name` as const, machineSize: `resources.${index}.machineSize` as const });

export const Resource = defineSection({
  name: { schema: z.string().trim().min(1, "Name this resource."), defaultValue: "", label: "Resource name", component: "input" },
  machineSize: { schema: z.string(), choices: machineSizeChoices, defaultValue: "", label: "Machine size", component: "select", componentProps: { options: [] } },
}, { title: "Resource" });

// Drafts retain incomplete editing strings, not parsed submission output.
export const infrastructureEditingSchema = z.object({
  regionId: z.string(),
  resources: z.array(z.object({ resourceId: z.string().min(1), name: z.string(), machineSize: z.string() })),
}).refine(({ resources }) => new Set(resources.map((item) => item.resourceId)).size === resources.length, { message: "Resource identities must be unique." });
export const infrastructureSchema = z.object({
  regionId: z.string().min(1, "Choose a region."),
  resources: z.array(Resource.schema.extend({ resourceId: z.string().min(1) })).min(1, "Add at least one resource."),
}).superRefine(({ resources }, context) => {
  const names = new Set<string>();
  const ids = new Set<string>();
  resources.forEach((item, index) => {
    if (names.has(item.name)) context.addIssue({ code: "custom", path: ["resources", index, "name"], message: "Resource names must be unique." });
    if (ids.has(item.resourceId)) context.addIssue({ code: "custom", path: ["resources", index, "name"], message: "Resource identities must be unique." });
    names.add(item.name); ids.add(item.resourceId);
  });
});
export type InfrastructureValues = z.input<typeof infrastructureSchema>;
export type InfrastructurePayload = z.output<typeof infrastructureSchema>;
/** One repeated use carries its durable choice ID and current editor paths. */
export const bindResource = (resourceId: string, index: number) => Resource.bind<InfrastructureValues>({
  id: resourceId,
  bindings: resourceBindings(index),
});
export const draftSchema = z.object({ definition: z.literal("infrastructure-request"), version: z.literal(1), revision: z.string().min(1), values: infrastructureEditingSchema });
export type InfrastructureDraft = z.output<typeof draftSchema>;
export type DraftAdapter = { save: (draft: InfrastructureDraft) => Promise<void>; load: () => Promise<unknown> };
