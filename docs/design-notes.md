# Notes for later design phases

These are open questions and research from the initial exploration, not additional product commitments. The [product vision](01-product-vision.md) is the starting point; detailed contracts and launch scope remain to be designed.

## Composition and rendering — Parts 3–5

- [Part 3 — Mental Model](03-mental-model.md) proposes the vocabulary and responsibility boundaries. The [scenario rubric](03-scenarios/README.md) applies it to the seven requested hero scenarios in pseudocode; the [pressure tests](03-mental-model-pressure-tests.md) challenge their shared relationships. The questions below now concern concrete authoring and runtime contracts for that model.
- Define how reusable sections and pages expose configuration and connect their internal field paths and dependencies to a containing form. Reusing a section twice must not cause identity collisions.
- Page is the logical content and completion construct in Part 3; routes, tabs, and wizard steps present it. Specify routing integration, direct navigation, and shared state across unmounted pages without introducing page-local value stores.
- Treat ad hoc fields configured against UI controls as a normal authoring path. Library fields are optional reuse. Parts 4–5 must preserve the same bindings, types, behaviour, and completion when mixing the two or extracting an inline field for reuse; a registry must not be required for ordinary fields.
- The [simplicity rubric](03-scenarios/simple-form.md) is a prerequisite for the API: direct fields need no Page, Section, synthetic page state, duplicate presentation list, engine setup, or custom mapper for ordinary submit. Add layout, conditions, and reuse independently. Test removal as well as addition of optional scopes, preserving domain rules without a form-mode migration.
- The [references and relationships model](03-references-and-relationships.md) anchors local references within section/page/form authoring, separate from value paths and presentation. Specify typed handles, exposed members, external inputs, and portable identity references without requiring root lookups or a registry for normal local conditions.
- Keep data shape, visual nesting, and workflow progression distinct, while allowing them to be composed conveniently.
- The [layout and presentation model](03-layout-and-presentation.md) treats layout as ordered content and ordinary CSS on form/page/section presentation. Specify container and placement surfaces, primitive props/slots, state styling hooks, override behaviour, and focus integration without adding data or completion scopes for layout wrappers.
- Establish how default schema rendering and custom React layouts share field bindings and workflow behaviour, including arrays and review pages.
- Distinguish shadcn's installation catalog from the runtime mapping of registered identities to compatible local components. Mapping requires a value and interaction contract, not just a component name.

## Workflow semantics — Part 6

- Define applicability, value retention, validation scope, navigation, and payload inclusion explicitly. Hiding a field must not silently determine all of these policies.
- Develop the [state and completion model](03-state-and-completion.md): current requirements roll up through fields, sections, pages, and forms; visited, dirty, saved, and submitted remain separate facts. Specify scoped subscriptions, validation freshness, progress indicators, and error destinations for rules spanning pages.
- Specify how dependency changes invalidate selections, derived values, and prior completion at every affected layer, including stale asynchronous results. Cross-page rules must remain in section/form completion when pages show only part of a section.
- Specify reactive dependency tracking, unresolved-input behaviour, retained inactive source values, and diagnostics for unsupported feedback loops. Distinguish mutual value reads from computed-value or completion feedback; define how error correction reveals a conditionally hidden but applicable field.
- Establish boundaries for draft storage, recovery, progress, submission handlers, and errors. React Hook Form should remain the authority for field values; backend systems own durable business execution.

## Definitions and distribution — Parts 7–8

- Define the relationship between typed authoring and portable definitions, including named application capabilities and runtime validation. Avoid promising lossless serialization of arbitrary functions or Zod behaviour.
- Decide which coordination contracts remain runtime packages and which fields, layouts, sections, and workflow components are source-installed.
- Make updates reviewable and specify compatibility expectations for customised code and reusable organisation packages.

### Modular delivery as an architectural opportunity

A composition definition could expose stable identities and dependencies that application tooling maps to versioned assets or cache tags. For example, a separately served deployment-target definition could be refreshed while unrelated definitions remain cached. [Fastly surrogate keys](https://www.fastly.com/documentation/reference/http/http-headers/Surrogate-Key/) associate cached responses with labels for selective purging; [Next.js cache tags](https://nextjs.org/docs/app/api-reference/functions/cacheTag) label cached data for targeted invalidation. These are delivery mechanisms that could consume composition metadata, not features Formulate needs to implement.

A structured file alone does not create independent delivery boundaries. Cache invalidation, code deployment, and updating an interaction already open in a browser are separate concerns. A label on a whole-page response still invalidates that response; updating a bundled React component may still require an application build. Independently served definitions need compatible installed renderers, and changes can affect dependent sections or submission contracts. Later design should consider coherent version selection and whether active drafts retain their starting definition or migrate explicitly.

Preserve this possibility through clear identities and contracts. Do not require remote loading, a CDN integration, hot-swapping, or a particular bundler in the core model or initial release.

## Evidence and scope — Parts 9–11

Compare equivalent manual and Formulate implementations by changing a layout, reusing a section, adding a branch, replacing a picker, and handling a server rejection. Measure the coordination code and independent edits required, alongside ease of understanding and verification. Use the requested hero scenarios and competitive analysis to challenge the model before selecting the smallest coherent six-week release.

### Testing the AI composition hypothesis

The hypothesis concerns systematic composition of behaviour: conditional sections, dependent choices, and guarded steps should have reusable, explicit semantics. The ability to generate equivalent application code does not establish whether a tool provides that composition model. [v0 generates full-stack applications](https://v0.app/docs/full-stack-apps); this makes it a potential consumer of Formulate's building blocks. [Vercel's Chat SDK and Workflow SDK example](https://vercel.com/kb/guide/human-in-the-loop-with-chat-sdk-and-workflow-sdk) connects an approval interface to durable execution, while [Temporal message passing](https://docs.temporal.io/develop/typescript/workflows/message-passing) provides typed queries, signals, and updates. These establish integration possibilities, rather than resolving the behavioural composition question.

The closer architectural comparisons include [json-render](https://json-render.dev/), which defines component and action catalogs for generated UI, and [A2UI](https://a2ui.org/), which describes agent-generated interfaces with component catalogs and data binding. AI-readable composition alone is not sufficient differentiation. Evaluate whether Formulate's reusable form interactions and shared workflow semantics add value, and whether these projects should be integration surfaces rather than formats to replace.

Separate three uses: a human understands and edits a definition; AI generates a definition; an agent consumes a running interaction. The last needs more than a static schema: current applicable requirements, values it may access, validation results, and named available actions. Custom React layouts must preserve that meaning. Application services remain authoritative for permissions, business validation, and durable process state; Formulate must not mirror a backend state machine independently.

Test one deployment request through a React wizard and an agent using the same interaction contract. Change the account and production requirements midway; verify that both surfaces receive consistent requirements, invalidation, and permitted next actions. Include a server rejection or request for further input. Compare against generated React plus ordinary typed APIs and a component-catalog approach. If those alternatives provide the same consistency with less machinery, narrow Formulate's scope. This experiment tests the product thesis; it does not commit an agent runtime or workflow-engine adapter to Version 0.1.

## Research starting points

Existing libraries already address substantial parts of this space. The proposed opportunity is their integration into an owned, composable shadcn workflow experience, rather than the novelty of any individual capability.

- [shadcn registry item specification](https://ui.shadcn.com/docs/registry/registry-item-json): package and registry dependencies.
- [React Hook Form](https://github.com/react-hook-form/react-hook-form): form state and validation integration.
- [TanStack Form](https://tanstack.com/form/latest): typed form composition and validation orchestration.
- [FormKit schema](https://formkit.com/essentials/schema): serializable definitions, component references, and conditional rendering.
- [JSON Forms](https://jsonforms.io/docs/): separate data and UI schemas with custom renderers.
- [Formisch](https://formisch.dev/): schema-driven types and headless form composition.
- [Zod JSON Schema](https://zod.dev/json-schema): metadata, conversion, and serialization limits.
