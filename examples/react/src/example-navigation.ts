import type { ExampleName } from "./example-types";

type ExampleLink = { id: ExampleName; number: string; title: string };

export const guidePages = [
  { id: "overview", title: "Overview", href: "#/overview" },
  { id: "schema-driven", title: "Schema-driven forms", href: "#/schema-driven" },
] as const;

export const exampleGroups: { label: string; examples: ExampleLink[] }[] = [
  {
    label: "Examples · Foundations",
    examples: [
      { id: "simple", number: "00", title: "Form lifecycle" },
      { id: "schema", number: "01", title: "Schema composition" },
      { id: "advanced", number: "02", title: "Step validation" },
      { id: "confirmation", number: "03", title: "Cross-field validation" },
      { id: "customer", number: "04", title: "Retained drafts" },
      { id: "layout", number: "05", title: "Reusable layouts" },
    ],
  },
  {
    label: "Examples · Workflows",
    examples: [
      { id: "multiPage", number: "06", title: "Page completion" },
      { id: "employment", number: "07", title: "Reusable pages" },
      { id: "cloud", number: "08", title: "Dependent choices" },
      { id: "infrastructure", number: "09", title: "Stable repeated sections" },
    ],
  },
  {
    label: "Examples · Controls",
    examples: [
      { id: "controls", number: "10", title: "Interchangeable controls" },
      { id: "structured", number: "11", title: "Structured field values" },
      { id: "composed", number: "12", title: "Composed values" },
    ],
  },
];

export type SitePage = { id: (typeof guidePages)[number]["id"] | ExampleName; title: string };

export function getPage(hash: string): SitePage {
  const guide = guidePages.find((item) => hash === item.href);
  if (guide) return guide;
  const example = exampleGroups.flatMap((group) => group.examples)
    .find((item) => hash === `#/examples/${item.id}`);
  return example ?? { id: "overview", title: "Overview" };
}
