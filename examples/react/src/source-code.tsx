import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { Check, Copy } from "lucide-react";
import type { HighlightedLines, SourceLanguage } from "./source-highlighter";

type SourceCodeProps = {
  filename: string;
  code: string;
  label: string;
  complete?: boolean;
  kind?: "Excerpt" | "Usage example";
};

export function SourceCode({ filename, code, label, complete = false, kind = "Excerpt" }: SourceCodeProps) {
  const language: SourceLanguage = filename.endsWith(".tsx") ? "tsx" : "typescript";
  const [highlighted, setHighlighted] = useState<HighlightedLines | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    let current = true;
    setHighlighted(null);
    void import("./source-highlighter")
      .then(({ highlightSource }) => highlightSource(code, language))
      .then((lines) => { if (current) setHighlighted(lines); })
      .catch(() => { /* Keep the readable plain-code fallback if highlighting fails. */ });
    return () => { current = false; };
  }, [code, language]);

  const lines: HighlightedLines = highlighted ?? code.split("\n").map((content) => [{ content }]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return <div className="source-code">
    <div className="source-code-heading">
      <span className="source-code-filename">{filename}</span>
      <div className="source-code-actions">
        <span>{language === "tsx" ? "TSX" : "TS"} · {complete ? "Complete source" : kind}</span>
        <button type="button" className="source-code-copy" onClick={() => { void copyCode(); }} aria-label={`Copy ${label} code`}>
          {copyState === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy"}
        </button>
        <span className="sr-only" role="status">{copyState === "copied" ? `${label} copied to clipboard` : copyState === "error" ? `Unable to copy ${label}` : ""}</span>
      </div>
    </div>
    <pre className="source-code-body" role="region" aria-label={`${label} source code`} tabIndex={0}>
      <code>{lines.map((line, index) => <Fragment key={index}>
        <span className="source-code-line">
          <span className="source-code-line-number" aria-hidden="true">{index + 1}</span>
          <span className="source-code-line-text">{line.map((token, tokenIndex) => <span className="source-code-token" key={tokenIndex} style={token.htmlStyle as CSSProperties | undefined}>{token.content}</span>)}</span>
        </span>
        {index < lines.length - 1 ? "\n" : null}
      </Fragment>)}</code>
    </pre>
  </div>;
}
