import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import workshopSource from "./compositions/workshop-registration.tsx?raw";
import { fieldKeys, definitionKeys, relationshipKeys, conditionKeys } from "./data/schema-reference";
import type { SchemaKeyReference } from "./data/schema-reference";
import { SourceCode } from "./source-code";
import { sourceExcerpt } from "./source-excerpt";
import "./schema-driven-guide.css";

const contents = [
  ["whole-form", "Schema walkthrough"],
  ["schema-structure", "Structure"],
  ["field-keys", "Field keys"],
  ["definition-options", "Form & section options"],
  ["conditions", "Conditions & relationships"],
  ["schema-values", "Values & payload"],
] as const;

function KeyReference({ title, rows }: { title: string; rows: readonly SchemaKeyReference[] }) {
  return <div className="schema-reference-scroll" tabIndex={0} role="region" aria-label={`${title}; scroll horizontally on smaller screens`}>
    <table className="schema-reference schema-reference-keys" role="table">
      <caption className="sr-only">{title}</caption>
      <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Key</th><th scope="col" role="columnheader">Accepted value / example</th><th scope="col" role="columnheader">Meaning</th></tr></thead>
      <tbody role="rowgroup">{rows.map((row) => <tr key={row.key} role="row">
        <th scope="row" role="rowheader"><code>{row.key}</code></th>
        <td role="cell"><span>{row.accepts}</span><code className="schema-key-example">{row.example}</code></td>
        <td role="cell"><p>{row.description}</p>{row.defaultValue ? <p className="schema-key-default">{row.defaultValue}</p> : null}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function jumpTo(id: string) {
  const heading = document.getElementById(id);
  heading?.scrollIntoView({ block: "start" });
  heading?.focus({ preventScroll: true });
}

export default function SchemaDrivenGuide() {
  return <article className="schema-guide" aria-labelledby="schema-guide-title">
    <header className="schema-guide-intro">
      <p className="schema-guide-eyebrow">START HERE · AUTHORING</p>
      <h1 id="schema-guide-title">Schema-driven forms</h1>
      <p className="schema-guide-lead">Define the values, rules and structure together. Formulate uses that schema to render the form, validate answers and build the submitted payload.</p>
      <a className={buttonVariants()} data-slot="button" href="#/examples/schema">Try schema composition <ArrowRight aria-hidden="true" /></a>
    </header>

    <nav className="schema-guide-contents" aria-label="On this page">
      {contents.map(([id, label]) => <button key={id} type="button" onClick={() => jumpTo(id)} aria-controls={id}>{label}</button>)}
    </nav>

    <section aria-labelledby="whole-form">
      <p className="schema-guide-eyebrow">01 · SCHEMA WALKTHROUGH</p>
      <h2 id="whole-form" tabIndex={-1}>One schema, one form</h2>
      <p><code>defineForm</code> composes a contact section with its fields and rules. The form renders that hierarchy through <code>WorkshopRegistration.Fields</code>.</p>
      <div className="schema-guide-excerpts">
        <div>
          <h3>Describe the values</h3>
          <p>The section supplies two fields and its own presentation.</p>
          <SourceCode filename="compositions/workshop-registration.tsx" label="Contact section" code={sourceExcerpt(workshopSource, "export const WorkshopRegistration = defineForm({", "  needsInvoice: {")} />
        </div>
        <div>
          <h3>Render the schema</h3>
          <p>One form instance and one Fields component render the declared structure.</p>
          <SourceCode filename="compositions/workshop-registration.tsx" label="Schema rendering" code={sourceExcerpt(workshopSource, "  const form = WorkshopRegistration.useForm();", "  );")} />
        </div>
      </div>
      <p className="schema-guide-note">These excerpts come from the working example. <a href="#/examples/schema">Open the example</a> to try its conditional invoice field and inspect the complete source. The imported control map connects names such as <code>input</code> and <code>checkbox</code> to this app’s React controls.</p>
    </section>

    <section aria-labelledby="schema-structure">
      <p className="schema-guide-eyebrow">02 · READ THE SHAPE</p>
      <h2 id="schema-structure" tabIndex={-1}>How the definition is structured</h2>
      <div className="schema-guide-signature"><code>defineForm(members, options)</code><span>Sections use the same shape: <code>defineSection(members, options)</code>.</span></div>
      <dl className="schema-guide-structure">
        <div><dt><code>members</code></dt><dd>The first argument is a map of names you choose to field definitions or sections. In this example, <code>contact</code>, <code>name</code>, <code>email</code>, <code>needsInvoice</code> and <code>company</code> are your value names. A nested section makes paths such as <code>contact.email</code>.</dd></div>
        <div><dt>Field definition</dt><dd>Each field combines a Zod <code>schema</code>, a <code>defaultValue</code> and a control selection. Keys such as <code>label</code> and <code>applicable</code> configure that field. They do not become properties in the submitted payload.</dd></div>
        <div><dt><code>options</code></dt><dd>The second argument configures the containing form or section. The example uses <code>id</code> for identity, <code>title</code> for a section heading and <code>layout</code> for a React layout component.</dd></div>
      </dl>
      <p>Member names are local identifiers, such as <code>email</code> or <code>needsInvoice</code>. To store a field at a different address, keep its member name and give it an explicit <code>bind</code>, such as <code>"contact.email"</code>. Labels, node IDs and payload paths serve different purposes.</p>
    </section>

    <section aria-labelledby="field-keys">
      <p className="schema-guide-eyebrow">03 · FIELD REFERENCE</p>
      <h2 id="field-keys" tabIndex={-1}>Field keys</h2>
      <p>Start with the value schema, editing default and control. Add presentation and conditions where needed. Each row describes the accepted value and whether the key has a default.</p>
      <KeyReference title="Field keys" rows={fieldKeys} />
      <aside className="schema-guide-note"><strong>Validation comes from the value schema.</strong> For example, <code>z.string().trim().min(1)</code> accepts a string, trims it for submission and requires at least one remaining character. An empty <code>defaultValue</code> is a valid starting draft even when it fails that rule.</aside>
    </section>

    <section aria-labelledby="definition-options">
      <p className="schema-guide-eyebrow">04 · CONTAINER REFERENCE</p>
      <h2 id="definition-options" tabIndex={-1}>Form and section options</h2>
      <p>These keys belong in the second argument of <code>defineForm</code> or <code>defineSection</code>. The first argument remains the member map.</p>
      <KeyReference title="Form and section options" rows={definitionKeys} />
      <p>The options key <code>children</code> accepts member names or nested containers with <code>id</code>, <code>role: "page" | "section"</code>, optional <code>label</code> and another <code>children</code> array. If supplied, it must place every member exactly once. It arranges presentation without changing bindings.</p>
      <p className="schema-guide-note"><code>schema</code> means a Zod value schema on a field. In form or section options, it means a function that receives the composed object schema and returns the schema with your refinements or transforms.</p>
    </section>

    <section aria-labelledby="conditions">
      <p className="schema-guide-eyebrow">05 · DESCRIBE BEHAVIOUR</p>
      <h2 id="conditions" tabIndex={-1}>Conditions and relationships</h2>
      <p>The company field uses <code>{'{ binding: "needsInvoice", equals: true }'}</code>. <code>binding</code> identifies the value to read; <code>equals</code> supplies the value to compare with. When the condition is false, the field is hidden by <code>Fields</code>, excluded from validation and omitted from the payload. Its draft stays in form state.</p>
      <KeyReference title="Condition shapes" rows={conditionKeys} />
      <p>Condition bindings are relative to the owning definition. A condition inside a contact section can read <code>"email"</code>; a condition at form level reads <code>"contact.email"</code>.</p>
      <details className="schema-guide-details">
        <summary>More schema keys: identity, reuse, dependencies and composed values</summary>
        <p>These optional keys support larger compositions using the same definition model.</p>
        <KeyReference title="Relationship and reuse keys" rows={relationshipKeys} />
      </details>
    </section>

    <section aria-labelledby="schema-values">
      <p className="schema-guide-eyebrow">06 · FOLLOW THE VALUES</p>
      <h2 id="schema-values" tabIndex={-1}>From editing values to a payload</h2>
      <p><code>useForm()</code> creates a stateful instance using the schema’s defaults. Successful submission passes the parsed values to <code>onRegister</code>. The definition itself holds no live answers.</p>
      <div className="schema-reference-scroll" tabIndex={0} role="region" aria-label="Workshop values; scroll horizontally on smaller screens">
        <table className="schema-reference">
          <caption className="sr-only">Workshop values</caption>
          <thead><tr><th scope="col">Value path</th><th scope="col">Starting draft</th><th scope="col">Submitted value</th></tr></thead>
          <tbody>
            <tr><th scope="row"><code>contact.name</code></th><td><code>""</code> · string</td><td>A non-empty, trimmed string. <code>"  Sam  "</code> becomes <code>"Sam"</code>.</td></tr>
            <tr><th scope="row"><code>contact.email</code></th><td><code>""</code> · string</td><td>A valid email string, for example <code>"sam@example.com"</code>.</td></tr>
            <tr><th scope="row"><code>needsInvoice</code></th><td><code>false</code> · boolean</td><td><code>true</code> or <code>false</code>, as selected.</td></tr>
            <tr><th scope="row"><code>company</code></th><td><code>""</code> · string</td><td>A non-empty, trimmed string when invoicing is selected. The key is omitted when it is off.</td></tr>
          </tbody>
        </table>
      </div>
      <p>React renders this composed schema. The same definition can also produce a normalized graph for headless inspection and updates; both use the original validation and parsing rules.</p>
      <div className="schema-guide-next"><a className={buttonVariants()} data-slot="button" href="#/examples/schema">Open the complete example <ArrowRight aria-hidden="true" /></a><a href="#/examples/cloud">See dependent choices in a cloud deployment →</a></div>
    </section>
  </article>;
}
