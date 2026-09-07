import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { AdvancedOptions } from "./advanced-options";
import { SimpleForm } from "./simple-form";
import { EmailConfirmationExample } from "./email-confirmation";
import "./styles.css";

function App() {
  const [example, setExample] = useState<"simple" | "advanced" | "confirmation">("simple");
  return (
    <main>
      <header className="masthead"><a href="/" className="wordmark">formulate<span> / </span></a><span>React 19 · Prototype 01</span></header>
      <div className="intro">
        <p className="eyebrow">THE FIRST PRIMITIVES</p>
        <h1>Start with a form.<br /><span>Build from there.</span></h1>
        <p>Small examples exploring fields, composition, and the first steps of a workflow.</p>
      </div>
      <div className="workspace">
        <nav aria-label="Examples">
          <button className={example === "simple" ? "example-link selected" : "example-link"} aria-current={example === "simple" ? "page" : undefined} onClick={() => setExample("simple")}><span>01</span> Simple form</button>
          <button className={example === "advanced" ? "example-link selected" : "example-link"} aria-current={example === "advanced" ? "page" : undefined} onClick={() => setExample("advanced")}><span>02</span> Advanced options</button>
          <button className={example === "confirmation" ? "example-link selected" : "example-link"} aria-current={example === "confirmation" ? "page" : undefined} onClick={() => setExample("confirmation")}><span>03</span> Email confirmation</button>
          <p className="nav-note">Examples use local demo handlers. Switching examples starts a fresh form.</p>
        </nav>
        <article className="example-card">
          <div className="card-heading"><p className="eyebrow">{example === "advanced" ? "FORM + FIELD + SECTION + PAGE" : "FORM + FIELD"}</p><span className="badge">Interactive example</span></div>
          {example === "simple" ? <><h2>Welcome back</h2><p className="card-description">Two fields and one submit action. Everything a simple form needs.</p><SimpleForm onSignIn={() => undefined} /></> : example === "advanced" ? <AdvancedOptions onSave={() => undefined} /> : <EmailConfirmationExample />}
        </article>
      </div>
      <footer>Formulate <span>—</span> A small starting point for forms that grow.</footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
