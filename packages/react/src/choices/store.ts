import { createChoiceRequest } from "./request.js";
import type { BoundChoice, ChoiceRule, ChoiceView } from "./definition.js";

let nextStoreLifetime = 0;
export function createChoiceStore() {
  const storeLifetime = ++nextStoreLifetime;
  const entries = new Map<string, { binding: BoundChoice; request: ReturnType<typeof createChoiceRequest> }>();
  const listeners = new Set<() => void>();
  let revision = 0;

  function notify() {
    revision++;
    for (const listener of listeners) listener();
  }

  function getValidationMessage(binding: BoundChoice) {
    if (binding.requestKey === null) return binding.messages.missing;
    const entry = entries.get(binding.choiceId);
    if (
      !entry ||
      entry.binding.loader !== binding.loader ||
      entry.binding.rule !== binding.rule ||
      !entry.request.isCurrentForKey(binding.requestKey)
    ) {
      return binding.messages.pending;
    }

    const snapshot = entry.request.getSnapshot();
    if (snapshot.status === "idle" || snapshot.status === "pending") return binding.messages.pending;
    if (snapshot.status === "failed") return binding.messages.failed;
    return binding.validateSelection(snapshot.options);
  }

  return {
    getSnapshot: () => revision,
    getValidationRevision: () => `${storeLifetime}:${revision}`,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getValidationMessage,
    get<Values, Selection, Services, Option>(
      choiceId: string,
      rule: ChoiceRule<Values, Selection, Services, Option>,
    ): ChoiceView<Option> | undefined {
      const entry = entries.get(choiceId);
      if (!entry || entry.binding.rule !== rule) return undefined;

      const snapshot = entry.request.getSnapshot();
      return {
        ...snapshot,
        options: snapshot.options as readonly Option[],
        validationMessage: getValidationMessage(entry.binding),
        retry: entry.request.retry,
      };
    },
    syncBindings(choiceBindings: readonly BoundChoice[]) {
      const activeChoiceIds = new Set(choiceBindings.map(({ choiceId }) => choiceId));
      if (activeChoiceIds.size !== choiceBindings.length) {
        throw new Error("Dependent choices require unique choice IDs.");
      }

      for (const [choiceId, entry] of entries) {
        if (!activeChoiceIds.has(choiceId)) {
          entry.request.dispose();
          entries.delete(choiceId);
          notify();
        }
      }

      for (const binding of choiceBindings) {
        let entry = entries.get(binding.choiceId);
        if (entry && (entry.binding.loader !== binding.loader || entry.binding.rule !== binding.rule)) {
          entry.request.dispose();
          entries.delete(binding.choiceId);
          entry = undefined;
        }

        if (!entry) {
          entry = { binding, request: createChoiceRequest(binding.loader, notify) };
          entries.set(binding.choiceId, entry);
        }

        const fieldPathChanged = entry.binding.fieldPath !== binding.fieldPath;
        entry.binding = binding;
        if (fieldPathChanged) notify();
        entry.request.setInput(binding.input, binding.requestKey);
      }
    },
    clearRequests() {
      for (const entry of entries.values()) entry.request.dispose();
      entries.clear();
      notify();
    },
  };
}
