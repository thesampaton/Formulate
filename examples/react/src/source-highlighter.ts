import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

export type SourceLanguage = "tsx" | "typescript";
export type HighlightedToken = { content: string; htmlStyle?: Record<string, string> };
export type HighlightedLines = HighlightedToken[][];

let highlighterPromise: ReturnType<typeof createHighlighterCore> | undefined;
const results = new Map<string, Promise<HighlightedLines>>();

function getHighlighter() {
  highlighterPromise ??= Promise.all([
    import("@shikijs/langs/tsx"),
    import("@shikijs/langs/typescript"),
    import("@shikijs/themes/github-light"),
    import("@shikijs/themes/github-dark"),
  ]).then(([tsx, typescript, githubLight, githubDark]) => createHighlighterCore({
    themes: [githubLight.default, githubDark.default],
    langs: [tsx.default, typescript.default],
    engine: createJavaScriptRegexEngine(),
  }));
  return highlighterPromise;
}

export function highlightSource(code: string, language: SourceLanguage): Promise<HighlightedLines> {
  const key = `${language}\0${code}`;
  let result = results.get(key);
  if (!result) {
    result = getHighlighter().then((highlighter) => highlighter.codeToTokens(code, {
      lang: language,
      themes: { light: "github-light", dark: "github-dark" },
    }).tokens);
    results.set(key, result);
    void result.catch(() => results.delete(key));
  }
  return result;
}
