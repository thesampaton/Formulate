# Formulate

**The workflow composition layer for forms built with shadcn/ui.**

Formulate is a proposed React and TypeScript library for composing fields, layouts, sections, and pages into complete form experiences. Validation, conditional behaviour, navigation, and submission work together, while developers own the UI code. React Hook Form and Zod are the default engines.

The project is currently in product and architecture discovery. There is no implementation or published API yet.

- [Part 1 — Product Vision](docs/01-product-vision.md): the product direction.
- [Part 2 — Design Principles](docs/02-design-principles.md): principles guiding the APIs and architecture.
- [Part 3 — Mental Model](docs/03-mental-model.md): the parts, relationships, and responsibility boundaries.
- [Part 4 — Registry and Libraries](docs/04-registry.md): Formulate primitives, library authoring, and namespaced distribution.
- [Design notes](docs/design-notes.md): open architecture questions and research for later phases.

Part 3 links to optional references for state, relationships, and layout. Its [scenario rubric](docs/03-scenarios/README.md) applies the model, starting with a simple form and extending to the seven hero scenarios.

Part 4 links to the primitive catalogue, a library authoring walkthrough, initial entity shapes, and a distribution sketch for independent registries and v0. These remain design proposals.

The test for every design decision: **Does this make building and changing complex workflows dramatically easier than composing shadcn components manually?**
