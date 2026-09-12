import { ArrowRight, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FormAnatomy } from "@/components/form-anatomy";
import "./overview.css";

const workflow = [
  {
    number: "01",
    title: "Declare the values",
    api: "defineForm · defineSection",
    description: "Describe each field’s schema, starting value and control. Group related fields into reusable sections, with their own rules and presentation.",
  },
  {
    number: "02",
    title: "Compose the experience",
    api: "Form · Page · Section · Field",
    description: "Create one form instance. Arrange its fields and sections with ordinary React, then add pages and layouts where the experience needs them.",
  },
  {
    number: "03",
    title: "Connect the journey",
    api: "useFormNavigation · scopedAction",
    description: "Choose which page is visible, which errors block Continue, and where to take someone to fix a field. The answers stay in the same form.",
  },
  {
    number: "04",
    title: "Validate and submit",
    api: "onInvalid · onSubmit",
    description: "Continue checks the configured scope. Final submission validates the whole form and passes the schema’s parsed output to your save handler.",
  },
] as const;

const concepts = [
  { name: "Form", description: "Owns the shared editing state, validation and submission. One form can span many pages." },
  { name: "Page", description: "Presents a part of the experience. It can contain sections, individual fields or a review of existing values." },
  { name: "Section", description: "Packages related fields, rules and presentation for reuse. Each declared use binds to its own place in the form’s values." },
  { name: "Field", description: "Connects one declared value to its label, control, description and errors. The control renders your local shadcn component." },
  { name: "Layout", description: "Arranges content and action slots. Field groups, CSS grids and composed page layouts do not add values or validation rules." },
  { name: "Action", description: "Expresses an intent: check a scope and continue, navigate back, or validate and submit the complete form." },
] as const;

const nextExamples = [
  { href: "#/examples/simple", title: "Start with a sign-in form", description: "Two fields, one declaration and a submit action.", detail: "The essentials" },
  { href: "#/examples/multiPage", title: "Walk through a profile", description: "Sections, page navigation, validation and review.", detail: "The complete composition" },
  { href: "#/examples/employment", title: "Reuse a complete section", description: "One employment setup in two different forms.", detail: "Composition in practice" },
] as const;

export function Overview() {
  return (
    <article className="overview" aria-labelledby="overview-title">
      <header className="overview-intro">
        <p className="overview-eyebrow">THE BIG PICTURE</p>
        <h1 id="overview-title">One form.<br /><span>Composed from familiar parts.</span></h1>
        <p className="overview-lead">
          Formulate brings field definitions, reusable sections and your shadcn components
          together. Start with the values, then shape the experience around them.
        </p>
        <div className="overview-intro-actions">
          <a className={buttonVariants({ size: "lg" })} data-slot="button" href="#/examples/simple">
            Start with a simple form <ArrowRight aria-hidden="true" />
          </a>
          <a className="overview-text-link" href="#/examples/multiPage">Explore a multi-page form <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </header>

      <section className="overview-anatomy-section" aria-labelledby="anatomy-heading">
        <div className="overview-section-heading">
          <div>
            <p className="overview-eyebrow">THE BUILDING BLOCKS</p>
            <h2 id="anatomy-heading">Anatomy of a composed form</h2>
          </div>
          <span className="overview-figure-number">FIG. 01</span>
        </div>
        <p className="overview-section-intro">A page is one view into a shared form. Sections bring related fields together; layouts decide how they sit on the page.</p>
        <figure className="overview-anatomy">
          <p className="overview-diagram-hint">Scroll across to explore all the annotations <ArrowRight aria-hidden="true" /></p>
          <div className="overview-anatomy-scroll" tabIndex={0} role="region" aria-label="Form anatomy diagram; scroll horizontally on smaller screens">
            <FormAnatomy />
          </div>
          <figcaption>
            <span className="overview-caption-mark" aria-hidden="true" />
            <span>Based on the multi-page profile example. The name section and the email field share a page, while delivery and notification details live on other pages.</span>
          </figcaption>
        </figure>
      </section>

      <section className="overview-flow-section" aria-labelledby="flow-heading">
        <p className="overview-eyebrow">HOW IT COMES TOGETHER</p>
        <h2 id="flow-heading">From a definition to a working form.</h2>
        <ol className="overview-workflow">
          {workflow.map((step) => (
            <li key={step.number}>
              <div className="overview-step-top"><span>{step.number}</span><ArrowRight aria-hidden="true" /></div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <code>{step.api}</code>
            </li>
          ))}
        </ol>
      </section>

      <section className="overview-model-section" aria-labelledby="model-heading">
        <div className="overview-model-intro">
          <p className="overview-eyebrow">A USEFUL DISTINCTION</p>
          <h2 id="model-heading">The values have a structure.<br />The screen has a composition.</h2>
          <p>A declared section creates a reusable value group. A page chooses what to show. Moving a section to another page does not change the paths of its fields.</p>
          <div className="overview-path-example" aria-label="Example field path">
            <span>For example</span>
            <code>name<span>.</span>firstName</code>
            <p>The field belongs to the <strong>name</strong> section, wherever you render it.</p>
          </div>
          <p className="overview-model-note">Composition stays flexible: pages can hold fields directly, and a reusable section can also supply page presentation.</p>
        </div>
        <dl className="overview-concepts">
          {concepts.map((concept) => (
            <div key={concept.name}>
              <dt>{concept.name}</dt>
              <dd>{concept.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <aside className="overview-application" aria-labelledby="application-heading">
        <div className="overview-application-symbol" aria-hidden="true">↳</div>
        <div>
          <h2 id="application-heading">Your application connects the bigger picture.</h2>
          <p>Formulate supplies definitions, bindings, validation and navigation primitives. Your application chooses which branches appear, how completion is determined, and when to save a draft or submit to a service. React Hook Form manages editing state; Zod checks the values.</p>
        </div>
      </aside>

      <section className="overview-next-section" aria-labelledby="next-heading">
        <p className="overview-eyebrow">SEE IT IN PRACTICE</p>
        <h2 id="next-heading">Follow the idea into the code.</h2>
        <p className="overview-section-intro">Each example pairs a working form with its declarations, composition and local components.</p>
        <div className="overview-next-grid">
          {nextExamples.map((example) => (
            <a className="overview-next-link" href={example.href} key={example.href}>
              <div className="overview-next-meta"><span>{example.detail}</span><ArrowUpRight aria-hidden="true" /></div>
              <h3>{example.title}</h3>
              <p>{example.description}</p>
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
