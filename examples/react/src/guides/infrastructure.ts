/// <reference types="vite/client" />
import declaration from "../declarations/infrastructure.ts?raw";
import composition from "../compositions/infrastructure.tsx?raw";
import coordination from "../hooks/use-infrastructure.ts?raw";
import demo from "../infrastructure.tsx?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const infrastructureGuide = {
  capability: "Keep a repeated section attached to its item",
  summary: "In a changing list, an item's position is temporary. Give each use of a section a stable ID so its choices and correction target follow the item when rows move. This infrastructure request repeats one Resource section for each row.",
  prompt: "Load sample data and use Move up on Worker, then open Review and select Edit Worker. Focus follows Worker to its new row. Clear its name and select Preview plan to see correction return to that same row.",
  steps: [
    {
      id: "declare-resource-section",
      title: "Define the repeated fields once",
      explanation: "Every resource row gets the same name and machine-size fields, rules and control defaults from one section definition.",
      filename: "declarations/infrastructure.ts",
      code: sourceExcerpt(declaration, "export const Resource = defineSection({", "// Drafts retain incomplete editing strings, not parsed submission output."),
    },
    {
      id: "bind-resource-identity",
      title: "Separate identity from position",
      explanation: "The resource ID identifies the section use across moves. The array index supplies its current editing paths and can change without changing that identity.",
      filename: "declarations/infrastructure.ts",
      code: sourceExcerpt(declaration, "export const bindResource = (resourceId: string, index: number) => Resource.bind<InfrastructureValues>({", "export const draftSchema = z.object({"),
    },
    {
      id: "connect-resource-choices",
      title: "Reconnect choices at current paths",
      explanation: "For each current row, the bound section connects its durable ID and current paths to the machine-size choices. A move does not turn one resource into another.",
      filename: "hooks/use-infrastructure.ts",
      code: sourceExcerpt(coordination, "  const getChoiceBindings = useCallback((values: InfrastructureValues) => {", "  const { choices, getValidationRevision } = form;"),
    },
    {
      id: "focus-resource-after-reorder",
      title: "Resolve the item before focusing",
      explanation: "Edit and error correction look up the resource's latest index by ID, then focus its field at the current path.",
      filename: "hooks/use-infrastructure.ts",
      code: sourceExcerpt(coordination, '  function goToResourceField(resourceId: string, fieldName: "name" | "machineSize") {', "  function handleInvalid(errors: FieldErrors<InfrastructureValues>) {"),
    },
  ],
  completeSources: [
    { label: "Resource schema and binding", filename: "declarations/infrastructure.ts", code: declaration.trim() },
    { label: "Composition", filename: "compositions/infrastructure.tsx", code: composition.trim() },
    { label: "Resource and draft coordination", filename: "hooks/use-infrastructure.ts", code: coordination.trim() },
    { label: "Demo storage and services", filename: "infrastructure.tsx", code: demo.trim() },
  ],
} satisfies FocusedGuide;
