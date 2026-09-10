import { createChoiceRequest } from "./request.js";
import type { BoundChoice, ChoiceRule, ChoiceView } from "./definition.js";

let nextLifetime = 0;
export function createChoiceStore() {
  const lifetime = ++nextLifetime;
  const entries = new Map<string, { field: BoundChoice; request: ReturnType<typeof createChoiceRequest> }>();
  const listeners = new Set<() => void>();
  let revision = 0;
  function notify() { revision++; for (const listener of listeners) listener(); }
  function problem(field: BoundChoice) {
    if (field.key === null) return field.messages.missing;
    const entry = entries.get(field.id);
    if (!entry || entry.field.loader !== field.loader || entry.field.rule !== field.rule || !entry.request.current(field.key)) return field.messages.pending;
    const snapshot = entry.request.getSnapshot();
    if (snapshot.status === "idle" || snapshot.status === "pending") return field.messages.pending;
    if (snapshot.status === "failed") return field.messages.failed;
    return field.validate(snapshot.options);
  }
  return {
    getSnapshot: () => revision,
    getValidationRevision: () => `${lifetime}:${revision}`,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    problem,
    get<Values, Selection, Services, Option>(id: string, rule: ChoiceRule<Values, Selection, Services, Option>): ChoiceView<Option> | undefined {
      const entry = entries.get(id);
      if (!entry || entry.field.rule !== rule) return undefined;
      const snapshot = entry.request.getSnapshot();
      return { ...snapshot, options: snapshot.options as readonly Option[], problem: problem(entry.field), retry: entry.request.retry };
    },
    sync(fields: readonly BoundChoice[]) {
      const current = new Set(fields.map(({ id }) => id));
      if (current.size !== fields.length) throw new Error("Dependent choices require unique use IDs.");
      for (const [id, entry] of entries) if (!current.has(id)) {
        entry.request.dispose(); entries.delete(id); notify();
      }
      for (const field of fields) {
        let entry = entries.get(field.id);
        if (entry && (entry.field.loader !== field.loader || entry.field.rule !== field.rule)) {
          entry.request.dispose(); entries.delete(field.id); entry = undefined;
        }
        if (!entry) {
          entry = { field, request: createChoiceRequest(field.loader, notify) };
          entries.set(field.id, entry);
        }
        const moved = entry.field.name !== field.name;
        entry.field = field;
        if (moved) notify();
        entry.request.setInput(field.input, field.key);
      }
    },
    clear() {
      for (const entry of entries.values()) entry.request.dispose();
      entries.clear(); notify();
    },
  };
}
