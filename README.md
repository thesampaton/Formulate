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

Open the local URL printed by Vite. The examples cover [simple sign-in](examples/react/src/simple-form.tsx) and [advanced options](examples/react/src/advanced-options.tsx), including disclosure, scoped Settings → Destination → Review navigation, and application-owned submission. Demo handlers perform no network requests or persistence.

The fifth example, [reusable layouts](examples/react/src/responsive-layout.tsx), demonstrates a shared Name group with first and last name in a responsive row. Form, Page and Section accept reusable layout components; form and section definitions can supply defaults.

The sixth example, [multi-page form](examples/react/src/compositions/multi-page-form.tsx), uses shadcn Tabs with current completion indicators, scoped Continue actions and correction links from Review. [Navigation and action components](docs/registry-development.md) are reusable registry items.

Each source panel separates **Composition** (rendering), **Declaration** (fields, validation and defaults), and **Sample data** (reusable editing values). These are real modules in `src/compositions`, `src/declarations` and [`src/data/example-data.ts`](examples/react/src/data/example-data.ts). The source browser groups fields/sections, layouts, navigation, actions, shadcn bindings and form-specific behaviour by responsibility, and identifies actual registry items. See the [building-block taxonomy](docs/04-building-blocks.md). Demo wrappers own resizing controls and sample result displays; the code panel shows the entire composition module, including its imports.

The third example, [email confirmation](examples/react/src/email-confirmation.tsx), tests reusable field configuration and cross-field validation, with flat and explicitly nested bindings.

```sh
pnpm check # TypeScript, interaction tests, package build, example build
```

The [@formulate/react package](packages/react/README.md) provides `Form`, `Field`, `Section`, `Page`, and `useFormulate`. Examples use React and Tailwind CSS 4 with no Next.js dependency. The [local control map](examples/react/src/lib/formulate-config.ts) supplies styled controls, with per-use Tailwind overrides through `className`. The UI uses locally installed shadcn Field, Input, Checkbox, Select, Button, Slider and Tabs components. A [local source registry](docs/registry-development.md) installs the runtime, layouts and reusable groups into another codebase.

The examples use `defineForm` to declare each field's schema, editing default, and presentation once. `Definition.useForm()` creates its runtime; static prefills preserve untouched defaults. Render all fields in declaration order or place individual typed fields in JSX. Field connections come from Form context by default; an explicit RHF `control` remains available.

`useFormNavigation` coordinates explicit correction destinations and focus. `Form.navigation` checks the current action's field paths; final submission still validates the whole form. `useFormActionStatus` supplies pending state for both checking and saving. The multi-page example derives synchronous page completion in application code; general completion and workflow coordination remain design work.

The [complex-workflow acceptance gates](docs/05-06-rendering-and-workflow.md#complex-workflow-contract-next-acceptance-gates) deepen existing scenarios: reuse a complete page in two forms, combine branching with dependent async choices, then exercise repeated sections and application-owned draft restoration. The three bounded exercises now run as examples 07–09, with evidence and course-correction decisions recorded. Their local coordinators remain prototypes; no general workflow engine is claimed.

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
