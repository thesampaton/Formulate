import { lazy, Suspense } from "react";
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
const ControlGalleryExample = lazy(() => import("./control-gallery").then((module) => ({ default: module.ControlGalleryExample })));
const CodePanel = lazy(() => import("./code-panel"));

function ExampleForm({ example }: { example: ExampleName }) {
  switch (example) {
    case "simple": return <><h2>Welcome back</h2><p className="card-description">Two fields and one submit action. Everything a simple form needs.</p><SimpleForm onSignIn={() => undefined} /></>;
    case "advanced": return <AdvancedOptions onSave={() => undefined} />;
    case "confirmation": return <EmailConfirmationExample />;
    case "customer": return <CustomerOnboarding onCreate={() => undefined} />;
    case "layout": return <ResponsiveLayout />;
    case "multiPage": return <MultiPageExample />;
    case "employment": return <EmployeeWorkflowsExample />;
    case "cloud": return <CloudDeploymentExample />;
    case "infrastructure": return <InfrastructureExample />;
    case "structured": return <StructuredEditingExample />;
    case "controls": return <ControlGalleryExample />;
  }
}

export default function ExamplePage({ example, title }: { example: ExampleName; title: string }) {
  const hasPages = ["advanced", "customer", "multiPage", "employment", "cloud", "infrastructure"].includes(example);
  return (
    <>
      <div className="example-intro">
        <p className="eyebrow">LEARN BY EXAMPLE</p>
        <h1>{title}</h1>
        <p>Edit the form, then explore the declaration, composition, and reusable pieces behind it.</p>
      </div>
      <div className="example-content">
        <article className="example-card">
          <div className="card-heading"><p className="eyebrow">{hasPages ? "FORM + FIELD + SECTION + PAGE" : example === "layout" ? "FORM + SECTION + LAYOUT" : "FORM + FIELD"}</p><span className="badge">Interactive example</span></div>
          <Suspense fallback={<p role="status">Loading form…</p>}><ExampleForm example={example} /></Suspense>
        </article>
        <Suspense fallback={<section className="code-panel code-loading" aria-label="Code"><p>Loading code…</p></section>}>
          <CodePanel example={example} />
        </Suspense>
      </div>
    </>
  );
}
