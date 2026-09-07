import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { AdvancedOptions } from "./advanced-options";
import { SimpleForm } from "./simple-form";
import "./styles.css";

function App() {
  const [example, setExample] = useState<"simple" | "advanced">("simple");
  return (
    <main>
      <header className="masthead"><a href="/" className="wordmark">formulate<span> / </span></a><span>React 19 · Prototype 01</span></header>
      <div className="intro">
        <p className="eyebrow">THE FIRST PRIMITIVES</p>
        <h1>Start with a form.<br /><span>Build from there.</span></h1>
        <p>Two small examples exploring fields, composition, and the first steps of a workflow.</p>
      </div>
      <div className="workspace">
        <nav aria-label="Examples">
          <button className={example === "simple" ? "example-link selected" : "example-link"} aria-current={example === "simple" ? "page" : undefined} onClick={() => setExample("simple")}><span>01</span> Simple form</button>
          <button className={example === "advanced" ? "example-link selected" : "example-link"} aria-current={example === "advanced" ? "page" : undefined} onClick={() => setExample("advanced")}><span>02</span> Advanced options</button>
          <p className="nav-note">Examples use local demo handlers. Switching examples starts a fresh form.</p>
        </nav>
        <article className="example-card">
          <div className="card-heading"><p className="eyebrow">{example === "simple" ? "FORM + FIELD" : "FORM + FIELD + SECTION + PAGE"}</p><span className="badge">Interactive example</span></div>
          {example === "simple" ? <><h2>Welcome back</h2><p className="card-description">Two fields and one submit action. Everything a simple form needs.</p><SimpleForm onSignIn={() => undefined} /></> : <AdvancedOptions onSave={() => undefined} />}
        </article>
      </div>
      <footer>Formulate <span>—</span> A small starting point for forms that grow.</footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
