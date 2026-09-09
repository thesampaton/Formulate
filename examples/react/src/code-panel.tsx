import { Button } from "@/components/ui/button";
import { useId, useState } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { codeCategories, exampleCode } from "./example-code";
import type { CodeCategory, ExampleName } from "./example-code";

// Only TypeScript and the JSX markup grammar; no DOM scanning or editor runtime.
const highlighter = hljs.newInstance();
highlighter.registerLanguage("xml", xml);
highlighter.registerLanguage("typescript", typescript);
const highlighted = new Map(Object.values(exampleCode).flat().map((snippet) => [
  snippet.code, highlighter.highlight(snippet.code, { language: "typescript" }).value,
]));

export default function CodePanel({ example }: { example: ExampleName }) {
  const id = useId();
  const [selected, setSelected] = useState("Composition");
  const snippets = exampleCode[example];
  const snippet = snippets.find(({ label }) => label === selected) ?? snippets[0];
  return <section className="code-panel" aria-labelledby={`${id}-heading`}>
    <div className="code-heading">
      <h2 id={`${id}-heading`}><span aria-hidden="true">{"</>"}</span> Code</h2>
      <span className="code-language">{snippet.filename.endsWith(".json") ? "JSON" : "TSX"} · Read only</span>
    </div>
    <p className="code-description">Explore this form and the building blocks it uses. Each category describes a responsibility; registry items describe how the code is installed.</p>
    <div className="code-views" role="group" aria-label="Code categories">
      {(Object.keys(codeCategories) as CodeCategory[]).filter((category) => snippets.some((item) => item.category === category)).map((category) =>
        <Button variant="ghost" key={category} type="button" aria-pressed={snippet.category === category}
          aria-controls={`${id}-excerpts`} onClick={() => setSelected(snippets.find((item) => item.category === category)!.label)}>
          {codeCategories[category].label}
        </Button>)}
    </div>
    <p className="code-category-description">{codeCategories[snippet.category].description}</p>
    <div id={`${id}-excerpts`} className="code-views" role="group" aria-label="Code excerpts">
      {snippets.filter((item) => item.category === snippet.category).map(({ label }) =>
        <Button variant="ghost" key={label} type="button" aria-pressed={snippet.label === label}
          aria-controls={`${id}-source`} onClick={() => setSelected(label)}>{label}</Button>)}
    </div>
    <div className="code-context">
      <p>{snippet.description}</p>
      <p>{snippet.provenance ?? (snippet.registryItem ? <>Source registry item: <code>{snippet.registryItem}</code></> : "Local source · no registry item yet")}</p>
    </div>
    <div className="code-file"><span>{snippet.filename}</span><span>{snippet.code.split("\n").length} lines</span></div>
    <pre key={`${example}-${snippet.label}`} id={`${id}-source`} className="code-source" role="region" tabIndex={0}
      aria-label={`${snippet.label} source code`}>
      {/* highlight() escapes the checked-in source before adding token spans. */}
      <code className="hljs language-typescript" dangerouslySetInnerHTML={{ __html: highlighted.get(snippet.code)! }} />
    </pre>
  </section>;
}
