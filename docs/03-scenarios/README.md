# Part 3 — Scenario Rubric

Start with [A simple form stays simple](simple-form.md): two inline fields and submit, then add or remove capabilities without a rewrite.

These optional sketches anchor the [mental model](../03-mental-model.md) to the seven hero scenarios named in the original Part 9 exploration. They test relationships, not complete product designs or a proposed API.

| Scenario | Distinctive test |
| --- | --- |
| [Customer onboarding](customer-onboarding.md) | Reuse Address twice with independent values and dependencies. |
| [Infrastructure provisioning (Terraform)](infrastructure-provisioning.md) | Repeat resources and require a plan matching the current configuration. |
| [Employee onboarding](employee-onboarding.md) | Reuse a page while its host chooses the next destination. |
| [SaaS application settings](saas-application-settings.md) | Present pages as tabs with independently scoped saves. |
| [Construction procurement](construction-procurement.md) | Combine structured field values, repeated sections, and application estimates. |
| [Cloud deployment wizard](cloud-deployment-wizard.md) | Trace primitives, library fields, independent uses, pages, and submission. |
| [Dynamic survey/questionnaire](dynamic-survey.md) | Preserve question identity across branches, repeats, and draft recovery. |

Focused examples cover [advanced-option disclosure](advanced-options.md) and [responsive CSS layout](responsive-layout.md).

## Reading the pseudocode

```text
field email                         Inline field: one key supplies binding and identity
account = use AccountPicker at accountId
                                    A library field use with an explicit binding
primary = use Target at targets.primary
                                    A section use with child bindings under this object
accountId <- account.value          Connect a live value dependency
lookup <- application.lookup        Supply an application service
present primary                    Arrange existing instances for editing
review primary                     Read them without creating more fields
```

Inline children already supply presentation order; separate `present` lists are useful only when separating composition from placement. Library extraction is optional; unexpanded library names stand for existing reusable definitions. `at` supplies data binding explicitly; visual grouping creates no automatic object nesting.

Definitions declare external `input`s and `service`s; callers connect them. Local references resolve within each use. `repeat` gives each item stable identity. `visible when` controls disclosure; `when` on a composition denotes applicability. Retention and payload policies shown in an example belong to that example.

Shared mechanics live in [references](../03-references-and-relationships.md), [state and completion](../03-state-and-completion.md), and [layout](../03-layout-and-presentation.md).

## What each sketch must answer

- What is declared, reused, or independently instantiated?
- Where do values live, and what do requirements depend on?
- What can move without changing identity or behaviour?
- What makes content applicable, complete, or eligible for submission?
- What operation remains application-owned?

The model should answer these without new core layers. The API should express them without duplicate rules or declarations. The [pressure tests](../03-mental-model-pressure-tests.md) provide the detailed checks; the simple-form rubric also tests removing structure while preserving behaviour still required.
