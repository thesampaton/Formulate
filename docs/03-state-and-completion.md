# Part 3 — State and Completion

The [mental model](03-mental-model.md) gives fields, sections, pages, and the form a useful scope. Each scope needs a readable state view so a field can show an error, a section can show unfinished work, and a page tab can show completion. Those views share one set of values and requirements.

Sections and pages are optional. With direct fields, only field and form state are needed: no synthetic page adds identity, visit history, navigation, or completion obligations. Adding an optional scope adds a summary over existing requirements; it does not supply missing validation machinery.

The state model is the same for fields configured inline and fields created from library definitions. Reuse changes how a field is authored, not where its values live or how its requirements contribute to completion.

The [references and relationships model](03-references-and-relationships.md) connects conditions to these current values and states. Those connections belong to the logical composition and persist independently of where its controls are presented.

The [layout model](03-layout-and-presentation.md) exposes those states through styling hooks while keeping them read-only projections. Rearranging presentations or adding CSS wrappers changes neither their requirement scope nor their completion.

**Completion means the currently applicable requirements for that scope are satisfied against current inputs.** It can change in either direction. Visiting, editing, saving, and submitting describe other facts.

This document proposes semantics for the scenario rubric. Property names and badge labels are illustrative; the runtime API remains to be designed.

## One value set, state at each layer

| Layer | State specific to this layer | State derived from its scope |
| --- | --- | --- |
| **Field instance** | Current value, touched state, change baseline, and the results of its validation and dependencies. | Whether this use applies, has unsaved changes, has errors or required checks pending, and is complete. |
| **Section instance** | Its own cross-field requirements and their results. Repeated sections also have stable item membership. | Relevant member values by reference, dirty and error summaries, pending requirements, and completion of its applicable members plus section rules. |
| **Page instance** | Stable page identity, visit history, page-specific requirements such as reviewing the current summary, and their results. | State of the fields and requirements assigned to this page. The current page and permitted destinations come from form navigation. |
| **Form** | The shared value set and baseline, form-wide requirements, navigation coordination, draft recovery, and action/attempt state. | Dirty, error, pending, and completion summaries across all applicable form requirements, including fields outside named pages. |

React Hook Form is the default authority for field values and its field-state facilities. Formulate coordinates requirements, their results, navigation, and scoped summaries through that integration. A section or page does not keep another editable copy of its values. Application services remain authoritative for persistence, permissions, and business execution.

Likewise, a page's count of invalid fields is a view over the relevant field states, not an independently editable counter. A page can also fail its own requirement even when every displayed field is valid. Summaries need to include those reasons, not just descendant field errors.

## Completion has a scope

| Scope | What must be satisfied |
| --- | --- |
| **Field** | Its applicable presence and value rules, including contextual constraints and checks required for completion. |
| **Section** | Its applicable member requirements and its own cross-field or collection rules. |
| **Page** | The requirements assigned to the page, including page-specific conditions. By default, presenting an entire section includes its applicable requirements; presenting selected editable fields includes those fields' requirements. |
| **Form** | Every applicable field, section, and form rule, plus required page conditions. Each underlying requirement is included once regardless of how many views refer to it. |

These are scoped rollups, not a blind walk of the visual tree. A section may span pages. Reviewing a field displays an existing instance and does not create another field or another validation rule.

A cross-page section rule still belongs to section and form completion. The definition must identify which page or action should gate on that rule if it is also a navigation requirement. It must never disappear merely because the section's fields are presented separately. A failure needs an understandable correction destination, even when its owner is a section spanning pages.

For example, Account and Region belong to one DeploymentTarget section. Put Account on one page and Region on the next. The Account page can be complete while Region, the section, and the form are incomplete. The Region page checks the region-against-account requirement. Final submission checks the complete target. Referencing that section from Review does not make Account wait for Region before the user can continue.

## What a completion indicator means

Use a small, explainable completion result at every layer:

| Indication | Meaning |
| --- | --- |
| **Not applicable** | The scope is explicitly inapplicable under the current conditions. Show it as skipped or omit it from applicable progress; do not claim the work was completed. |
| **Incomplete** | A current requirement is missing, failed, stale, or has not yet been checked. Expose the reason. |
| **Checking** | No known unmet requirement blocks completion, but at least one check required for completion is still pending. |
| **Complete** | Every applicable requirement in the scope is satisfied using current values and dependency results. |

A known failure remains available while another check runs; “Checking” must not conceal it. Error display timing remains a separate presentation policy: an untouched required field can be Incomplete without immediately displaying an error. A stale result cannot establish completion, and an old successful response cannot restore completion after its inputs change.

Only required work affects this result. A background suggestions lookup does not block an otherwise complete field unless its result is needed to establish a declared requirement. An optional empty field can be complete when its contract accepts absence. A required empty field is incomplete. A prefilled field can be complete once the applicable checks pass without being touched or visited.

No observed errors is insufficient evidence: required validation may not have run. Conversely, an active scope with no applicable obligations is Complete; that differs from an explicitly inapplicable scope. An informational Review page can therefore be complete without a visit and adds no required work to a progress count. If reviewing is a requirement, declare an explicit acknowledgement of the current summary. Page arrival alone is not that acknowledgement.

Completion says that the declared work is satisfied. Whether an action is available can additionally depend on permissions, navigation policy, or an attempt already in progress. A complete form can have a disabled Submit action while a request is being sent.

An action-specific guard is not automatically a completion requirement. For example, settings may be complete but need to be saved in a particular order. If a guard should also determine page or form completion, include it explicitly in that scope, as with the Terraform example's matching-plan requirement.

## Keep the other state visible

| Question | State to use |
| --- | --- |
| Has the person interacted with this field or opened this page? | Field touched state or page visit history. |
| Where are they now, and where can they go? | Current logical page and navigation availability. |
| Are the relevant values different from the chosen baseline? | Dirty state, scoped to those values. |
| Are the current requirements satisfied? | Validation results and completion. |
| Is more information being checked? | Pending work, distinguishing required checks from background activity. |
| Has the application accepted these values? | The acknowledged snapshot for the relevant save or submission attempt. |

For example, a tab can show **Complete · Unsaved**, or **Needs attention** even though the page was previously visited and saved. A form may be saved as a draft while incomplete. A previously submitted form may contain newer edits which have not been submitted.

Dirty state compares values with a declared baseline. Initially that may be loaded values. A successful scoped save can advance the baseline for the acknowledged values; it does not mark unrelated edits, or newer edits made during that save, as saved. Exact persistence adapters belong to later design, but these distinctions must survive them.

## Pages survive presentation and navigation changes

The same page identities can be mapped to routes, tab keys, or wizard panels:

```text
form DeploymentRequest
  target = use DeploymentTarget at target

  pages:
    Account: present target.account
    Region: present target.region
    Review:
      review target
      require acknowledgement of the current target summary

  workflow: sequential navigation, continuing when current page is complete

  presentation, choose one:
    routes: Account -> /request/account
            Region  -> /request/region
            Review  -> /request/review
    tabs:   Account, Region, Review
```

Switching that presentation changes neither bindings nor requirement scopes. The example keeps the same navigation policy in both presentations, so a tab click cannot bypass a guard applied to the matching route. An application may deliberately choose free navigation instead; visiting an incomplete page is then allowed without declaring its requirements complete.

Back, forward, a direct URL, a clicked tab, and a Next action all resolve to a logical page and are reconciled with the same navigation policy. The router supplies the requested location; Formulate supplies the allowed logical destination; the application integration keeps them aligned. A changed branch must resolve a current page that is no longer available to a deterministic available destination, preserving values according to the declared retention policy.

Unmounting page UI must preserve applicable values, errors, dependencies, and completion in the shared form interaction. Off-screen requirements still count. A true document reload or navigation that destroys the form runtime requires draft persistence and restoration; an in-memory store alone cannot preserve it. Restoration re-evaluates requirements and navigation before presenting stored completion as current.

## A completion sequence to pressure-test

Using the Account, Region, and Review pages above, assume valid account selection is immediate and region membership needs a check. The explicit Review acknowledgement is tied to the relevant values and requirements, so a material change revokes it.

| Change | Account page | Region page | Target section | Review page | Form |
| --- | --- | --- | --- | --- | --- |
| Start with required values empty. | Incomplete | Incomplete | Incomplete | Incomplete | Incomplete |
| Choose a valid account. | Complete | Incomplete | Incomplete | Incomplete | Incomplete |
| Select a region; its required check is pending. | Complete | Checking | Checking | Incomplete | Incomplete |
| Region check passes. | Complete | Complete | Complete | Incomplete | Incomplete |
| Acknowledge the current summary. | Complete | Complete | Complete | Complete | Complete |
| Change account; retained region must be checked again. | Complete | Checking | Checking | Incomplete | Incomplete |

If the retained region is already known to be invalid for the new account, its indication is Incomplete while replacement options load. If the user changes only route paths or tab labels, completion is unchanged. Navigating away and back does not acknowledge the new summary.

Progress counts must name what they count: “2 of 3 required pages complete” describes page obligations, not a count of unique fields or proof that form-wide rules pass. Count each field once in a field summary. Inapplicable branches leave the relevant denominator, repeated items enter or leave by stable identity, and progress can decrease when requirements change. An optional informational page should not inflate a claim about completed required work.

The [pressure tests](03-mental-model-pressure-tests.md) and [scenario sketches](03-scenarios/README.md) apply these semantics. Later prototypes must demonstrate the same state and transitions through both tabs and routes, including out-of-order checks, partial saves, and draft restoration.
