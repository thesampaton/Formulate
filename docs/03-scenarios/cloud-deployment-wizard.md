# Cloud deployment wizard

[Scenario rubric](README.md) · [Mental model](../03-mental-model.md)

This traces a library field built from primitives through two independent section uses, pages, and submission.

**Status: gate 2 demonstrated by the [cloud form](../../examples/react/src/compositions/cloud-deployment.tsx) and [three executable sequences](../../tests/cloud-deployment.test.tsx).** [Evidence and decisions](../05-06-rendering-and-workflow.md#gates-23-evidence-and-contract-decisions) distinguish the local coordinator from a future public API. The prototype binds primary/recovery directly at those roots and uses a production change-reference field; the richer pseudocode below remains illustrative.

The [authoring correction](../05-06-rendering-and-workflow.md#authoring-correction-consolidate-the-demonstrated-mechanics) keeps this same sequence and shares the dependent-choice integration with Infrastructure. Form checks a live evidence revision at action boundaries; hosts no longer repeat schema parsing. Behaviour is demonstrated, while reusable dependency authoring remains provisional.

```text
library field AWSRegion
  value: RegionId
  render: Select + Label + HelpText + ErrorText
  input: accountId
  service: listRegions(accountId)
  validate: selected region is available for the supplied account
  on accountId change: retain selection as unverified; refresh options
  accept result only for current use, account, and request generation
  require current membership success; pending or failed lookup cannot pass

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
    if current Production becomes unavailable: go to Targets
    reject unavailable entry/correction targets; fall back to Targets

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

## Gate 2: branching with dependent async choices

Use controllable application service promises to make response order deterministic. Keep a single form runtime alive while pages unmount. Environment is an earlier answer owned by Targets; expose an explicit way to change that same bound answer while on Production, such as a host summary control. This must actually remove the current page, rather than merely hide an unvisited tab. Do not create a second Environment value.

| Step | Interaction | Required observation |
| --- | --- | --- |
| 1 | Select production, account A and a valid region A1 for primary; give recovery independent valid values. Visit Production and fill its requirements. | Continue and Review use current applicable requirements. Both target uses have independent state. |
| 2 | Return to Targets; change primary Account to B, then C while B's Regions request is pending. | Retain A1 as unverified. Primary membership no longer passes; Continue/Deploy cannot rely on A's result. Recovery is unaffected. |
| 3 | Resolve C first without A1, then resolve B with A1. | Only C's choices apply. A1 remains stored with an actionable membership failure; B cannot replace choices, errors, or readiness. Choosing a valid C region restores that requirement. |
| 4 | Visit Production with valid targets. Change the earlier Environment answer to development while Production is current. | Production becomes unavailable and navigation falls back to Targets. Retain its editing values, omit its requirements and payload, and cancel pending navigation/focus intents aimed at that page. Explain the move and focus the still-visible Environment control; do not compete with the picker's focus restoration or focus an absent editor. |
| 5 | Change primary Account again and start a Regions request. Turn production back on and revisit Production with retained values while that lookup is pending. | Retained values survive. Applicable requirements are evaluated again against current inputs; prior success cannot certify the target or final submission. Page availability alone does not claim readiness. |
| 6 | Fail the current lookup, retry, and return a current successful response. | Failure has feedback and retry; it is not an empty successful choice list. Required membership remains unsatisfied until current data verifies the selection, or the user corrects it. Retry cannot let an earlier response overwrite the new result. |
| 7 | Review and submit once current applicable requirements pass; repeat with production disabled. | Review and exact payload agree. Disabled production values are absent; enabled values are freshly validated. No stale check may invoke the handler or redirect correction. |

Also resolve an old success and an old failure after a newer request, and repeat A → B → A: account equality alone cannot identify the current request. Associate evidence with the field use, relevant input snapshot, and request generation/lifetime. Cancellation may save work, but correctness must hold when the service cannot abort. Page unmounting does not end an applicable field use; actual removal or runtime destruction does.

Continue uses the page's applicable requirements; final submission uses all applicable requirements. A required unresolved/pending membership check cannot pass either scope that includes it. An unrelated suggestion request need not block. Preserve known validation failures while another check is pending. This gate must test guards and the application handler, not just spinner text or button disabling.

The host's fallback for this example is Targets. Back, navigation links, and correction requests must all reject an unavailable Production destination; they must not reactivate the branch to reveal an inactive error. On return, old focus requests stay cancelled. Normal layout changes and lookup completion must not steal focus. A retained production value that now fails an applicable rule must expose a reachable correction.

Record which wiring belongs to DeploymentTarget, which policies belong to the host, and which repeated freshness/navigation mechanics justify Formulate support. Keep option fetching application-supplied and values in RHF. This gate does not require a generic graph language, route adapter, agent runtime, or deployment service. The broader changes and agent context in this scenario remain later pressure tests.

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
