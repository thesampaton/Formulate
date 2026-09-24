# Schema-driven composition

Formulate composes a whole form from value schemas and the relationships between
them. The same definition supplies rendering, validation and parsed submit values.
Start with one nested definition, then extract reusable fields or sections as the
form grows.

## A whole form in one schema

Start with the [workshop registration example](../../../examples/react/src/compositions/workshop-registration.tsx),
available as **Schema composition** in the example app. Its complete module defines
the form, its nested contact section, and its React view together. Zod owns value
validation and parsing. Formulate composes those value schemas with defaults,
labels, controls and the condition that makes a company name applicable.

<!-- workshop-authoring:start -->
```tsx
import { z } from "zod";
import { defineForm, defineSection } from "@/lib/formulate-config";
import { FieldGroup } from "@/components/ui/field";
import { FormSubmitButton } from "@/components/formulate/form-actions";

export const WorkshopRegistration = defineForm({
  contact: defineSection({
    name: {
      schema: z.string().trim().min(1, "Enter your name."),
      defaultValue: "", label: "Name", component: "input",
    },
    email: {
      schema: z.email("Enter a valid email address."),
      defaultValue: "", label: "Email", component: "input",
      componentProps: { type: "email" },
    },
  }, { title: "Contact details", layout: FieldGroup }),
  needsInvoice: {
    schema: z.boolean(), defaultValue: false,
    label: "I need an invoice", component: "checkbox", orientation: "horizontal",
  },
  company: {
    schema: z.string().trim().min(1, "Enter a company name."),
    defaultValue: "", label: "Company name", component: "input",
    applicable: { binding: "needsInvoice", equals: true },
  },
}, { id: "workshop-registration", layout: FieldGroup });

export type Registration = z.output<typeof WorkshopRegistration.schema>;

export function WorkshopRegistrationForm({ onRegister }: {
  onRegister: (values: Registration) => void | Promise<void>;
}) {
  const form = WorkshopRegistration.useForm();
  return (
    <WorkshopRegistration.Form form={form} onSubmit={onRegister}>
      <WorkshopRegistration.Fields />
      <FormSubmitButton pendingLabel="Registering…">Register</FormSubmitButton>
    </WorkshopRegistration.Form>
  );
}
```
<!-- workshop-authoring:end -->

`WorkshopRegistration.Fields` renders the declared hierarchy, including the
contact section. The invoice checkbox controls the company field through its
schema's `applicable` condition. The same composed schema checks submission,
trims the name and company, and omits the company from the payload when an invoice
is not requested. The React component creates the form instance, renders its fields
and passes parsed submission values to `onRegister`.

This is enough to author and render a whole form. As it grows, move a field or
section into a reusable definition; its validation and applicability travel with
it. The cloud example below shows that next step.

## A larger composition: cloud deployment

Use `defineField`, `defineSection`, `defineForm`, `defineChoice`, and the existing
composed-value segments to assemble a nested interaction schema. Reusing a
definition carries its rules into each independently scoped instance. TypeScript
object literals are an authoring syntax for this schema composition.

The composed schema also has a hierarchical JSON representation and a normalized
graph. `toPortable()` produces these representations with a separate registry of
named host capabilities. Normal `Definition.useForm({ services })`, `useGraphForm`,
and headless inspection apply the same schema semantics. Export preserves the
behavior already established by composition.

The existing cloud example composes a reusable deployment-target schema twice,
with independent account and region bindings. Each use carries its validation and
dependent region choices. The enclosing schema adds a composed deployment name
and a production-only requirement.

Its source panel places **Schema composition** and **Generated graph** together.
The graph entry is computed by `CloudDeployment.toPortable().graph` from the
imported module, keeping both views tied to the same composed schema.

This is the complete [authoring module](../../../examples/react/src/declarations/cloud-deployment.ts):

<!-- cloud-authoring:start -->
```ts
import { z } from "zod";
import { defineChoice, defineField } from "@formulate/react";
import type { Choice, ChoiceLoader } from "@formulate/react";
import { defineForm, defineSection, field } from "@/lib/formulate-config";

export const regionChoices = defineChoice({
  dependencies: ["accountId"],
  getInput: (target: { accountId: string }) => target.accountId || null,
  getRequestKey: (input: string) => input,
  getLoader: (services: { listRegions: ChoiceLoader }) => services.listRegions,
  validateSelection: (selection: string, options: readonly Choice[]) => {
    if (!selection) return "Choose an available option.";
    const isAvailable = options.some((option) => option.value === selection);
    return isAvailable ? undefined : "The retained choice is unavailable. Choose another option.";
  },
  messages: { missing: "Choose an account first.", pending: "Checking available choices…", failed: "Choices could not be loaded. Retry to continue." },
});

export const accounts = [{ value: "A", label: "Account A" }, { value: "B", label: "Account B" }, { value: "C", label: "Account C" }];
export const DeploymentTarget = defineSection({
  accountId: {
    schema: z.string().pipe(z.enum(["A", "B", "C"], { error: "Choose an account." })),
    defaultValue: "", label: "Account", component: "select", componentProps: { options: accounts },
  },
  regionId: {
    schema: z.string().min(1, "Choose an available option."), choices: regionChoices,
    defaultValue: "", label: "Region", component: "select", componentProps: { options: [] },
  },
}, { title: "Deployment target", definitionId: "cloud.deployment-target" });

// Reusing this definition carries its value contract and composition with it.
export const DeploymentName = defineField({
  primitive: "text", definitionId: "cloud.deployment-name",
  schema: z.string(), defaultValue: "", label: "Deployment name",
  component: "input", componentProps: { readOnly: true },
  composition: { segments: [{ binding: "environment" }, { literal: "-" }, { binding: "primary.accountId" }] },
});

export const CloudDeployment = defineForm({
  environment: {
    schema: z.string().pipe(z.enum(["development", "production"])),
    defaultValue: "development", label: "Environment", component: "select",
    componentProps: { options: [{ value: "development", label: "Development" }, { value: "production", label: "Production" }] },
  },
  primary: DeploymentTarget.use({ id: "primary", bind: "primary" }),
  recovery: DeploymentTarget.use({ id: "recovery", bind: "recovery" }),
  resourceName: field(DeploymentName, { id: "deployment-name", bind: "resourceName" }),
  production: {
    applicable: { binding: "environment", equals: "production" },
    schema: z.string().trim().min(1, "Enter a production change reference."),
    defaultValue: "", label: "Production change reference", component: "input",
  },
}, {
  id: "deployment", definitionId: "cloud.deployment",
  children: [
    "environment",
    { id: "targets", role: "page", label: "Targets", children: ["primary", "recovery", "resourceName"] },
    { id: "production-page", role: "page", label: "Production configuration", children: ["production"] },
  ],
});
export type CloudValues = z.input<typeof CloudDeployment.schema>;
export type CloudPayload = Omit<z.output<typeof CloudDeployment.schema>, "production"> & { production?: string };

/** Export is a projection of the authored definition; no graph edits are needed. */
export function createCloudGraph(listRegions: ChoiceLoader) {
  return CloudDeployment.toPortable({ services: { listRegions } });
}
```
<!-- cloud-authoring:end -->

The following is the complete normalized graph of that composed interaction
schema, generated directly from the authoring module.

<!-- cloud-graph:start -->
```json
{
  "version": 1,
  "root": "deployment",
  "nodes": {
    "deployment": {
      "id": "deployment",
      "role": "form",
      "use": "cloud.deployment",
      "validate": {
        "capability": "deployment.deployment.schema.validate"
      },
      "parse": {
        "capability": "deployment.deployment.schema.parse"
      }
    },
    "environment": {
      "id": "environment",
      "role": "field",
      "bind": "environment",
      "label": "Environment",
      "defaultValue": "development",
      "contract": {
        "type": "string",
        "enum": [
          "development",
          "production"
        ]
      },
      "valueSchema": {
        "type": "string",
        "enum": [
          "development",
          "production"
        ]
      },
      "validate": {
        "capability": "deployment.environment.validate"
      }
    },
    "targets": {
      "id": "targets",
      "role": "page",
      "label": "Targets"
    },
    "primary": {
      "id": "primary",
      "role": "section",
      "use": "cloud.deployment-target",
      "validate": {
        "capability": "deployment.primary.schema.validate"
      }
    },
    "primary.accountId": {
      "id": "primary.accountId",
      "role": "field",
      "bind": "primary.accountId",
      "label": "Account",
      "defaultValue": "",
      "contract": {
        "type": "string",
        "enum": [
          "A",
          "B",
          "C"
        ]
      },
      "valueSchema": {
        "type": "string",
        "enum": [
          "A",
          "B",
          "C"
        ]
      },
      "validate": {
        "capability": "deployment.primary.accountId.validate"
      }
    },
    "primary.regionId": {
      "id": "primary.regionId",
      "role": "field",
      "bind": "primary.regionId",
      "label": "Region",
      "defaultValue": "",
      "contract": {
        "type": "string",
        "minLength": 1
      },
      "valueSchema": {
        "type": "string",
        "minLength": 1
      },
      "validate": {
        "capability": "deployment.primary.regionId.validate"
      },
      "choices": {
        "dependencies": [
          "primary.accountId"
        ],
        "capability": "deployment.primary.regionId.choices"
      }
    },
    "recovery": {
      "id": "recovery",
      "role": "section",
      "use": "cloud.deployment-target",
      "validate": {
        "capability": "deployment.recovery.schema.validate"
      }
    },
    "recovery.accountId": {
      "id": "recovery.accountId",
      "role": "field",
      "bind": "recovery.accountId",
      "label": "Account",
      "defaultValue": "",
      "contract": {
        "type": "string",
        "enum": [
          "A",
          "B",
          "C"
        ]
      },
      "valueSchema": {
        "type": "string",
        "enum": [
          "A",
          "B",
          "C"
        ]
      },
      "validate": {
        "capability": "deployment.recovery.accountId.validate"
      }
    },
    "recovery.regionId": {
      "id": "recovery.regionId",
      "role": "field",
      "bind": "recovery.regionId",
      "label": "Region",
      "defaultValue": "",
      "contract": {
        "type": "string",
        "minLength": 1
      },
      "valueSchema": {
        "type": "string",
        "minLength": 1
      },
      "validate": {
        "capability": "deployment.recovery.regionId.validate"
      },
      "choices": {
        "dependencies": [
          "recovery.accountId"
        ],
        "capability": "deployment.recovery.regionId.choices"
      }
    },
    "deployment-name": {
      "id": "deployment-name",
      "role": "field",
      "bind": "resourceName",
      "label": "Deployment name",
      "defaultValue": "",
      "use": "cloud.deployment-name",
      "contract": {
        "type": "string"
      },
      "valueSchema": {
        "type": "string"
      },
      "validate": {
        "capability": "deployment.deployment-name.validate"
      },
      "composition": {
        "segments": [
          {
            "binding": "environment"
          },
          {
            "literal": "-"
          },
          {
            "binding": "primary.accountId"
          }
        ]
      }
    },
    "production-page": {
      "id": "production-page",
      "role": "page",
      "label": "Production configuration"
    },
    "production": {
      "id": "production",
      "role": "field",
      "bind": "production",
      "label": "Production change reference",
      "defaultValue": "",
      "applicable": {
        "binding": "environment",
        "equals": "production"
      },
      "validate": {
        "capability": "deployment.production.validate"
      }
    }
  },
  "relations": [
    [
      "deployment",
      "contains",
      "environment"
    ],
    [
      "deployment",
      "contains",
      "targets"
    ],
    [
      "targets",
      "contains",
      "primary"
    ],
    [
      "primary",
      "contains",
      "primary.accountId"
    ],
    [
      "primary",
      "contains",
      "primary.regionId"
    ],
    [
      "targets",
      "contains",
      "recovery"
    ],
    [
      "recovery",
      "contains",
      "recovery.accountId"
    ],
    [
      "recovery",
      "contains",
      "recovery.regionId"
    ],
    [
      "targets",
      "contains",
      "deployment-name"
    ],
    [
      "deployment",
      "contains",
      "production-page"
    ],
    [
      "production-page",
      "contains",
      "production"
    ],
    [
      "primary.regionId",
      "dependsOn",
      "primary.accountId"
    ],
    [
      "recovery.regionId",
      "dependsOn",
      "recovery.accountId"
    ],
    [
      "deployment-name",
      "dependsOn",
      "environment"
    ],
    [
      "deployment-name",
      "dependsOn",
      "primary.accountId"
    ]
  ]
}
```
<!-- cloud-graph:end -->

## Composing nodes and binding values

| Concept | Authored API | Graph representation |
| --- | --- | --- |
| Instance identity | Field `id`, section `.use({ id })`, form `id` | Node `id` |
| Value / payload address | Field `bind`, section `.use({ bind })` | Node `bind` |
| Presentation location | Nested `children` referencing declared members | `contains` relations |
| Reusable definition identity | `definitionId` | Node `use` |

The `resourceName` member has node ID `deployment-name` and value binding
`resourceName`. Moving its member reference between the authored pages changes
containment only. Its value, composition and identity remain the same. Section
uses supply their scopes before export; the reused target's local `accountId`
and `regionId` become `primary.accountId` / `primary.regionId` and
`recovery.accountId` / `recovery.regionId`. Neither section owns live state.

JSON is an alternative representation of the same composed interaction schema.
The nested tree returned by `toPortable()` preserves the hierarchy and rules;
`normalizeGraph(authoring)` resolves it into nodes and relations for evaluation.
Both representations use the same normalizer and runtime. Normalization rejects
duplicate identities, overlapping bindings, missing references, dependency cycles
and executable callbacks.

## Schema authority and named capabilities

Write an enum, minimum, refinement or transform once in the value's schema.
Compose applicability and dependencies with the fields and sections they govern.
These rules remain attached to reusable definitions through nesting and reuse.

Ordinary supported schemas produce `valueSchema` descriptions and compact
`contract` summaries automatically. Supported descriptions include basic strings,
lengths, regular expressions without flags, enums, numbers, booleans, objects,
arrays, optional/nullable values and primitive validation pipelines. Descriptions
use Zod's input representation so output transformations and object stripping
cannot narrow the accepted editing shape.

These descriptions support inspection; the original definition's schema remains
the validation and payload authority. A node with a validation capability does not
also enforce its descriptive contract as a second validator. Optional strings,
empty strings, nullable values and custom root schemas therefore retain their
original meaning. A schema requiring a property to exist is not converted into
an extra rule rejecting every empty value.

Coercion, overwrites such as `.trim()`, transforms, refinements, default factories
and regex flags are kept behind named capabilities when they cannot be described
faithfully. Export does not execute these functions or claim they were converted.
This is why the production field carries its applicability and validation reference,
while its trim/minimum behavior remains in the original schema capability. The
root parser produces the same output as the normal form's effective schema,
including custom section/form refinements and transforms.

Choice loaders and selection policies, composition transforms/parsers, and actions
also use named host capabilities. After JSON transport, the host must register
compatible implementations under those names. Missing implementations produce
`unresolved`, never a fallback that accepts unchecked values. React controls,
component props, page navigation and current presentation state remain outside
the graph.

## Evaluating the composed schema

The [cloud hook](../../../examples/react/src/hooks/use-cloud-deployment.ts) creates
an interaction from the composed schema through the ordinary form API:

```ts
const form = CloudDeployment.useForm({ services: { listRegions }, defaultValues });
```

Its exported graph supplies containment to `GraphRenderer`, while the host chooses
controls and container layouts. A host that receives JSON can use the explicit
React projection instead:

```ts
const { graph, capabilities } = CloudDeployment.toPortable({ services: { listRegions } });
const form = useGraphForm(graph, { capabilities, defaultValues });
```

An agent or server consumes the same graph and capabilities without React:

```ts
const runtime = createGraphRuntime(JSON.parse(JSON.stringify(graph)), {
  capabilities,
  state: { values: {
    environment: "production",
    "primary.accountId": "A", "primary.regionId": "A1",
    "recovery.accountId": "B", "recovery.regionId": "B1",
    production: "  CHANGE-123  ",
  } },
});
runtime.update({ production: "  CHANGE-456  " });
const snapshot = runtime.inspect();
// When dependent choices settle, snapshot.payload contains the trimmed change
// reference and the composed resourceName: "production-A".
```

State is separate and uses flat binding keys; an object or array field remains one
atomic value. Invalid drafts are retained. Inapplicable drafts remain in state but
are omitted from payloads. Direct edits to fully derived fields and unknown bindings
are rejected. Completion and payloads are derived from the graph, values and current
choice evidence, not another stored checklist.

| Status | Meaning |
| --- | --- |
| `missing` | An empty value fails its declared validation |
| `invalid` | A validator, parser, contract or choice selection fails |
| `blocked` | A dependency needs completion first |
| `pending` | Validation, parsing or choice evidence is still being evaluated |
| `unresolved` | Required host behavior is missing or cannot be evaluated |
| `complete` | Applicable rules pass and payload construction succeeds |

The [parity tests](../../../tests/portable-cloud.test.tsx) exercise normal React use
before an explicit export, graph-backed React use, and a simulated agent. They
compare rejected production drafts, dependency blocking, retained choices, composed
values and final trimmed payloads. The existing cloud UI tests also cover stale
requests, retries, retained branches and submission error focus.

Named validation and parsing capabilities may be synchronous or asynchronous.
The original schema runs once for a given evaluation and supplies validation and
payload output to both projections. React validation/submission waits for schema
settlement; headless callers can await `runtime.waitForValidation()` and subscribe
to further snapshots as choice evidence arrives. Obsolete async results cannot
replace the current evaluation.

Both normal form hooks and `useGraphForm` accept async `defaultValues` and reactive
`values`. Choice loaders remain asynchronous and abortable. Composed-value segment
transforms and composition parsers remain synchronous. Graph values and outputs
must be JSON data; the established native form path continues supporting
non-JSON editing values. No cloud catalogue, Terraform importer or agent framework
is required by this model.
