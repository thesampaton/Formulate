import { defineChoice, defineForm, defineSection } from "@formulate/react";
import type { ChoiceLoader } from "@formulate/react";
import { z } from "zod";

const rule = defineChoice({
  input: (values: { account: string }) => values.account || null,
  key: (input: string) => input,
  loader: (services: { load: ChoiceLoader<string, number> }) => services.load,
  validate: (selection: number, options: readonly number[]) => options.includes(selection) ? undefined : "Unavailable",
  messages: { missing: "Missing", pending: "Pending", failed: "Failed" },
});
const section = defineSection({
  account: { schema: z.string(), defaultValue: "", label: "Account", component: "input" },
  selection: { schema: z.number(), defaultValue: 0, label: "Selection", component: "number", choices: rule },
});
const root = defineForm({ first: section, second: section });
const load: ChoiceLoader<string, number> = async () => [1];
root.bindChoices({ values: root.defaultValues, services: { load } });
// @ts-expect-error Nested choice definitions retain their required service contract.
root.bindChoices({ values: root.defaultValues, services: {} });
// @ts-expect-error A loader's options must match the rule's membership policy.
root.bindChoices({ values: root.defaultValues, services: { load: async () => ["wrong"] } });
section.bindChoices({ values: { a: "", b: 1 }, services: { load }, bindings: { account: "a", selection: "b" } });
// @ts-expect-error Binding a numeric selection to a string editing path is incompatible.
section.bindChoices({ values: { a: "", b: "" }, services: { load }, bindings: { account: "a", selection: "b" } });
defineSection({
  account: { schema: z.string(), defaultValue: "", label: "Account", component: "input" },
  // @ts-expect-error A numeric policy cannot be attached to a string selection.
  selection: { schema: z.string(), defaultValue: "", label: "Selection", component: "input", choices: rule },
});
defineSection({
  // @ts-expect-error The rule requires a local account dependency, absent from this definition.
  selection: { schema: z.number(), defaultValue: 0, label: "Selection", component: "number", choices: rule },
});
