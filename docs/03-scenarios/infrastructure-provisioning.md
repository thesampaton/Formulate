# Infrastructure provisioning (Terraform)

[Scenario rubric](README.md) · [Mental model](../03-mental-model.md)

The distinctive challenge here is repeating resource compositions and reviewing an application-generated plan. A plan is evidence about a particular configuration. Changing that configuration must invalidate the relationship between the old plan and permission to provision.

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
    payload: accountId, region, resources snapshot + matching application plan reference
    handler: application.requestProvisioning
```

Every repeated Resource use has its own name and size fields. `at resources` deliberately places them in an array. The stable item identity keeps an individual resource recognisable when its current array position changes. The collection-level uniqueness rule belongs to the form, which can see all items.

`PreviewPlan` is an application handoff with a declared validation scope. Its result is application-owned information displayed on the Review page, not another editable field. Formulate coordinates whether the matching-plan requirement is satisfied; the application verifies the reference and authorises execution. Any retained plan content or reference does not become a second authority for infrastructure state.

The application must identify every configuration input a plan covers, including the connected account even though it is not an editable field. Matching only region and resources could accept an old plan after the account changes. Naming a Review page cannot create this contract or prove human acknowledgement; acknowledgement, if needed, is another explicit requirement.

**Completion and state:** field checks feed Resource section and Configure page completion. Review reads existing instances without counting them again and has its own matching-plan requirement. The form cannot be complete while that applicable requirement is unmet, even if every input is valid. Visited pages, saved drafts, and accepted provisioning requests are separate state. Pages share the form's values and field state; their identities do not depend on routes or tab labels.

| Change to apply | Required outcome |
| --- | --- |
| Reorder, delete, or add a resource while machine-size lookups are pending. | Values, errors, and lookups follow stable surviving item identities. A response for a removed item cannot update the new item at its former index. |
| Change account, region, or a resource after previewing the plan. | Recheck dependent selections and mark the old plan insufficient for the current request, even if region and resources happen to be unchanged after an account switch. A late result for the earlier snapshot cannot enable Provision. |
| Split configuration into two pages, or receive a provisioning rejection. | Field identities and payload shape survive the split. A page checks its assigned members and requirements while the whole Resource section or form may remain incomplete. Rejection preserves useful work and identifies affected requirements. Terraform state, approval, and apply remain application responsibilities. |
| Unmount Configure, then change the connected account while Review is open. | Preserve draft values and field state, recheck dependencies, and recompute section, page, and form completion. A full document reload requires draft recovery and plan re-evaluation; previously complete pages do not certify a current plan. |

**Question for later API design:** how should an application expose a result's configuration reference so readiness checks can reject stale plans without Formulate duplicating Terraform's execution state machine?
