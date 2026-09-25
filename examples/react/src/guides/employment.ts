/// <reference types="vite/client" />
import employment from "../declarations/employment.ts?raw";
import workflows from "../declarations/employee-workflows.ts?raw";
import page from "../components/formulate/employment-setup.tsx?raw";
import onboarding from "../compositions/employee-onboarding.tsx?raw";
import transfer from "../compositions/internal-transfer.tsx?raw";
import type { FocusedGuide } from "../focused-example";
import { sourceExcerpt } from "../source-excerpt";

export const employmentGuide = {
  capability: "Reuse one page presentation in different forms",
  summary: "A page can render a shared section without deciding where its values live or where Continue goes next. Here the same Employment page appears in onboarding and transfer, while each form supplies its own binding, navigation and submission.",
  prompt: "Load sample data, then change the manager in the onboarding form. The transfer form keeps its own manager. Select Continue in each form to see its own fields checked and its own next page opened.",
  steps: [
    {
      id: "compose-employment-forms",
      title: "Reuse the section's value contract",
      explanation: "Both forms use the same Employment definition and rules. Onboarding stores it under employment; transfer stores it under proposedEmployment.",
      filename: "declarations/employee-workflows.ts",
      code: sourceExcerpt(workflows, "export const EmployeeOnboarding = defineForm({", "export type EmployeeOnboardingValues = z.input<typeof EmployeeOnboarding.schema>;"),
    },
    {
      id: "present-employment-page",
      title: "Render one page presentation",
      explanation: "The shared page displays fields from whichever Employment section its host binds. The page does not own a value path or decide the next destination.",
      filename: "components/formulate/employment-setup.tsx",
      code: sourceExcerpt(page, "export function EmploymentSetup({ pageId, active, layout = FieldGroup }: {", "/** Reads an existing section; it registers no additional editors. */"),
    },
    {
      id: "bind-onboarding-page",
      title: "Let one host supply its context",
      explanation: "Onboarding binds Employment at its own path. Its navigation treats that scope and the additional Equipment field as separate destinations.",
      filename: "compositions/employee-onboarding.tsx",
      code: sourceExcerpt(onboarding, '  const setup = EmployeeOnboarding.bindSection("employment");', '  const equipment = useWatch({ control: form.control, name: "equipment" });'),
    },
    {
      id: "bind-transfer-page",
      title: "Bind the same page in another host",
      explanation: "Transfer binds the shared section at proposedEmployment and sets up its own route to review. The page presentation needs no changes.",
      filename: "compositions/internal-transfer.tsx",
      code: sourceExcerpt(transfer, '  const setup = InternalTransfer.bindSection("proposedEmployment");', '    <Page pageId="transfer-review" title="Review transfer" active={navigation.page === "review"} layout={FieldGroup}>'),
    },
  ],
  completeSources: [
    { label: "Shared Employment section", filename: "declarations/employment.ts", code: employment.trim() },
    { label: "Shared page presentation", filename: "components/formulate/employment-setup.tsx", code: page.trim() },
    { label: "Onboarding composition", filename: "compositions/employee-onboarding.tsx", code: onboarding.trim() },
    { label: "Transfer composition", filename: "compositions/internal-transfer.tsx", code: transfer.trim() },
  ],
} satisfies FocusedGuide;
