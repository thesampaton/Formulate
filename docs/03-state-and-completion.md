# Part 3 Reference — State and Completion

[Back to the mental model](03-mental-model.md). This reference develops completion, navigation, and recovery for later API design. Names and indicators are illustrative.

**Completion means the currently applicable requirements are satisfied against current inputs.** It can change in either direction. Visiting, editing, saving, and submitting describe other facts.

## Shared values, scoped state

React Hook Form is the default value authority; Formulate coordinates requirements, navigation, and actions. Sections and pages expose summaries over that shared state. A form with direct fields needs only field and form state.

| Scope | State and completion responsibilities |
| --- | --- |
| **Field** | Value, touched/dirty state, dependencies, and validation results. Complete when this use's applicable requirements pass. |
| **Section** | Member summaries and its own cross-field or collection rules. Complete when applicable member and group requirements pass. |
| **Page** | Visit history, assigned requirements, and page-specific conditions such as acknowledging a summary. Complete when those requirements pass. |
| **Form** | Shared values and baselines, navigation, draft recovery, attempts, and all applicable requirements, including required page conditions. |

A requirement counts once even when several views reference it. Reviewing a field does not create another value or validation rule. By default, presenting a whole section includes its requirements; presenting selected editable fields includes theirs. A cross-page section rule remains in section/form completion, with an explicit page or action assignment when it should also gate navigation.

Account and Region can belong to one DeploymentTarget section but appear on separate pages. Account's page can finish while Region, the section, and the form remain incomplete. Every page's local checks can also pass while a form-wide rule fails; that failure needs a reason and correction destination.

## Completion indicators

| Indication | Meaning |
| --- | --- |
| **Not applicable** | This scope is explicitly inapplicable. Omit it from required progress or show it as skipped. |
| **Incomplete** | A requirement is missing, failed, stale, or not yet checked. |
| **Checking** | No known unmet requirement blocks completion, but a required check is pending. |
| **Complete** | All applicable requirements pass against current inputs. |

A known failure stays visible while another check runs. Error-display timing is separate: an untouched required field can be incomplete without immediately showing an error. Background suggestions need not block completion; required checks do. Old responses cannot establish completion after their inputs change.

Optional empty values and valid prefills can complete without interaction when their contracts allow it. An active scope with no obligations is complete; an explicitly inactive scope is not applicable. An informational Review page adds no required work. If review matters, declare acknowledgement of the current summary rather than infer it from arrival.

Action availability may also depend on permissions, navigation policy, or a request already in progress. An action guard affects completion only when declared as a requirement of that scope.

## Other state and save baselines

| Question | State |
| --- | --- |
| Has the user interacted or visited? | Field touched state / page visit history. |
| Where are they, and where can they go? | Current page / available destinations. |
| Have values changed? | Dirty comparison against the chosen baseline. |
| Are requirements satisfied? | Current validation results / completion. |
| Is work pending? | Required checks, background activity, and attempts distinguished. |
| Has the application accepted these values? | Acknowledged save/submission snapshot. |

A tab can show **Complete · Unsaved**. A draft can be saved while incomplete. A successful scoped save advances the baseline only for acknowledged values; unrelated or newer edits stay unsaved. Submission feedback belongs to its attempt and must be reconciled with subsequent edits.

## Pages, routes, and tabs

```text
form DeploymentRequest
  target = use DeploymentTarget at target

  pages:
    Account: present target.account
    Region: present target.region
    Review:
      review target
      require acknowledgement of the current target summary

  workflow: continue when current page is complete
  presentation: routes or tabs
```

The router supplies a requested location; navigation rules determine the allowed logical destination. Back, direct URLs, tab clicks, and Next must respect the same policy for this workflow. Free navigation is also possible without declaring incomplete pages complete. When a branch makes the current page unavailable, choose a deterministic available destination and apply the declared value-retention policy.

Unmounting page UI preserves values, dependencies, errors, and requirements. Destroying the runtime through full navigation or reload requires draft persistence to restore that work. Restoration re-evaluates requirements and navigation; stored completion is not evidence that current checks pass.

## Worked completion sequence

Assume account validation is immediate, region membership needs a check, and review acknowledgement is tied to the current target summary.

| Change | Account page | Region page | Target section | Review page | Form |
| --- | --- | --- | --- | --- | --- |
| Required values empty. | Incomplete | Incomplete | Incomplete | Incomplete | Incomplete |
| Choose a valid account. | Complete | Incomplete | Incomplete | Incomplete | Incomplete |
| Select region; check pending. | Complete | Checking | Checking | Incomplete | Incomplete |
| Region check passes. | Complete | Complete | Complete | Incomplete | Incomplete |
| Acknowledge summary. | Complete | Complete | Complete | Complete | Complete |
| Change account; recheck retained region. | Complete | Checking | Checking | Incomplete | Incomplete |

If the retained region is already known invalid, show Incomplete while options load. Changing route paths or tab labels leaves completion unchanged; revisiting Review does not acknowledge a changed summary.

Progress must name its unit: “2 of 3 required pages complete” counts page obligations, not unique fields or form-wide validity. Inapplicable work leaves the denominator, repeated items enter by stable identity, and progress can decrease. Informational pages do not inflate completed required work.

The [scenario rubric](03-scenarios/README.md) and [pressure tests](03-mental-model-pressure-tests.md) supply acceptance cases for validation freshness, partial saves, and recovery.
