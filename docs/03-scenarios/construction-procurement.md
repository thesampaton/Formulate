# Construction procurement

[Scenario rubric](README.md) · [State and completion](../03-state-and-completion.md)

A material request combines repeated line sections and structured field values. Money is one field contract with two controls; a LineItem has independently bound material, quantity, and budget fields.

```text
library field Money
  value: { amount, currency }
  controls: amount input and currency picker
  validation: nonnegative amount; supported currency

library section LineItem
  input: project
  service: searchMaterials, estimatePrice

  material = use MaterialPicker at materialId
    project <- section.project
    search <- section.searchMaterials
  quantity = use Quantity at quantity
    validation: positive quantity
  unitBudget = use Money at unitBudget
    label: Maximum unit budget
  require: material, quantity, unitBudget

  on material.value or quantity.value or section.project changing:
    mark the previous estimate stale
    request section.estimatePrice(section.project, material.value, quantity.value)
    show result only for the same item with unchanged inputs

form MaterialRequest
  project = use ProjectPicker at projectId
  lines = repeat LineItem at lines keyed by stable item identity
    project <- project.value
    searchMaterials <- application.searchMaterials
    estimatePrice <- application.estimatePrice

  page Request
    present project, lines
  page Review
    review project, lines
    show application estimates with their currencies
  workflow: Request -> Review

  submit RequestPurchase:
    validate: project, line requirements, and at least one line
    payload: project ID + material, quantity, unit budget, and request line ID per line
    handler: application.requestPurchase
```

Estimates are advisory application information. In this example, unavailable estimates offer retry but do not block completion or submission; they are excluded from the payload. Mixed-currency amounts cannot silently become one total.

The section packages estimate dependencies; its caller supplies project and services. Review reads existing instances. Submitted line IDs must identify those lines to the application; array positions cannot provide that contract.

| Change | Required outcome |
| --- | --- |
| Reorder or delete lines during estimates. | Responses follow stable surviving identities; removed-item results are discarded. |
| Change project or quantity before a result arrives. | Only matching current inputs can produce a current estimate. Superseded errors cannot replace current status. |
| Receive a price rejection after further editing. | Associate it with the submitted snapshot and line identity, preserve newer edits, and require reconciliation. |
| Edit quantity after Review, then navigate away. | Recompute affected completion; the advisory estimate remains a separate signal even when Request unmounts. |

The application owns catalogue access, authoritative prices, approvals, and purchase orders.

**Later API question:** What response contract identifies the submitted line, input revision, and affected fields for consistent reconciliation?
