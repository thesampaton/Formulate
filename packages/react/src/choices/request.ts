import type { ChoiceLoader, ChoiceSnapshot } from "./definition.js";

/** AbortSignal also marks obsolete results when the service ignores cancellation. */
export function createChoiceRequest(loader: ChoiceLoader<unknown, unknown>, notify: () => void) {
  let snapshot: ChoiceSnapshot<unknown> = { status: "idle", options: [], revision: 0 };
  let input: unknown;
  let key: string | null = null;
  let controller: AbortController | undefined;
  function publish(next: Omit<ChoiceSnapshot<unknown>, "revision">) {
    snapshot = { ...next, revision: snapshot.revision + 1 }; notify();
  }
  function load(nextInput: unknown, nextKey: string | null) {
    controller?.abort();
    input = nextInput; key = nextKey;
    controller = new AbortController();
    const signal = controller.signal;
    publish({ status: key === null ? "idle" : "pending", options: [] });
    if (key === null) return;
    Promise.resolve().then(() => loader(nextInput, signal)).then(
      (options) => { if (!signal.aborted) publish({ status: "ready", options }); },
      () => { if (!signal.aborted) publish({ status: "failed", options: [] }); },
    );
  }
  return {
    getSnapshot: () => snapshot,
    setInput: (next: unknown, nextKey: string | null) => { if (!controller || controller.signal.aborted || nextKey !== key) load(next, nextKey); },
    current: (nextKey: string | null) => !!controller && !controller.signal.aborted && key === nextKey,
    retry: () => { if (controller && !controller.signal.aborted) load(input, key); },
    dispose: () => controller?.abort(),
  };
}
