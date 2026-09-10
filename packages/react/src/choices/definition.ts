export type Choice = { value: string; label: string };
export type ChoiceLoader<Input = string, Option = Choice> = (input: Input, signal: AbortSignal) => Promise<readonly Option[]>;
export type ChoiceSnapshot<Option = Choice> = {
  status: "idle" | "pending" | "ready" | "failed";
  options: readonly Option[];
  revision: number;
};
export type ChoiceView<Option = Choice> = ChoiceSnapshot<Option> & { problem: string | undefined; retry: () => void };

// Input and option types are erased only after defineChoice checks the local contract.
export type ResolvedChoice = {
  rule: object;
  input: unknown;
  key: string | null;
  loader: ChoiceLoader<any, any>;
  validate: (options: readonly any[]) => string | undefined;
  messages: { missing: string; pending: string; failed: string };
};
export type BoundChoice = ResolvedChoice & { id: string; name: string };
export type ChoiceRule<Values, Selection, Services, Option = Choice> = {
  resolve: (values: Values, selection: Selection, services: Services) => ResolvedChoice;
  /** Type witness used by the store's checked view lookup. */
  readonly optionType?: Option;
};

/** A local dependency and selection policy. null disables loading but retains the selection. */
export function defineChoice<Values, Selection, Services, Input, Option>(config: {
  input: (values: Values, services: Services) => Input | null;
  /** Equal keys mean interchangeable request inputs. Include every service input. */
  key: (input: Input) => string;
  loader: (services: Services) => ChoiceLoader<Input, Option>;
  validate: (selection: Selection, options: readonly Option[]) => string | undefined;
  messages: ResolvedChoice["messages"];
}): ChoiceRule<Values, Selection, Services, Option> {
  const rule: ChoiceRule<Values, Selection, Services, Option> = {
    resolve(values, selection, services) {
      const input = config.input(values, services);
      return { rule, input, key: input === null ? null : config.key(input), loader: config.loader(services),
        validate: (options) => config.validate(selection, options), messages: config.messages };
    },
  };
  return rule;
}
