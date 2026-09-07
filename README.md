# Formulate

**The workflow composition layer for forms built with shadcn/ui.**

Formulate is a proposed React and TypeScript library for composing fields, layouts, sections, and pages into complete form experiences. Validation, conditional behaviour, navigation, and submission work together, while developers own the UI code. React Hook Form and Zod are the default engines.

The project now has a small, experimental React 19 implementation alongside the design work. The API is provisional and the package is not published.

## Run the examples

Use Node 24 and pnpm 10.33.0 (see `.nvmrc` and `packageManager`).

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The examples cover [simple sign-in](examples/react/src/simple-form.tsx) and [advanced options](examples/react/src/advanced-options.tsx), including disclosure, a settings/review flow, and application-owned submission. Demo handlers perform no network requests or persistence.

```sh
pnpm check # TypeScript, interaction tests, package build, example build
```

The [@formulate/react package](packages/react/README.md) provides `Form`, `Field`, `Section`, `Page`, and `useFormulate`. Examples use React and Tailwind CSS 4 with no Next.js dependency. The [local control map](examples/react/src/formulate.ts) supplies styled controls, with per-use Tailwind overrides through `className`. UI source distribution through shadcn remains design work.

The examples use `defineForm` to declare each field's schema, editing default, and presentation once. `Definition.useForm()` creates its runtime; static prefills preserve untouched defaults. Render all fields in declaration order or place individual typed fields in JSX. Field connections come from Form context by default; an explicit RHF `control` remains available.

## Design and implementation

- [Part 1 — Product Vision](docs/01-product-vision.md): the product direction.
- [Part 2 — Design Principles](docs/02-design-principles.md): principles guiding the APIs and architecture.
- [Part 3 — Mental Model](docs/03-mental-model.md): the parts, relationships, and responsibility boundaries.
- [Part 4 — Registry and Libraries](docs/04-registry.md): Formulate primitives, library authoring, and namespaced distribution.
- [Parts 5–6 — Rendering and Workflow](docs/05-06-rendering-and-workflow.md): the implementation anchor, current scope, evidence, and next decisions.
- [Design notes](docs/design-notes.md): open architecture questions and research for later phases.

Part 3 links to optional references for state, relationships, and layout. Its [scenario rubric](docs/03-scenarios/README.md) applies the model, starting with a simple form and extending to the seven hero scenarios.

Part 4 links to the primitive catalogue, a library authoring walkthrough, initial entity shapes, and a distribution sketch for independent registries and v0. These remain design proposals.

The test for every design decision: **Does this make building and changing complex workflows dramatically easier than composing shadcn components manually?**
