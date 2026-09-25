/// <reference types="vite/client" />
import declaration from "../declarations/cloud-deployment.ts?raw";
import composition from "../compositions/cloud-deployment.tsx?raw";
import coordination from "../hooks/use-cloud-deployment.ts?raw";
import demo from "../cloud-deployment.tsx?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const cloudGuide = {
  capability: "Narrow later choices from an earlier answer",
  summary: "An earlier answer can limit the valid values of a later field. In this cloud deployment, each Account determines its available Regions. Changing an Account reloads those choices and checks the saved Region against them.",
  prompt: "Load sample data, then change the Primary account. Its saved Region remains visible but must belong to the new account's choices before you can submit. Recovery has its own choices. To see a failed lookup, select Fail next region lookup, change an account, then use Retry.",
  steps: [
    {
      id: "declare-region-choice",
      title: "Describe the dependency and valid choices",
      explanation: "The choice rule reads Account, loads its Regions through an application service, and checks whether the selected Region is among them.",
      filename: "declarations/cloud-deployment.ts",
      code: sourceExcerpt(declaration, "export const regionChoices = defineChoice({", "export const accounts = ["),
    },
    {
      id: "attach-region-choice",
      title: "Attach the rule to the later field",
      explanation: "Region uses that choice rule inside a reusable target section. Its options and validity now follow the Account selected for that target.",
      filename: "declarations/cloud-deployment.ts",
      code: sourceExcerpt(declaration, "export const DeploymentTarget = defineSection({", "// Reusing this definition carries its value contract and composition with it."),
    },
    {
      id: "compose-deployment-targets",
      title: "Use the rule independently",
      explanation: "Primary and Recovery reuse the section. Each Account narrows only its own Region choices, with separate lookup and validation state.",
      filename: "declarations/cloud-deployment.ts",
      code: sourceExcerpt(declaration, '  primary: DeploymentTarget.use({ id: "primary", bind: "primary" }),', '  resourceName: field(DeploymentName, { id: "deployment-name", bind: "resourceName" }),'),
    },
    {
      id: "show-region-request-state",
      title: "Show loading, failure and retry",
      explanation: "The bound field exposes its current choices, status and retry action. The form decides how to present them beside the Region control.",
      filename: "compositions/cloud-deployment.tsx",
      code: sourceExcerpt(composition, "function RegionField({ title, statusMessage }: { title: string; statusMessage?: string }) {", "function TargetStatus({ title, statusMessage }: { title: string; statusMessage?: string }) {"),
    },
  ],
  completeSources: [
    { label: "Form schema and choices", filename: "declarations/cloud-deployment.ts", code: declaration.trim() },
    { label: "Composition", filename: "compositions/cloud-deployment.tsx", code: composition.trim() },
    { label: "Host navigation", filename: "hooks/use-cloud-deployment.ts", code: coordination.trim() },
    { label: "Demo choice service", filename: "cloud-deployment.tsx", code: demo.trim() },
  ],
} satisfies FocusedGuide;
