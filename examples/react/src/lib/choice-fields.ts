import { createChoiceRequest } from "./choice-request";
import type { ChoiceLoader, ChoiceRequest } from "./choice-request";

let nextLifetime = 0;

/** Each use ID owns a request lifetime. A field moving to another index keeps
 * that lifetime; removal, restoration or service replacement ends it. */
export function createChoiceFields(loader: ChoiceLoader) {
  const lifetime = ++nextLifetime;
  const entries = new Map<string, { request: ChoiceRequest; unsubscribe: () => void }>();
  const listeners = new Set<() => void>();
  let revision = 0;
  function notify() { revision++; for (const listener of listeners) listener(); }
  return {
    getSnapshot: () => revision,
    getValidationRevision: () => `${lifetime}:${revision}`,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    get: (id: string) => entries.get(id)?.request,
    sync(fields: readonly { id: string; input: string }[]) {
      const current = new Set(fields.map(({ id }) => id));
      for (const [id, entry] of entries) if (!current.has(id)) {
        entry.unsubscribe(); entry.request.dispose(); entries.delete(id); notify();
      }
      for (const { id, input } of fields) {
        let entry = entries.get(id);
        if (!entry) {
          const request = createChoiceRequest(loader);
          entry = { request, unsubscribe: request.subscribe(notify) };
          entries.set(id, entry);
        }
        entry.request.setInput(input);
      }
    },
    clear() {
      for (const entry of entries.values()) { entry.unsubscribe(); entry.request.dispose(); }
      entries.clear(); notify();
    },
  };
}
