# Building blocks, libraries and distribution

[Part 4](04-registry.md) · [Current installable items](registry-development.md)

Formulate has three distinct vocabularies: a building block's responsibility, the source artifacts used to author it, and the unit used to distribute it. Keeping these separate makes the same model useful for local application code, reusable libraries and registry consumers.

## Responsibilities

| Responsibility | Current implementation | Ownership boundary |
| --- | --- | --- |
| Core | Form, Field, Section, Page, declaration helpers, binding contexts, navigation correction and action attempts in `packages/react`. | RHF remains the editing-value authority and Zod executes validation. Core coordinates their use; it imports no shadcn components. |
| shadcn bindings | Connected controls, field presentation, control map and pending editor boundary. | Attach the core contract to local shadcn exports: value/events, refs, accessible IDs and pending state. |
| Fields and sections | Common `defineField` definitions (Email, Currency and others), Name, Address and Notifications. | Package domain values, rules, local relationships and default presentation. An Address is a section containing fields, even if it is acquired as one registry item. |
| Layouts | Replaceable Form/Page/Section body layouts and FormStepLayout; ordinary spacing and grids use shadcn FieldGroup directly. | Arrange content and slots. A page layout may supply a default action component; that component owns action selection. Layouts introduce no value bindings or requirements. |
| Navigation | FormTabs, FormTabPanel, FormTabPage and page context. | Present and select pages, preserve panel semantics, and connect page composition to host navigation. |
| Actions | Submit/Continue/Back buttons and page/review action sets. | Expose intents and reflect pending state. Form handles validation/attempts; navigation supplies destinations; the application supplies save handlers. |
| Application composition and behaviour | Form compositions, page scopes, completion derivation, save baselines and summary readers. | Bind reusable parts to a particular experience. The current profile hook and completion rules remain example code. Extract these only when reuse demonstrates a suitable contract. |

A Back button is an action control that requests navigation. A horizontal shadcn Field arranges action controls. FormStepLayout places an action slot after page content. These responsibilities connect without becoming synonyms.

The code browser uses these responsibilities to group relevant source. Its **This form** category contains the composition, declaration, sample data and any form-specific summary. **Form behaviour** exposes the current example's coordination code. The browser names the actual registry item when one exists; local reusable source is not presented as already packaged.

## Authoring artifacts

A **declaration** supplies members, schemas, defaults and optional default presentation. A **composition** is React code that arranges or uses them. A hook or ordinary function can implement behaviour; sample data supplies example inputs. These describe source artifacts, not additional runtime entities.

A reusable section can legitimately carry a declaration, rendering component and local behaviour together. Splitting every concern into another file is unnecessary. Split when responsibilities can be independently used or changed, as with FormStepLayout and the action buttons.

A **library** is a collection of reusable exports, with their documented contracts. It may contain fields, sections, layouts, actions, pages or complete forms. User libraries use the same existing `defineField`, `field`, `defineForm`, `defineSection` and React composition mechanisms as the built-in examples.

A field's **primitive type** is a smaller vocabulary within the field model: `text`, `number`, `boolean`, `choice`, `multiChoice`, `date`, `time`, `dateTime`, `file`, `object`, `array`. These describe value/form semantics, not building-block responsibilities or components. A reusable Email definition has primitive `text` and nominates the `input` control name. A form's `field(Email)` use is checked against its local control map. See [field authoring and overrides](../packages/react/docs/fields-and-sections.md#reuse-a-semantic-field).

## Distribution units

A **package** and a **registry item** are delivery units. Neither introduces a Formulate runtime entity or dictates a one-to-one relationship with the responsibilities above.

| Actual unit | Contents and purpose |
| --- | --- |
| Private workspace package `@formulate/react` | Current core development boundary. Not published. |
| `@formulate/core` | Registry source for the same core runtime, installed at the consumer's shared `@/lib/formulate` boundary. |
| `@formulate/common-fields` | Portable semantic field definitions, dependent only on core and Zod; actual controls come from local bindings. |
| `@formulate/shadcn-bindings` | Form bindings over local shadcn components and the declaration control map. |
| `@formulate/actions` | Basic action buttons, installable without page navigation. |
| `@formulate/navigation` | A useful page-composition bundle: navigation components, page action sets and FormStepLayout; depends on core, actions and local shadcn Field and Tabs. |
| `@formulate/name` | A domain section with its own required dependencies. |

Address and Notifications are reusable local source today; they are not yet registry items. Email is distributed with common fields. A future `@acme/address` can package a section and its presentation together. A larger `@acme/customer-form` can depend on it. These are examples of future author-owned items, not additional core primitives.

The manifest's standard `categories` describe discovery tags and may include several responsibilities. Its `type` and file targets control source delivery. `registryDependencies` names source items; `dependencies` names npm packages. The dependency graph must remain complete and resolve core contexts to one shared implementation. See the [shadcn item contract](https://ui.shadcn.com/docs/registry/registry-item-json).

This does not commit us to a separate npm package per category. The core/package release strategy can follow evidence; the current source registry already gives consumers independently installable pieces.

Shadcn is the intended UI baseline. Its CLI owns install-time customisation: it reads the consumer's `components.json`, chooses source locations and rewrites imports. Formulate's installed bindings then import those local components directly. The control map selects bindings for declaration keys; it does not resolve installation paths or load UI backends at runtime. This keeps distribution choices separate from the form API. The example browser's **Installation** category shows the actual CLI configuration, separately from **shadcn bindings**. See the [installation boundary](registry-development.md#installation-config-and-runtime-bindings).

## v0 and other consumers

The same library should support direct imports, installation through the shadcn CLI, and generation tools consuming runnable examples and clear contracts. A registry entry needs its exports, dependencies, setup and configuration points documented. A complete form example can show how those exports cooperate without making its demo scaffolding part of the reusable item.

Shadcn's documented Open in v0 mechanism consumes a hosted item URL and currently has restrictions on namespaced registries, manifest styling/environment fields and authentication. Our local namespaced installation therefore does not establish that integration. Public hosting, a compatible payload and a working generated consumer remain to be verified. See [Open in v0](https://ui.shadcn.com/docs/registry/open-in-v0) and the [distribution reference](04-registry-distribution.md).

Generating a form in v0 is a consumer workflow. Publishing a reusable item adds a separate responsibility: preserving a clear contract and complete dependencies so it remains useful outside its original generated app. The ontology should describe that contract regardless of who authored the source.
