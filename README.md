# Formulate

**The workflow composition layer for forms built with shadcn/ui.**

Formulate is a proposed React and TypeScript library for composing fields, layouts, sections, and pages into complete form experiences. Validation, conditional behaviour, navigation, and submission work together, while developers own the UI code. React Hook Form and Zod are the default engines.

The project is currently in product and architecture discovery. There is no implementation or published API yet.

- [Part 1 — Product Vision](docs/01-product-vision.md): the product direction.
- [Part 2 — Design Principles](docs/02-design-principles.md): principles guiding the APIs and architecture.
- [Part 3 — Mental Model](docs/03-mental-model.md): the composition hierarchy, reusable definitions, and their instances.
- [Part 3 references and relationships](docs/03-references-and-relationships.md): local field references, scope, and conditional behaviour.
- [Part 3 layout and presentation](docs/03-layout-and-presentation.md): ordinary CSS, ordered content, styling surfaces, and focus boundaries.
- [Part 3 state and completion](docs/03-state-and-completion.md): shared form state and completion across fields, sections, and pages.
- [Part 3 simplicity rubric](docs/03-scenarios/simple-form.md): a minimal form, optional capabilities, and the cost of adding or removing them.
- [Part 3 scenario rubric](docs/03-scenarios/README.md): seven hero scenarios and focused examples illustrated in pseudocode.
- [Part 3 pressure tests](docs/03-mental-model-pressure-tests.md): adversarial checks for the model.
- [Design notes](docs/design-notes.md): open architecture questions and research for later phases.

The test for every design decision: **Does this make building and changing complex workflows dramatically easier than composing shadcn components manually?**
