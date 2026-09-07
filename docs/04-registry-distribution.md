# Part 4 Reference — Distribution and Consumers

[Back to Part 4](04-registry.md) · [Primitive catalogue](04-registry-catalogue.md) · [Library authoring](04-library-authoring.md)

**A user's registry owns its catalogue and declares Formulate as a dependency wherever it is used.** This reference sketches that shape and its consumers. Hosting, release tooling, and v0 integration are later work. Names, files, and `.example` endpoints below are illustrative.

## Namespace configuration

A consumer can configure both registries in its existing `components.json`:

```json
{
  "registries": {
    "@formulate": "https://registry.formulate.example/r/{name}.json",
    "@acme": "https://registry.acme.example/r/{name}.json"
  }
}
```

The intended installation pattern is:

```sh
npx shadcn@latest add @formulate/form @formulate/field
npx shadcn@latest add @acme/contact-page
```

The first line acquires primitives for direct authoring. The second acquires a composed item and its declared dependencies. Application code then imports installed local exports. Namespace addresses describe acquisition. [shadcn namespaces](https://ui.shadcn.com/docs/registry/namespace).

## An independent registry

```text
@acme registry
  contact-page ──── @formulate/page
       └────────── @acme/contact-details
                         ├── @formulate/section
                         ├── @formulate/field
                         └── @acme/email + renderer source
  dashboard ────── chart and navigation libraries
  brand-theme ──── shared design tokens
```

Acme can distribute many kinds of components and libraries through standard shadcn items. A Formulate-based composition declares the primitives it uses in `registryDependencies`; npm imports belong in `dependencies`. Each item declares its own direct requirements, including requirements from the same registry. [Registry item schema](https://ui.shadcn.com/docs/registry/registry-item-json).

For example, the ContactPage definition from the authoring guide could be distributed as:

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "contact-page",
  "type": "registry:block",
  "title": "Contact page",
  "description": "A reusable page that presents a supplied ContactDetails section and exposes a continue navigation connection.",
  "registryDependencies": ["@formulate/page", "@acme/contact-details"],
  "files": [
    {
      "path": "registry/contact-page/contact-page.ts",
      "type": "registry:lib",
      "target": "@lib/acme/contact-page.ts"
    }
  ],
  "meta": {
    "formulate": {
      "exports": [{ "name": "ContactPage", "kind": "page" }]
    }
  }
}
```

`registry:block` is the shadcn distribution type. `page` describes the exported Formulate entity. The proposed `meta.formulate` summary helps discovery; source definitions remain authoritative. A logical Page can be installed as library code, with its route or tab supplied by the consuming application.

The primitive items themselves declare their required source and runtime packages. Published manifests must include every actual import and compatible versions. Shared coordination must resolve consistently across all installed primitives.

A library can have several items or one item exporting several definitions. Its registry index lists those items; larger source indexes can be organised with shadcn's `include`. [Registry schema](https://ui.shadcn.com/docs/registry/registry-json).

## Using the same library in v0

The intended outcome is that developers and v0 can compose with the same primitives and library exports. The import path must bring enough code and context to run them.

| Consumer path | What to provide |
| --- | --- |
| React application / shadcn CLI | Source items, complete registry/package dependencies, local import paths, and setup documentation. |
| v0 Design Systems 2.0 | Installable library code or a package, documentation, and a working consumer/starter showing providers, styles, and composition. |
| Open in v0 registry endpoint | An accessible item URL and compatible payload; a runnable example for a primitive or composition. |

v0's current Design Systems 2.0 import learns from source, installable packages, docs, and consumer applications, then builds a starter and saves reusable instructions. This suggests a route for teaching v0 Formulate or an organisation library; we still need to prove the resulting composition in a working starter. [v0 Design Systems 2.0](https://v0.app/docs/design-systems-2).

The separate shadcn **Open in v0** endpoint currently documents restrictions on namespaced registries, advanced authentication, and manifest `cssVars`, `css`, and `envVars`. Namespaced CLI installation therefore does not automatically prove compatibility with that endpoint. A future export may need resolved dependency URLs or bundled source and explicit setup. [Open in v0](https://ui.shadcn.com/docs/registry/open-in-v0).

For a Page primitive or a ContactPage definition, the preview example supplies a Form and sample members. For a domain picker, it supplies fixture services. These examples show usable composition and give generation tools context; the underlying exports remain usable in ordinary application code.

## Shape requirements for later publishing

Each published item needs meaningful title/description, public exports, complete dependencies, setup instructions, configuration points, and a small runnable example. The authoring documentation must explain how to use a library item and how to build another one from the same primitives.

Later publishing work will settle hosting/authentication, immutable releases, compatibility/provenance, and reviewed updates to locally owned source. v0 integration should verify imports, providers/styles, dependency resolution, and behaviour in a clean starter. None of that requires a user's registry to contain only Formulate items.
