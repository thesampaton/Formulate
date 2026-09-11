import { Button } from "@/components/ui/button";
import { lazy, Suspense, useState } from "react";
import type { ExampleName } from "./example-code";
import { AdvancedOptions } from "./advanced-options";
import { SimpleForm } from "./simple-form";
import { EmailConfirmationExample } from "./email-confirmation";
import { CustomerOnboarding } from "./customer-onboarding";

import { MultiPageExample } from "./multi-page-form";
import { ResponsiveLayout } from "./responsive-layout";
const EmployeeWorkflowsExample = lazy(() => import("./employee-workflows").then((module) => ({ default: module.EmployeeWorkflowsExample })));
const CloudDeploymentExample = lazy(() => import("./cloud-deployment").then((module) => ({ default: module.CloudDeploymentExample })));
const InfrastructureExample = lazy(() => import("./infrastructure").then((module) => ({ default: module.InfrastructureExample })));

const StructuredEditingExample = lazy(() => import("./structured-editing").then((module) => ({ default: module.StructuredEditingExample })));

const CodePanel = lazy(() => import("./code-panel"));

export function App() {
  const [example, setExample] = useState<ExampleName>("simple");
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
          <Button variant="ghost" className={example === "simple" ? "example-link selected" : "example-link"} aria-current={example === "simple" ? "page" : undefined} onClick={() => setExample("simple")}><span>01</span> Simple form</Button>
          <Button variant="ghost" className={example === "advanced" ? "example-link selected" : "example-link"} aria-current={example === "advanced" ? "page" : undefined} onClick={() => setExample("advanced")}><span>02</span> Advanced options</Button>
          <Button variant="ghost" className={example === "confirmation" ? "example-link selected" : "example-link"} aria-current={example === "confirmation" ? "page" : undefined} onClick={() => setExample("confirmation")}><span>03</span> Email confirmation</Button>
          <Button variant="ghost" className={example === "customer" ? "example-link selected" : "example-link"} aria-current={example === "customer" ? "page" : undefined} onClick={() => setExample("customer")}><span>04</span> Customer onboarding</Button>
          <Button variant="ghost" className={example === "layout" ? "example-link selected" : "example-link"} aria-current={example === "layout" ? "page" : undefined} onClick={() => setExample("layout")}><span>05</span> Reusable layouts</Button>
          <Button variant="ghost" className={example === "multiPage" ? "example-link selected" : "example-link"} aria-current={example === "multiPage" ? "page" : undefined} onClick={() => setExample("multiPage")}><span>06</span> Multi-page form</Button>
          <Button variant="ghost" className={example === "employment" ? "example-link selected" : "example-link"} aria-current={example === "employment" ? "page" : undefined} onClick={() => setExample("employment")}><span>07</span> Reusable employment page</Button>
          <Button variant="ghost" className={example === "cloud" ? "example-link selected" : "example-link"} aria-current={example === "cloud" ? "page" : undefined} onClick={() => setExample("cloud")}><span>08</span> Cloud deployment</Button>
          <Button variant="ghost" className={example === "infrastructure" ? "example-link selected" : "example-link"} aria-current={example === "infrastructure" ? "page" : undefined} onClick={() => setExample("infrastructure")}><span>09</span> Infrastructure drafts</Button>
          <Button variant="ghost" className={example === "structured" ? "example-link selected" : "example-link"} aria-current={example === "structured" ? "page" : undefined} onClick={() => setExample("structured")}><span>10</span> Structured pickers</Button>
          <p className="nav-note">Examples use local demo handlers. Switching examples starts a fresh form.</p>
        </nav>
        <div className="example-content">
          <article className="example-card">
            <div className="card-heading"><p className="eyebrow">{example === "advanced" || example === "customer" || example === "multiPage" || example === "employment" || example === "cloud" || example === "infrastructure" ? "FORM + FIELD + SECTION + PAGE" : example === "layout" ? "FORM + SECTION + LAYOUT" : "FORM + FIELD"}</p><span className="badge">Interactive example</span></div>
            {example === "structured" ? <Suspense fallback={<p>Loading pickers…</p>}><StructuredEditingExample /></Suspense> : example === "simple" ? <><h2>Welcome back</h2><p className="card-description">Two fields and one submit action. Everything a simple form needs.</p><SimpleForm onSignIn={() => undefined} /></> : example === "advanced" ? <AdvancedOptions onSave={() => undefined} /> : example === "confirmation" ? <EmailConfirmationExample /> : example === "customer" ? <CustomerOnboarding onCreate={() => undefined} /> : example === "layout" ? <ResponsiveLayout /> : example === "employment" ? <Suspense fallback={<p>Loading employment forms…</p>}><EmployeeWorkflowsExample /></Suspense> : example === "cloud" ? <Suspense fallback={<p>Loading deployment…</p>}><CloudDeploymentExample /></Suspense> : example === "infrastructure" ? <Suspense fallback={<p>Loading infrastructure…</p>}><InfrastructureExample /></Suspense> : <MultiPageExample />}
          </article>
          <Suspense fallback={<section className="code-panel code-loading" aria-label="Code"><p>Loading code…</p></section>}>
            <CodePanel key={example} example={example} />
          </Suspense>
        </div>
      </div>
      <footer>Formulate <span>—</span> A small starting point for forms that grow.</footer>
    </main>
  );
}
