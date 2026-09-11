import type { ChoiceLoader, ChoiceSnapshot } from "./definition.js";

/** AbortSignal also marks obsolete results when the service ignores cancellation. */
export function createChoiceRequest(loader: ChoiceLoader<unknown, unknown>, notify: () => void) {
  let snapshot: ChoiceSnapshot<unknown> = { status: "idle", options: [], revision: 0 };
  let requestInput: unknown;
  let requestKey: string | null = null;
  let abortController: AbortController | undefined;

  function publishSnapshot(next: Omit<ChoiceSnapshot<unknown>, "revision">) {
    snapshot = { ...next, revision: snapshot.revision + 1 };
    notify();
  }

  function startRequest(nextInput: unknown, nextRequestKey: string | null) {
    abortController?.abort();
    requestInput = nextInput;
    requestKey = nextRequestKey;
    abortController = new AbortController();
    const signal = abortController.signal;
    publishSnapshot({ status: requestKey === null ? "idle" : "pending", options: [] });
    if (requestKey === null) return;

    Promise.resolve().then(() => loader(nextInput, signal)).then(
      (options) => {
        if (!signal.aborted) publishSnapshot({ status: "ready", options });
      },
      () => {
        if (!signal.aborted) publishSnapshot({ status: "failed", options: [] });
      },
    );
  }

  return {
    getSnapshot: () => snapshot,
    setInput: (nextInput: unknown, nextRequestKey: string | null) => {
      if (!abortController || abortController.signal.aborted || nextRequestKey !== requestKey) {
        startRequest(nextInput, nextRequestKey);
      }
    },
    isCurrentForKey: (nextRequestKey: string | null) =>
      !!abortController && !abortController.signal.aborted && requestKey === nextRequestKey,
    retry: () => {
      if (abortController && !abortController.signal.aborted) {
        startRequest(requestInput, requestKey);
      }
    },
    dispose: () => abortController?.abort(),
  };
}
