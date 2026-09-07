# Notes for later design phases

These are open questions and research from the initial exploration, not additional product commitments. The [product vision](01-product-vision.md) is the starting point; detailed contracts and launch scope remain to be designed.

## Composition and rendering — Parts 3–5

The [mental model](03-mental-model.md) establishes the vocabulary. Its linked references and [scenario rubric](03-scenarios/README.md) hold detail to consult as each contract is designed.

- Demonstrate the [simple-form authoring budget](03-scenarios/simple-form.md), then add and remove layout, conditions, reuse, sections, and pages without changing form architecture. Preserve needed rules and state through those changes.
- Specify reusable field/section/page configuration, bindings, typed references, and outside inputs. Keep data shape and presentation independently changeable, including repeated uses, arrays, and review views. See [relationships](03-references-and-relationships.md).
- Define how default rendering and custom React share behaviour, and where container, placement, primitive props, styling hooks, and focus integration apply. See [layout](03-layout-and-presentation.md).
- Define routing/tab integration around logical Pages, with shared state across unmounted content.
- Distinguish source installation from runtime component mapping. Compatibility requires a value and interaction contract, beyond a component name.

## Workflow semantics — Part 6

- Specify defaults and overrides for applicability, retention, validation scope, navigation, and payload inclusion. Visibility alone cannot determine them.
- Develop scoped state subscriptions, completion freshness, progress, and correction destinations from the [state reference](03-state-and-completion.md). Preserve the distinction between completion, visits, edits, and acknowledged saves.
- Define dependency scheduling, stale-result rejection, unresolved inputs, retained inactive values, and unsupported feedback diagnostics. Include requirements spanning pages and correction of hidden applicable fields.
- Specify draft recovery, submission snapshots, response reconciliation, and application handoffs. React Hook Form remains the default value authority; backend services own durable execution. The [pressure tests](03-mental-model-pressure-tests.md) provide acceptance cases.

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

Separate three uses: a human understands and edits a definition; AI generates a definition; an agent fills a running form, potentially alongside a person. The running form should expose context attached to stable field references, derived from labels/help, value contracts, declared dependencies, current choices, evaluated requirements, and state. Add domain descriptions where meaning cannot be derived; ordinary fields should need no duplicate agent schema. The [deployment sketch](03-scenarios/cloud-deployment-wizard.md#context-for-filling-the-form) illustrates this view.

Parts 4–7 must define how consumers inspect that context, observe changes, propose value updates, and invoke permitted actions through the shared rules. Human–agent handoffs require freshness and conflict handling: an answer based on earlier context cannot silently overwrite newer work or rely on obsolete choices. Custom React must preserve the same meaning. The application controls accessible values/actions and owns business validation and durable execution; adapter protocols remain open.

Test one deployment request through a React wizard and an agent using the same interaction contract. Let the person change the account while the agent prepares a region answer; both must receive current context and consistent outcomes. Change production requirements and include a server rejection or request for further input. Compare against generated React plus ordinary typed APIs and a component-catalog approach. If those alternatives provide the same consistency with less machinery, narrow Formulate's scope. This experiment tests the product thesis; it does not commit an agent runtime or workflow-engine adapter to Version 0.1.

## Research starting points

Existing libraries already address substantial parts of this space. The proposed opportunity is their integration into an owned, composable shadcn workflow experience, rather than the novelty of any individual capability.

- [shadcn registry item specification](https://ui.shadcn.com/docs/registry/registry-item-json): package and registry dependencies.
- [React Hook Form](https://github.com/react-hook-form/react-hook-form): form state and validation integration.
- [TanStack Form](https://tanstack.com/form/latest): typed form composition and validation orchestration.
- [FormKit schema](https://formkit.com/essentials/schema): serializable definitions, component references, and conditional rendering.
- [JSON Forms](https://jsonforms.io/docs/): separate data and UI schemas with custom renderers.
- [Formisch](https://formisch.dev/): schema-driven types and headless form composition.
- [Zod JSON Schema](https://zod.dev/json-schema): metadata, conversion, and serialization limits.
