# Part 1 — Product Vision

**Formulate is the workflow composition layer for forms built with shadcn/ui.**

It gives React and TypeScript developers a shared model for composing fields, sections, layouts, and steps into complete form experiences—with validation, conditional behaviour, navigation, and submission working together.

Compose a simple login form or a branching infrastructure wizard using the same building blocks. Start with useful defaults, reuse whole sections and steps, and bring custom React components wherever the experience needs them.

## Compose the experience

A form definition should express both **what the user sees and how the experience behaves**. Fields belong in layouts, nested groups, and repeatable sections. Steps guide the user through choices, branches, and review. Dependencies connect those choices to validation, derived values, and asynchronous data.

These elements should compose as naturally as React components. A reusable “deployment target” section can combine account and region pickers, their layout, and the behaviour that loads regions when the account changes. Another workflow can use that section without rebuilding its internal wiring.

Build a provisioning wizard by combining that section with a repeatable resource group, a production-only configuration step, and a review page. Formulate coordinates progression and validation, supports saving and recovering the draft, and connects submission to application handlers. The developer supplies the domain rules and services, while controlling how every part looks.

Schema rendering and manual React composition should work together: render a definition by default, customise one section, or compose the layout yourself while retaining the same workflow behaviour. Growing complexity should require more composition, not a new form architecture.

Explicit identities and relationships also give application tooling a basis for updating and delivering parts of an experience independently, where their contracts allow it.

## Own the building blocks

Start with the shadcn registry model to distribute editable fields, layouts, and workflow components. Map those building blocks to local UI components: a choice field can use the application's shadcn Select as a dependency, with styling kept in the component and theme.

React Hook Form and Zod provide the default state and validation engines. Formulate connects them to the composed experience. Teams can publish reusable fields, sections, and steps that carry both presentation defaults and behaviour, while allowing either to be adapted.

The philosophy is simple: **compose once, reuse at any scale, and keep control of the result.**

## Who it is for, and why now

Formulate is for experienced React and TypeScript developers building everything from application settings to onboarding and operational workflows. Its strongest value is where teams repeatedly assemble the same interactions and maintain the connections between them.

Tools such as v0 can generate working interfaces and application logic using components such as those from shadcn. Formulate's opportunity is to make **interaction behaviour equally composable**: conditional sections, dependent choices, and guarded steps become reusable building blocks with defined semantics. AI can assemble these behaviours alongside the UI instead of generating their implementation afresh. [v0](https://v0.app/docs/full-stack-apps).

A production-only section, for example, should compose its applicability with the fields, validation, and progression it governs. A human can read that relationship, AI can generate it, and an assisting agent can consume the resulting requirements and available actions. The behaviour has the same meaning across those uses.

This interaction model connects to application services and durable engines such as Vercel Workflow or Temporal, which own business execution. The hypothesis is that composing defined behaviours makes interfaces easier to generate, verify, and change. Formulate remains useful when every definition is written by hand. [Vercel Workflow](https://vercel.com/kb/guide/human-in-the-loop-with-chat-sdk-and-workflow-sdk), [Temporal](https://docs.temporal.io/develop/typescript/workflows/message-passing).

## What guides the APIs

- **Composition at every level.** Fields, layouts, sections, steps, and behaviours work together and remain independently reusable.
- **Explicit and readable.** A definition makes structure, dependencies, and progression understandable to a person or an AI.
- **Typed end to end.** Preserve types through values, component mappings, workflow rules, and submission; validate externally supplied definitions at runtime.
- **Useful defaults, local control.** Provide polished, accessible shadcn experiences with straightforward customisation through owned code.
- **Complexity only when needed.** A small form stays small. Larger workflows extend the same model without duplicating rules or state.

Formulate is a composition library, not a new design system, a replacement state engine, or a no-code platform. It manages interactions and their handoffs to application services, including requests for further input; backend systems own durable execution.

The test for every addition: **Does this make building and changing complex workflows dramatically easier than composing shadcn components manually?**
