# Cloud deployment wizard

[Scenario rubric](README.md) · [Mental model](../03-mental-model.md)

This is the fullest trace through the model: a reusable region field built from UI primitives, used inside a reusable section, with two independent section instances in one form. The sketch deliberately leaves services and deployment execution in the application.

```text
library field AWSRegion
  value: RegionId
  render: Select + Label + HelpText + ErrorText
  input: accountId
  service: listRegions(accountId)
  validate: selected region is available for the supplied account
  on accountId change: recheck selection; refresh options

library section DeploymentTarget
  services: listAccounts, listRegions
  account = use AccountPicker at accountId
    listAccounts <- section.listAccounts
  region = use AWSRegion at regionId
    accountId <- account.value
    listRegions <- section.listRegions
  require: account, region

form CloudDeployment
  environment = use Environment at environment
  primary = use DeploymentTarget at targets.primary
    listAccounts <- application.listAccounts
    listRegions <- application.listRegions
  recovery = use DeploymentTarget at targets.recovery
    listAccounts <- application.listAccounts
    listRegions <- application.listRegions

  production = use ProductionConfiguration at production
    when environment.value == "production"
    inactive: retain values; skip their requirements; exclude from payload

  pages:
    Targets: present environment, primary, recovery
    Production: present production; available when production applies
    Review: review environment, primary, recovery, production

  presentation: routed pages (/targets, /production, /review)
    alternative: tabs using the same page identities
  workflow: Targets -> Production when applicable -> Review

  submit Deploy:
    validate: all applicable requirements
    payload: applicable values
    handler: application.requestDeployment
```

`AWSRegion` is the library field; `primary.region` and `recovery.region` identify its separate uses within the two section instances. Their bindings are `targets.primary.regionId` and `targets.recovery.regionId`. The section connects each region to its own account. No copy of that dependency is written in the form.

`ProductionConfiguration` stands for another reusable section with its own fields and rules. Its applicability determines which production requirements matter. Page availability governs navigation separately. `Targets`, `Production`, and `Review` are logical identities independent of routes, tab labels, or presentation order; a wizard step is a page presented in sequence.

Review reads the same instances and indicates which data will be included. It creates no field instances and does not duplicate their requirements or counts; merely opening it proves no acknowledgement. If acknowledgement is required, declare it as a Review requirement. Acceptance of `Deploy` means the application accepted the request; its services still own deployment execution.

**Completion and state:** field checks feed section, page, and form completion from current applicable requirements. A page checks its assigned members and local requirements; if account and region occupy different pages, completing account's page need not complete their section or the form. Values, errors, and pending checks remain in the form across navigation; visited, touched, saved, and submitted state are separate signals.

| Change to apply | Required outcome |
| --- | --- |
| Change primary account twice while region lookups are pending. | Only primary region is rechecked. Results must match its current account before they can affect options or validity. Recovery state is unchanged. |
| Switch to development, then back to production. | Retained production values are excluded and do not block development submission. Returning rechecks those values and earlier completion. |
| Put account and region on separate pages; replace the region picker; add an agent consumer. | The bindings and account dependency survive. Default React, custom React, and the agent receive the same requirements and available actions. |
| Switch from routes to tabs, unmount Targets, then change a dependency. | Page identities and field state survive. Recheck affected section, page, and form completion, including off-screen content. A full document reload requires a persisted draft and re-evaluation; a visited marker proves nothing about current completion. |
| Receive a server rejection or request for more input after editing the draft. | Reconcile the response with its submitted snapshot, preserve useful edits, and expose the next permitted action through the shared interaction contract. |

**Question for later API design:** what is the smallest readable contract that exposes current requirements and available actions to both custom React and an agent without requiring either to reimplement the rules?
