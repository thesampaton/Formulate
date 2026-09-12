# Formulate

**The workflow composition layer for forms built with shadcn/ui.**

Formulate is a proposed React and TypeScript library for composing fields, layouts, sections, and pages into complete form experiences. Validation, conditional behaviour, navigation, and submission work together, while developers own the UI code. React Hook Form and Zod are the default engines.

The project now has a small, experimental React 19.2+ implementation alongside the design work. The API is provisional and the package is not published.

## Run the examples

Use Node 24 and pnpm 10.33.0 (see `.nvmrc` and `packageManager`).

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. The site starts with an [overview](examples/react/src/overview.tsx) of declaration, composition, navigation and submission, including an annotated SVG of the form’s pages, sections and fields. The shadcn sidebar groups all examples; links such as `#/overview` and `#/examples/multiPage` support bookmarks and browser history.

The examples cover [simple sign-in](examples/react/src/simple-form.tsx) and [advanced options](examples/react/src/advanced-options.tsx), including disclosure, scoped Settings → Destination → Review navigation, and application-owned submission. Demo handlers perform no network requests or persistence.

The fifth example, [responsive fields](examples/react/src/responsive-layout.tsx), demonstrates a shared Name section with first and last name in a shadcn FieldGroup grid. Ordinary spacing and grids use shadcn components directly. Form, Page and Section retain replaceable layout components and definition defaults for larger compositions such as FormStepLayout.

The sixth example, [multi-page form](examples/react/src/compositions/multi-page-form.tsx), uses shadcn Tabs with current completion indicators, scoped Continue actions and correction links from Review. [Navigation and action components](docs/registry-development.md) are reusable registry items.

Each source panel separates **Composition** (rendering), **Declaration** (fields, validation and defaults), and **Sample data** (reusable editing values). These are real modules in `src/compositions`, `src/declarations` and [`src/data/example-data.ts`](examples/react/src/data/example-data.ts). The source browser groups fields/sections, layouts, navigation, actions, shadcn bindings and form-specific behaviour by responsibility, and identifies actual registry items. See the [building-block taxonomy](docs/04-building-blocks.md). Demo wrappers own resizing controls and sample result displays; the code panel shows the entire composition module, including its imports.

The third example, [email confirmation](examples/react/src/email-confirmation.tsx), tests `defineField`/`field` reuse and cross-field validation, with flat and explicitly nested bindings. [Common fields](examples/react/src/declarations/common-fields.ts) separate primitive semantics, reusable schemas/defaults, and nominated control names; local control maps still supply their UI. Install them as the optional `@formulate/common-fields` source item.

Example 11, the [control gallery](examples/react/src/compositions/control-gallery.tsx), covers Input, Textarea, Checkbox, Switch, Select, RadioGroup, Combobox, Command, single/multiple ToggleGroup, Slider, Calendar, DatePicker and InputOTP. The [binding catalogue](packages/react/docs/control-catalogue.md) documents value types, empty states, configuration and interaction behavior.

```sh
pnpm check # TypeScript, interaction tests, package build, example build
```

The [@formulate/react package](packages/react/README.md) provides `Form`, `Field`, `Section`, `Page`, and `useFormulate`. Examples use React and Tailwind CSS 4 with no Next.js dependency. The [local control map](examples/react/src/lib/formulate-config.ts) supplies shadcn Base UI controls (`base-nova`), with per-use Tailwind overrides through `className`. UI-specific events, focus and popup behavior stay in those source-owned bindings; future Radix or React Aria bindings can use the same core field contracts. A [local source registry](docs/registry-development.md) installs the runtime, connected controls, navigation and reusable sections into another codebase.

The examples use `defineForm` to declare each field's schema, editing default, and presentation once. `Definition.useForm()` creates its runtime; static prefills preserve untouched defaults. Render all fields in declaration order or place individual typed fields in JSX. Field connections come from Form context by default; an explicit RHF `control` remains available.

`useFormNavigation` coordinates explicit correction destinations and focus. `Form.scopedAction` checks the current action's field paths; final submission still validates the whole form. `useFormActionStatus` exposes React transition pending state for both checking and saving. Inactive pages use React Activity to retain UI state while form-level validation continues. The multi-page example derives synchronous page completion in application code; general completion and workflow coordination remain design work.

The [complex-workflow acceptance gates](docs/05-06-rendering-and-workflow.md#complex-workflow-evidence) deepen existing scenarios: reuse a complete page in two forms, combine branching with dependent async choices, then exercise repeated sections and application-owned draft restoration. The three bounded exercises now run as examples 07–09, with evidence and course-correction decisions recorded. Package-owned dependent-choice coordination carries local dependency and membership policy; bound section uses now share presentation, action/correction scopes and repeated-use identity without a page or general workflow engine. Destinations, applicability and durable application policy remain local.

## Design and implementation

- [Part 1 — Product Vision](docs/01-product-vision.md): the product direction.
- [Part 2 — Design Principles](docs/02-design-principles.md): principles guiding the APIs and architecture.
- [Part 3 — Mental Model](docs/03-mental-model.md): the parts, relationships, and responsibility boundaries.
- [Part 4 — Registry and Libraries](docs/04-registry.md): Formulate primitives, library authoring, and namespaced distribution.
- [Parts 5–6 — Rendering and Workflow](docs/05-06-rendering-and-workflow.md): the implementation anchor, current scope, evidence, and next decisions.
- [Generalisation](docs/generalisation.md): the implemented dependent-choice extraction, authoring comparison and remaining gaps.
- [Naming and readability](docs/naming-and-readability-audit.md): the implemented vocabulary and conventions for future changes.
- [Design notes](docs/design-notes.md): open architecture questions and research for later phases.

Part 3 links to optional references for state, relationships, and layout. Its [scenario rubric](docs/03-scenarios/README.md) applies the model, starting with a simple form and extending to the seven hero scenarios.

Part 4 links to the primitive catalogue, a library authoring walkthrough, initial entity shapes, and a distribution sketch for independent registries and v0. These remain design proposals.

The test for every design decision: **Does this make building and changing complex workflows dramatically easier than composing shadcn components manually?**
