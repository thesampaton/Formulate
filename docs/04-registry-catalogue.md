# Part 4 Reference — Earlier Primitive Catalogue

[Back to Part 4](04-registry.md) · [Library authoring](04-library-authoring.md) · [Entity shapes](04-entity-shapes.md)

**The Formulate registry begins with the primitives used to build a library.** Each item should provide its authoring contract, integration source, documentation, and a small usage example. Addresses and helper names below are proposed.

The implemented source registry currently distributes `defineField`, `field`, and the primitive field taxonomy within `@formulate/core`, with reusable semantics in the separate `@formulate/common-fields` item. It does not introduce an item or package per primitive type. See the [current items and common-field policies](registry-development.md#common-fields).

The [current taxonomy](04-building-blocks.md) and [buildable registry](registry-development.md) supersede these candidate packaging names. Categories are responsibilities; separate npm packages or registry items are justified by practical installation boundaries. The current core is acquired through `@formulate/core`.

## Core entries

| Registry item | Intended exports | What a library author can define |
| --- | --- | --- |
| `@formulate/form` | Form integration and `defineForm` | A complete interaction with content, requirements, actions, and optional pages. |
| `@formulate/field` | Field integration and `defineField` | A value contract with validation, metadata, and a compatible renderer. |
| `@formulate/section` | Section integration and `defineSection` | Reusable members, internal connections, group requirements, and exposed references. |
| `@formulate/page` | Page integration and `definePage` | Reusable page content, completion scope, and host-connected navigation. |

The named integrations stand for the public composition surfaces to design in Parts 5–6. The helper constructs a reusable definition; using that definition creates an instance. Direct composition remains available without extracting a definition first.

## Supporting entries

| Candidate item | Initial responsibility | Next contract to resolve |
| --- | --- | --- |
| `@formulate/renderer` | Connect an editable or review presentation to a field instance. | Value/events, props/slots, accessibility, and focus. |
| `@formulate/layout` | Arrange ordered content through ordinary CSS and placement configuration. | Presentation composition and defaults. |
| `@formulate/rule` | Describe checks over typed inputs with issue targets. | Validation composition and asynchronous checks. |
| `@formulate/action` | Connect a named intent to requirements and a supplied handler. | Attempts, availability, payloads, and feedback. |
| `@formulate/behaviour` | Describe a relationship with an explicit effect. | Visibility, applicability, presence, and derived-value policies. |
| `@formulate/workflow` | Compose navigation between logical pages and actions. | Ordering, conditions, and host navigation. |
| `@formulate/data-source` | Describe choice/search/resolve operations supplied by the application. | Query, result, failure, and freshness contracts. |

These supporting contracts may initially be exports within other items. Their separate packaging can follow evidence from rendering and workflow prototypes.

## What a primitive item needs to expose

```text
item address             @formulate/section
source exports           Section integration, defineSection, associated types
authoring input          members, inputs, services, rules, defaults, exposed refs
definition output        reusable SectionDefinition
use configuration        identity, bindings, outside connections, overrides
dependencies             required Formulate runtime/source and UI dependencies
documentation            API, setup, composition example, supported adaptations
```

Shared coordination should resolve to one compatible runtime dependency. Installing Field and Section must not copy separate state engines into a project. Editable integration source can be registry-distributed while the coordination implementation remains a package; the package names and split are still to be selected.

## Small examples alongside the primitives

| Example | Built with | What it teaches |
| --- | --- | --- |
| Email | Field | Package a value contract, default renderer, and label; configure presence at use time. |
| ContactDetails | Section + Field | Compose fields once, expose references, and reuse the section with independent bindings. |
| ContactPage | Page + ContactDetails | Present an existing section and assign its completion requirements. |
| ContactForm | Form + ContactDetails | Connect an application submit handler without requiring pages. |

These examples form the [library authoring walkthrough](04-library-authoring.md). The [domain pressure tests](04-registry-pressure-tests.md) challenge the same contracts with contextual choices, structured values, and multiple uses.
