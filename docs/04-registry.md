# Part 4 — Registry and Libraries

**Formulate publishes the primitives for composing form experiences. Developers use those primitives to define reusable libraries, which can be consumed locally or published through their own registries.**

This chapter starts the registry and authoring model. Names and API sketches are provisional; rendering and workflow execution will refine the contracts in Parts 5–6.

## The structure

```text
Formulate registry (@formulate)
  Form · Field · Section · Page · supporting primitives
                ↓ compose
User library
  reusable fields · sections · pages · complete forms
                ↓ export
Application imports / independent registry (@acme)
                ↓ consume
React applications · shadcn tooling · v0
```

| Part | What it provides |
| --- | --- |
| **Primitive** | A Formulate building block and its authoring contract, such as Section or Page. |
| **Definition** | A reusable composition made with those primitives, such as ContactDetails. |
| **Library** | A named collection of exported definitions, with documentation and examples. |
| **Registry** | A distribution catalogue of installable source and dependencies. It can contain any supported shadcn items. |
| **Instance** | One use of a definition in a running form, with its own identity, bindings, connections, and state. |

Formulate is a dependency of a user's registry. That registry can also distribute dashboards, navigation, charts, and other components alongside Formulate compositions.

## Formulate's primitive registry

The initial core entries are:

| Address | Primitive | Initial contract |
| --- | --- | --- |
| `@formulate/form` | **Form** | Shared interaction boundary, values, requirements, content, optional pages, and submission connections. |
| `@formulate/field` | **Field** | One value contract, validation, control integration, metadata, and explicit dependencies. |
| `@formulate/section` | **Section** | Members, local connections, group requirements, exposed references, and optional presentation defaults. |
| `@formulate/page` | **Page** | Ordered content, assigned completion requirements, and navigation connections supplied by its host. |

These entries provide the building blocks for both direct composition and reusable definitions. The [primitive catalogue](04-registry-catalogue.md) also starts the supporting entries for rendering, layout, rules, actions, and workflow.

A Formulate primitive describes interaction meaning. A shadcn Input or Select supplies a UI building block. Field connects a control to a value and the form's behaviour; Section and Page compose that behaviour at larger scopes.

## Defining a library

The proposed authoring mechanism has three steps:

1. **Define a reusable part** with a primitive's helper: `defineField`, `defineSection`, `definePage`, or `defineForm`.
2. **Export the parts together** as an ordinary TypeScript library. Declare outside inputs and services at each reusable boundary.
3. **Describe installable items** in a standard shadcn registry manifest when distribution is useful. Declare Formulate and other source/package dependencies there.

The [library authoring guide](04-library-authoring.md) walks through an Email field, a ContactDetails section, and a ContactPage. The [entity shapes](04-entity-shapes.md) describe the underlying contracts those helpers assemble.

Validation, presentation defaults, and metadata travel with a definition. Each use supplies its binding, configuration, and outside connections. Changing presentation preserves the value contract and rules. Sections group members; Pages organise presentations and completion. The [Part 3 mental model](03-mental-model.md) supplies these semantics.

## Consumption

Namespaced shadcn installation gives developers a familiar way to acquire primitives or composed library items, then import the installed source in their application. Namespaces are configured aliases such as `@formulate` and `@acme`. [shadcn namespaces](https://ui.shadcn.com/docs/registry/namespace).

v0 is also an intended consumer. Its current design-system import can learn from installable code, documentation, and a working consumer app. Registry items need usable source, dependencies, and setup examples for that experience. [v0 Design Systems 2.0](https://v0.app/docs/design-systems-2).

The [distribution reference](04-registry-distribution.md) sketches an independent registry with Formulate dependencies and distinguishes normal namespace installation from v0's import paths. Publishing infrastructure and v0 integration will be implemented later.

## What to establish now

- The primitives Formulate publishes and the contracts they expose.
- How a developer defines, configures, composes, and exports a library.
- A few examples that demonstrate the authoring path.
- Enough distribution shape for an independent registry to depend on Formulate.

The [pressure tests](04-registry-pressure-tests.md) apply domain fields and larger compositions to this model. Rendering interfaces, workflow scheduling, and publishing/version tooling remain work for their respective phases.
