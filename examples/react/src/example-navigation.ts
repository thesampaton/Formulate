import type { ExampleName } from "./example-code";

type ExampleLink = { id: ExampleName; number: string; title: string };

export const exampleGroups: { label: string; examples: ExampleLink[] }[] = [
  {
    label: "Examples · Foundations",
    examples: [
      { id: "simple", number: "01", title: "Simple form" },
      { id: "advanced", number: "02", title: "Advanced options" },
      { id: "confirmation", number: "03", title: "Email confirmation" },
      { id: "customer", number: "04", title: "Customer onboarding" },
      { id: "layout", number: "05", title: "Reusable layouts" },
    ],
  },
  {
    label: "Examples · Workflows",
    examples: [
      { id: "multiPage", number: "06", title: "Multi-page form" },
      { id: "employment", number: "07", title: "Reusable employment page" },
      { id: "cloud", number: "08", title: "Cloud deployment" },
      { id: "infrastructure", number: "09", title: "Infrastructure drafts" },
    ],
  },
  {
    label: "Examples · Controls",
    examples: [
      { id: "structured", number: "10", title: "Structured pickers" },
      { id: "controls", number: "11", title: "Control gallery" },
    ],
  },
];

export type SitePage = { id: "overview" | ExampleName; title: string };

export function getPage(hash: string): SitePage {
  const example = exampleGroups.flatMap((group) => group.examples)
    .find((item) => hash === `#/examples/${item.id}`);
  return example ?? { id: "overview", title: "Overview" };
}
