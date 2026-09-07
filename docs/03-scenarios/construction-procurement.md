# Construction procurement

[Scenario rubric](README.md)

A site manager requests materials, reviews estimated costs, and submits for purchasing. The application owns catalogue access, authoritative prices, approvals, and purchase orders. This tests repeated sections, structured field values, and responses arriving after edits.

The notation is illustrative pseudocode, not a published API. `Money` exposes one object-valued field contract using amount and currency controls. `LineItem` exposes separate material, quantity, and unit-budget fields: each has its own binding and can be presented independently. Application estimates are review information.

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
    label: "Maximum unit budget"
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

The estimate is advisory information, not a guarantee that purchasing will accept that price. For this example, an unavailable estimate permits submission: preserve the inputs, mark the estimate unavailable, and offer a retry. Estimates are excluded from the payload. Request line IDs must let the application identify submitted lines; UI array indexes cannot supply that contract. Totals must retain currency meaning; amounts in different currencies cannot silently be added together.

Review reads existing line instances without duplicating field instances or their requirement counts. Visiting it does not prove acknowledgement; declare a requirement if needed. Moving quantity beside unit budget creates no new field. Reusing `LineItem` carries its internal estimate dependency; the caller supplies services and project input. Request and Review are logical pages whose identities survive route or tab-label changes.

**Completion and state:** each field reports current checks; each line section, page, and the form derives completion from applicable members and requirements. Page checks cover its assigned members and local requirements. An unavailable advisory estimate does not make valid inputs incomplete in this example. Touched, visited, saved, and submitted state remain separate from completion. Form values and field state survive page navigation and unmounting.

| Change to pressure-test | Required outcome |
| --- | --- |
| Reorder or delete lines while estimates are pending. | Values and errors follow stable item identities. Removed-item results are discarded; surviving results never follow an obsolete array index. |
| Change project or quantity before a lookup completes. | Previous estimates are stale. Only a response matching the current item and inputs can become current; errors from superseded requests cannot replace current status. |
| Receive a price or availability rejection after submission and further editing. | Associate it with the submitted snapshot and stable line identity. Preserve newer edits and require reconciliation; do not attach an old rejection to whichever line now occupies that index. |
| Visit Review, navigate back to edit quantity, then return with Request unmounted. | Preserve field state and recompute affected line, page, and form completion; pending advisory estimates remain a separate signal. A full document reload restores a persisted draft and re-evaluates requirements and estimates rather than trusting earlier completion. |

**Open design question:** What response contract should the application use to identify the submitted line, relevant input revision, and affected fields so that stale lookup results and submission errors can be reconciled consistently?
