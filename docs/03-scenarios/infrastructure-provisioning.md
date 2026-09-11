# Infrastructure provisioning (Terraform)

[Scenario rubric](README.md) · [State and completion](../03-state-and-completion.md)

Repeated resources feed an application-generated plan. Provisioning requires a plan matching the current configuration, including application-supplied inputs.

**Status: gate 3 demonstrated by the [infrastructure form](../../examples/react/src/compositions/infrastructure.tsx) and [nine executable cases](../../tests/infrastructure.test.tsx).** RHF field arrays, bound Resource uses and an application draft adapter support the bounded exercise; no new repeat or core persistence API was introduced. Each Resource use now shares its durable ID and current paths across Bind, choice behavior/local presentation and correction. See [evidence and contract decisions](../05-06-rendering-and-workflow.md#complex-workflow-evidence). The Terraform services in the model below remain application responsibilities; the demo uses local plan references.

The [authoring correction](../05-06-rendering-and-workflow.md#course-corrections-retained) reuses Cloud's choice integration and the existing Form action/navigation machinery. Preview is the Configure submit action, including Enter and pending handling. Draft compatibility, snapshot acknowledgement and returned-plan acceptance remain application policy; the behavioural pass does not close the authoring gate.

```text
library section Resource
  input: regionId
  service: listMachineSizes(regionId)
  name = use ResourceName at name
  size = use MachineSize at machineSize
    regionId <- section.regionId
    listMachineSizes <- section.listMachineSizes
  require: name, size

form InfrastructureRequest
  input: accountId from application.selectedAccountId
  region = use AWSRegion at regionId
    accountId <- form.accountId
    listRegions <- application.listRegions
  require: region

  resources = repeat Resource at resources keyed by stable item identity
    regionId <- region.value
    listMachineSizes <- application.listMachineSizes
  validate: at least one resource; resource names are unique

  action PreviewPlan:
    validate: connected account, region, and all resource requirements
    payload: snapshot of accountId, region, and resources
    handler: application.previewTerraformPlan

  pages:
    Configure: present region, resources; offer PreviewPlan
    Review:
      review region, resources
      show application plan matching the current configuration
      require matching plan before Provision is available

  submit Provision:
    validate: current configuration and matching plan requirement
    payload: configuration snapshot + matching application plan reference
    handler: application.requestProvisioning
```

Each repeated Resource has independent fields. Stable item identity survives array reordering; the form owns the collection-wide uniqueness rule.

The plan is application-owned review information, not another editable field. Its matching requirement can keep Review and the form incomplete when all inputs are valid. Matching covers the connected account as well as editable values. Merely visiting Review proves neither plan currency nor human acknowledgement.

| Change | Required outcome |
| --- | --- |
| Reorder or delete resources during size lookups. | Results follow surviving item identities; a removed item's response cannot update its former array position. |
| Change account, region, or a resource after preview. | Invalidate the old plan. A late result for the previous snapshot cannot enable Provision. |
| Split a Resource across pages. | Preserve its bindings. One page may complete while the whole Resource still has unmet requirements. |
| Unmount Configure, then change account. | Retain draft values; recheck dependent selections and plan readiness. |
| Receive a provisioning rejection. | Identify the affected attempt and requirements while preserving useful work. |

The application verifies the plan reference and owns authorisation, Terraform state, approval, and execution.

## Gate 3: repeated sections and draft restoration

Start with RHF `useFieldArray` and the existing Resource section, using application-supplied machine-size lookups. Keep RHF as the only editing-value authority. Establish whether Formulate needs any additional binding/coordination support from actual friction; a new repeat primitive is not a prerequisite.

Distinguish three identities: the stable UI identity used for the mounted RHF array, the current index-based binding path, and the durable resource ID supplied by the application and saved in its draft. Specify their mapping explicitly. A new runtime may have new UI identities; durable IDs must still identify restored resources. Neither an old index nor a React key alone is a persistence or server-error protocol.

| Phase | Exercise | Acceptance evidence |
| --- | --- | --- |
| Repeat | Create resources R1 and R2 with distinct values, errors, and pending size lookups; reorder them. | Values, local dependencies, and errors follow the surviving resources; current bindings reflect their new positions. Collection requirements still check nonempty resources and unique names. |
| Remove/insert | Delete R1 and add R3 at its old position before R1's lookup or correction request resolves. | R1's response/focus request is discarded. R3 inherits no value, error, or success from R1; correction finds a surviving item's current editor or a reachable collection fallback. |
| Save draft | Save an incomplete editing snapshot through an application adapter, then edit again before save acknowledgement. | The stored snapshot remains fixed; success acknowledges that snapshot only and does not overwrite or mark newer edits saved. Draft saving does not require a valid provisioning payload. |
| Restore | Destroy the form runtime and restore the stored draft into a fresh runtime. | Restore resource order, durable IDs, and permitted editing values through RHF initialization/reset. Recompute bindings, applicability, requirements, and available destinations. Do not restore validation errors, completion, request generations, or plan readiness as trusted evidence. |
| Changed reality | Restore after available machine sizes or permissions change, or the saved definition version differs. | Fresh service checks expose invalid retained choices and offer correction. The application explicitly migrates/selects a supported version or reports incompatibility without silently discarding/reinterpreting the draft. Provision remains blocked until current requirements and a matching plan pass. |

The application draft envelope contains a definition/version identifier, durable item IDs, permitted editing values, and a snapshot/revision identifier for acknowledgement. A saved location is optional and advisory: resolve it against current available destinations. The application chooses storage, sensitive-field exclusions, compatibility/migration policy, and how to report load/save failures while preserving current work. Formulate coordinates rechecking and correction after accepted restoration; it does not own storage or migrations.

The test adapter can be deterministic in-memory storage retained across runtime destruction. That proves the handoff, not browser-reload durability; claim reload recovery only after testing a persistent application adapter across reload. A late load must not silently reset edits made after restoration began. A restored plan reference requires application verification against the current configuration; a serialized “ready” flag cannot enable Provision.

Use the [survey's definition-change checks](dynamic-survey.md) to review this recovery contract. Do not build a second repeat/persistence mechanism there. Record runnable evidence and any additional abstraction in the implementation anchor; Terraform integration, autosave scheduling, and general server-error reconciliation remain later work.

**Later API question:** How should application results expose configuration references so readiness can reject stale plans without duplicating Terraform's execution model?
