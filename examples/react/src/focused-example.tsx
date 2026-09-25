import { useId, useState, type ReactNode } from "react";
import { SourceCode } from "./source-code";

export type FocusedSource = {
  filename: string;
  code: string;
};

export type FocusedStep = FocusedSource & {
  id: string;
  title: string;
  explanation: string;
};

export type FocusedGuide = {
  capability: string;
  summary: string;
  prompt: string;
  steps: readonly FocusedStep[];
  completeSources: readonly (FocusedSource & { label: string })[];
};

function SourceDisclosure({ source }: { source: FocusedGuide["completeSources"][number] }) {
  const [open, setOpen] = useState(false);

  return <details className="focused-source-disclosure" onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary>{source.label}<span>{source.filename}</span><span className="focused-source-icon" aria-hidden="true">{open ? "−" : "+"}</span></summary>
    {open ? <SourceCode {...source} complete /> : null}
  </details>;
}

export function FocusedExample({ title, guide, children, wideDemo = false }: { title: string; guide: FocusedGuide; children: ReactNode; wideDemo?: boolean }) {
  const id = useId();

  return <div className="focused-example">
    <div className="example-intro">
      <p className="eyebrow">LEARN BY EXAMPLE</p>
      <h1>{title}</h1>
      <p>{guide.summary}</p>
      <div className="focused-capability"><span>New here</span><strong>{guide.capability}</strong></div>
    </div>

    <section className={`focused-demo${wideDemo ? " focused-demo-wide" : ""}`} aria-labelledby={`${id}-demo`}>
      <div className="focused-section-heading">
        <div>
          <h2 id={`${id}-demo`}>Try it</h2>
          <p>{guide.prompt}</p>
        </div>
      </div>
      <div className="example-card">{children}</div>
    </section>

    <section className="focused-walkthrough" aria-labelledby={`${id}-walkthrough`}>
      <div className="focused-section-heading">
        <div>
          <h2 id={`${id}-walkthrough`}>How it works</h2>
          <p>Each excerpt comes from the working example. Open the complete files below when you need the surrounding setup.</p>
        </div>
      </div>
      <ol className="focused-steps" role="list">
        {guide.steps.map((step, index) => <li key={step.id} id={step.id} role="listitem">
          <div className="focused-step-heading">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{step.title}</h3><p>{step.explanation}</p></div>
          </div>
          <SourceCode filename={step.filename} code={step.code} label={step.title} />
        </li>)}
      </ol>
    </section>

    <section className="focused-complete-sources" aria-labelledby={`${id}-sources`}>
      <h2 id={`${id}-sources`}>Complete source</h2>
      <p>Open the original files for imports, setup, and surrounding implementation.</p>
      {guide.completeSources.map((source) => <SourceDisclosure key={source.filename} source={source} />)}
    </section>
  </div>;
}
