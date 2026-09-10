export type Choice = { value: string; label: string };
export type ChoiceLoader = (input: string, signal: AbortSignal) => Promise<readonly Choice[]>;
export type ChoiceSnapshot = {
  input: string;
  status: "idle" | "pending" | "ready" | "failed";
  options: readonly Choice[];
  revision: number;
};

/** Request evidence only. Selected values stay in RHF. A request generation,
 * not account equality or cancellation support, determines which result wins. */
export function createChoiceRequest(loader: ChoiceLoader) {
  let snapshot: ChoiceSnapshot = { input: "", status: "idle", options: [], revision: 0 };
  let generation = 0;
  let active = false;
  let controller: AbortController | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: Omit<ChoiceSnapshot, "revision">) => {
    snapshot = { ...next, revision: snapshot.revision + 1 };
    for (const listener of listeners) listener();
  };
  function load(input: string) {
    controller?.abort();
    const attempt = ++generation;
    active = true;
    controller = new AbortController();
    const signal = controller.signal;
    publish({ input, status: input ? "pending" : "idle", options: [] });
    if (!input) return;
    Promise.resolve().then(() => loader(input, signal)).then(
      (options) => { if (active && attempt === generation) publish({ input, status: "ready", options }); },
      () => { if (active && attempt === generation) publish({ input, status: "failed", options: [] }); },
    );
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setInput: (input: string) => { if (!active || input !== snapshot.input) load(input); },
    retry: () => load(snapshot.input),
    dispose: () => { active = false; generation++; controller?.abort(); },
    problem(input: string, selection: string): string | undefined {
      if (!input) return "Choose an account first.";
      if (!active || snapshot.input !== input || snapshot.status === "idle" || snapshot.status === "pending") return "Checking available choices…";
      if (snapshot.status === "failed") return "Choices could not be loaded. Retry to continue.";
      if (!selection) return "Choose an available option.";
      if (!snapshot.options.some((option) => option.value === selection)) return "The retained choice is unavailable. Choose another option.";
    },
  };
}
export type ChoiceRequest = ReturnType<typeof createChoiceRequest>;
