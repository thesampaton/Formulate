# Cloud deployment wizard

[Scenario rubric](README.md) · [Mental model](../03-mental-model.md)

This traces a library field built from primitives through two independent section uses, pages, and submission.

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

`AWSRegion` is the definition; `primary.region` and `recovery.region` are separate uses bound at `targets.primary.regionId` and `targets.recovery.regionId`. Each section connects its region to its own account.

Production applicability controls requirements and inclusion. Production page availability separately controls navigation. Review reads those instances and shows what will be submitted. Visiting it does not itself satisfy an acknowledgement requirement.

| Change | Required outcome |
| --- | --- |
| Change primary account twice during lookups. | Accept results only for its current account; recovery stays independent. |
| Switch to development and back. | Exclude retained production values while inactive; recheck them when applicable again. |
| Put account and region on separate pages. | Keep their bindings and dependency. One page can complete while the section remains incomplete. |
| Replace the picker or add an agent consumer. | Expose the same requirements and available actions without reimplementing rules. |
| Change routes to tabs and unmount Targets. | Preserve page identities and field state; dependencies still update off-screen completion. |
| Receive a rejection after editing. | Reconcile with the submitted snapshot and preserve useful newer work. |

The application owns deployment execution. Accepting a request does not mean deployment has completed.

## Context for filling the form

An illustrative context view of the existing field and running state:

```text
field reference: primary.region
purpose: region for the primary deployment target
value: empty
depends on: primary.account, currently account A
requirement: choose a region available to account A
choices: current regions from application.listRegions(account A)
completion: incomplete
permitted edit: select a region
```

This reference identifies the same field in a grid, another page, or Review, and stays distinct from `recovery.region`. If a person changes Account after the agent reads this context, recheck its proposed selection against the current account and return updated context. Concurrent edits to Region also require reconciliation.

**Later API question:** What is the smallest shared contract for inspecting current context, proposing edits, and invoking actions across human–agent handoffs?
