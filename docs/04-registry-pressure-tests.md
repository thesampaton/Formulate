# Part 4 Reference — Registry Pressure Tests

[Back to Part 4](04-registry.md) · [Library authoring](04-library-authoring.md)

These applied examples test whether the primitive and library contracts carry enough meaning. They are examples a library author might define.

## Field contracts

| Example | Initial value shape | What it tests |
| --- | --- | --- |
| Email | Editing string; accepted email string. | Value validation and presence requirements compose independently of renderer defaults. |
| Password | Secret string, with empty editing state. | Sign-in and account-creation policies can differ; review, inspection, and draft handling respect sensitive values. |
| Phone number | Editing `{ text, country }`; accepted `{ number, extension? }`. | One field can have multiple controls and explicit parsing/normalisation. |
| Cost centre | `CostCentreId` or empty, with organisation input. | Outside context and eligibility services are explicit; two uses remain independent. |
| AWS region | `RegionId` or empty, with account input. | Changing Account invalidates earlier eligibility evidence and refreshes dependent choices. |
| Kubernetes namespace | `{ clusterId, name }` or empty. | A selected value can carry the context required to identify it. Selection and creation can have different contracts. |
| GitHub repository | `{ host, repositoryId }` or empty. | Stable selection identity can differ from displayed names and URLs. |
| Employee picker | `{ organisationId, employeeId }` or empty. | The application supplies directory access and eligibility; display data need not become submitted data. |

Exact domain formats belong to their library adapters. Empty and incomplete values must stay representable. Required checks distinguish pending, failed-to-load, and confirmed-invalid results; absence from one search page does not by itself invalidate a selection.

## Composition and distribution

| Test | Required outcome |
| --- | --- |
| Build a direct contact form, then extract ContactDetails. | Preserve bindings and rules; extraction adds reusable exports. |
| Use ContactDetails for requesting and billing. | Separate values, requirements, inputs, and state for each use. |
| Split a section across Pages, then add Review. | Same member identities and payload; Pages reference assigned requirements; Review adds no value owner. |
| Reuse a Page in two Forms. | Each host supplies its outside inputs and destinations. |
| Compose Account and Region into DeploymentTarget. | Each repeated use keeps its account-to-region connection local; stale responses cannot affect another use. |
| Publish ContactPage through `@acme`. | Its declared dependencies acquire the required Formulate primitives and library source. |
| Add a chart or navigation item to `@acme`. | Ordinary shadcn items can coexist with Formulate-based items. |
| Import a composition into a clean app or v0 starter. | Source, dependencies, styles/providers, and supplied example services produce a working composition. |

These are checks for later prototypes. The [Part 3 pressure tests](03-mental-model-pressure-tests.md) hold the detailed runtime acceptance cases.
