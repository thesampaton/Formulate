# Part 4 — Registry and Libraries

**Formulate publishes the primitives for composing form experiences. Developers use those primitives to define reusable libraries, which can be consumed locally or published through their own registries.**

The [building-block taxonomy](04-building-blocks.md) connects the current implementation to source artifacts and distribution units. It distinguishes core, shadcn bindings, fields/sections, layouts, navigation, actions and application behaviour. A registry item may bundle several of these responsibilities.

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

The current runtime is installed as **`@formulate/core`**, exporting Form, Field, Section, Page and the implemented declaration/coordination helpers. `@formulate/common-fields` supplies reusable semantic fields through the public `defineField` API. `@formulate/shadcn-bindings`, `@formulate/actions` and `@formulate/navigation` distribute connected UI and composition components. `@formulate/name` demonstrates a reusable domain section. Ordinary field spacing and grids use local shadcn FieldGroup directly; navigation supplies FormStepLayout for page and action composition.

See the [actual installable catalogue](registry-development.md) for source paths and dependencies. The [earlier primitive catalogue](04-registry-catalogue.md) records candidates for later design; its proposed per-primitive addresses and rule/workflow helpers are not current installable APIs.

A Formulate primitive describes interaction meaning. A shadcn Input or Select supplies a UI building block. Field connects a control to a value and the form's behaviour; Section and Page compose that behaviour at larger scopes.

## Defining a library

The current authoring mechanism has three steps:

1. **Declare and compose a reusable part** with `defineField`/`field`, `defineSection`, `defineForm`, ordinary inline field configuration and React components. `definePage` remains a proposal.
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
