# Infrastructure provisioning (Terraform)

[Scenario rubric](README.md) · [State and completion](../03-state-and-completion.md)

Repeated resources feed an application-generated plan. Provisioning requires a plan matching the current configuration, including application-supplied inputs.

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

**Later API question:** How should application results expose configuration references so readiness can reject stale plans without duplicating Terraform's execution model?
