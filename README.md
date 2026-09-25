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

Open the local URL printed by Vite. Under **Start here**, the [overview](examples/react/src/overview.tsx) explains composition, navigation and submission, and [Schema-driven forms](examples/react/src/schema-driven-guide.tsx) uses short code excerpts alongside a key-by-key reference for accepted values, defaults and behaviour. The shadcn sidebar groups all examples; links such as `#/overview`, `#/schema-driven` and `#/examples/multiPage` support bookmarks and browser history.

The examples cover [simple sign-in](examples/react/src/simple-form.tsx) and [advanced options](examples/react/src/advanced-options.tsx), including disclosure, scoped Settings → Destination → Review navigation, and application-owned submission. Demo handlers perform no network requests or persistence.

The [reusable layouts example](examples/react/src/responsive-layout.tsx) demonstrates a shared Name section whose default responsive grid can be overridden by its host while values stay in place. Ordinary spacing and grids use shadcn components directly. Form, Page and Section retain replaceable layout components and definition defaults for larger compositions such as FormStepLayout.

The sixth example, [multi-page form](examples/react/src/compositions/multi-page-form.tsx), uses shadcn Tabs with current completion indicators, scoped Continue actions and correction links from Review. [Navigation and action components](docs/registry-development.md) are reusable registry items.

Every example now uses the [focused example layout](examples/react/src/focused-example.tsx): one named capability, a live form with a specific task, short excerpts from the checked-in source, and complete application files behind disclosures. The [page recipe and capability map](docs/example-pages.md) records what each route teaches. After the first simple form, examples lead with schema composition and use explicit React placement where navigation or layout needs it. Demo wrappers own resizing controls and sample result displays.

The [email confirmation example](examples/react/src/email-confirmation.tsx) tests `defineField`/`field` reuse and cross-field validation, with flat and explicitly nested bindings. [Common fields](examples/react/src/declarations/common-fields.ts) separate primitive semantics, reusable schemas/defaults, and nominated control names; local control maps still supply their UI. Install them as the optional `@formulate/common-fields` source item.

Example 10, the [control gallery](examples/react/src/compositions/control-gallery.tsx), covers Input, Textarea, Checkbox, Switch, Select, RadioGroup, Combobox, Command, single/multiple ToggleGroup, Slider, Calendar, DatePicker and InputOTP. The [binding catalogue](packages/react/docs/control-catalogue.md) documents value types, empty states, configuration and interaction behavior.

Example 12, [composed values](examples/react/src/compositions/composed-values.tsx) (`#/examples/composed`), builds one scalar from editable text, fixed segments, field/context bindings and transforms. Try company email addresses, URLs, resource names, customer references and SKUs. The [composition guide](packages/react/docs/composed-values.md) explains canonical state and section reuse; [string patterns](packages/react/docs/string-patterns.md) use ordinary Zod validation independently of composition.

```sh
pnpm check # TypeScript, interaction tests, package build, example build
```

The [@formulate/react package](packages/react/README.md) provides `Form`, `Field`, `Section`, `Page`, and `useFormulate`. Examples use React and Tailwind CSS 4 with no Next.js dependency. The [local control map](examples/react/src/lib/formulate-config.ts) supplies shadcn Base UI controls (`base-nova`), with per-use Tailwind overrides through `className`. UI-specific events, focus and popup behavior stay in those source-owned bindings; future Radix or React Aria bindings can use the same core field contracts. A [local source registry](docs/registry-development.md) installs the runtime, connected controls, navigation and reusable sections into another codebase.

The examples use `defineForm` to declare each field's schema, editing default, and presentation once. Reusable fields and sections carry their schemas, applicability, dependencies, choices and composed values into every use. `Definition.useForm({ services })` enforces those declared semantics; static prefills preserve untouched defaults. Render all fields in declaration order or place individual typed fields in JSX. Field connections come from Form context by default; an explicit RHF `control` remains available.

`useFormNavigation` coordinates explicit correction destinations and focus. `Form.scopedAction` checks the current action's field paths; final submission still validates the whole form. `useFormActionStatus` exposes React transition pending state for both checking and saving. Inactive pages use React Activity to retain UI state while form-level validation continues. Graph inspection derives completion from the same composed schemas and values; application code chooses the navigation and completion presentation.

The [complex-workflow acceptance gates](docs/05-06-rendering-and-workflow.md#complex-workflow-evidence) deepen existing scenarios: reuse a complete page in two forms, combine branching with dependent async choices, then exercise repeated sections and application-owned draft restoration. The three bounded exercises now run as examples 07–09, with evidence and course-correction decisions recorded. Package-owned dependent-choice coordination carries local dependency and membership policy; bound section uses share presentation, action/correction scopes and repeated-use identity. Definitions can declare structured applicability, while applications own navigation destinations, persistence and external services.

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

The [schema composition guide](packages/react/docs/schema-composition.md) starts with a complete workshop registration form in one module: nested contact fields, validation, a conditional invoice field and rendering. A larger dependent-choices example uses cloud deployment to demonstrate reusable sections and generated graph inspection. Existing definition APIs combine validation, dependencies, applicability and composed values with explicit identities and bindings. React rendering and the JSON graph are projections of that same model; normal React use and headless agent updates share validation and payload behavior. `toPortable()` exposes the graph, deriving supported descriptions from the authoritative schemas and keeping behavior that cannot be serialized in named host capabilities.
