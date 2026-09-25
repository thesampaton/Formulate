import type { exampleData } from "./data/example-data";

export type ExampleName = keyof typeof exampleData | "schema";
