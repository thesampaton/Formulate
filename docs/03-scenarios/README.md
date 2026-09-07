# Part 3 — Scenario Rubric

These sketches apply the [mental model](../03-mental-model.md) to the seven hero scenarios named in the original Part 9 exploration prompt. Their details are proposed examples to challenge the composition model. They are deliberately smaller than the eventual Part 9 designs.

**Start with [A simple form stays simple](simple-form.md).** It requires only a form, two inline fields, and submit. Its growth-and-removal rubric is a prerequisite for accepting the more elaborate compositions below.

**The pseudocode expresses relationships, not a proposed API.** It is neither executable TypeScript nor a portable schema. Names, syntax, type inference, and configuration details will be designed later. A sketch can declare fields inline, use library fields, or mix both. Unexpanded library fields stand for reusable definitions where the example benefits from reuse; they are not prerequisites for ordinary inputs.

| Scenario | What it tests most directly |
| --- | --- |
| [Customer onboarding](customer-onboarding.md) | Reuse an Address section twice without sharing values or internal dependencies. |
| [Infrastructure provisioning (Terraform)](infrastructure-provisioning.md) | Repeat resource sections and connect plan review to application-owned execution. |
| [Employee onboarding](employee-onboarding.md) | Reuse a page with its local rules and connect it to a different surrounding workflow. |
| [SaaS application settings](saas-application-settings.md) | Present pages as tabs, preserve their state, and keep completion separate from scoped saves. |
| [Construction procurement](construction-procurement.md) | Combine object-valued fields, repeated sections, and application-owned prices and decisions. |
| [Cloud deployment wizard](cloud-deployment-wizard.md) | Follow a primitive through a library field, two independent section uses, pages, and submission. |
| [Dynamic survey/questionnaire](dynamic-survey.md) | Preserve question identity and explain conditional answers when branches or layouts change. |

Use **Cloud deployment wizard** to examine a larger composition, or **SaaS application settings** for tabbed pages with independent save actions. A form can use fields directly with neither sections nor pages. The [adversarial checks](../03-mental-model-pressure-tests.md) challenge these same relationships across scenarios.

The focused [advanced-options example](advanced-options.md) starts with a checkbox controlling neighbouring fields directly, then tests optional grouping, rearrangement, reuse, and correction. The [references and relationships model](../03-references-and-relationships.md) explains the common mechanics.

The focused [responsive-layout example](responsive-layout.md) shows fields in a CSS grid with container, placement, and control styling kept distinct. The [layout and presentation model](../03-layout-and-presentation.md) covers order, focus, classes, selectors, and primitive boundaries.

## How to read the sketches

```text
name = field at displayName           An ordinary inline field declaration
  control: Input
  placeholder: Enter your name

library field Region                 A reusable field contract
library section Target               Reusable fields and their internal wiring

account = use AccountPicker at accountId
                                     A named field instance bound to a value

primary = use Target at targets.primary
                                     A section use with bindings under this object

accountId <- account.value           Connect a declared input to another field's value
lookup <- application.lookup         Connect an application capability

present primary                      Arrange existing instances for editing
review primary                       Read existing instances without creating fields
```

Inline configuration is a normal path, analogous to supplying props to a React/shadcn control. It needs no prior field registration or library extraction. Both inline declarations and `use` create instances with the same bindings, state, validation, and completion semantics. These words illustrate the distinction without choosing the eventual JSX or configuration API.

The simple-form shorthand `field email` uses one authored value key for its binding and default identity. The longer `alias = field at path` notation is useful when explaining distinct aliases, nested bindings, or references. Ordered inline children already express their presentation: separate declaration and `present` lists are optional, not two required copies of every form. Ordinary submit needs only its handler; explicit payload examples demonstrate custom selection or mapping.

Within a reusable section, `at` paths are relative to that section use's explicit binding. An alias such as `primary` identifies the use; `targets.primary` identifies its data location. They need not match. Merely placing a field in a section or page creates no object nesting. A layout can refer to an existing use instead of instantiating it again.

An `input` or `service` is something a definition requires its caller to connect. A `.value` reference reads the connected field's current answer. `section.name` and `form.name` denote supplied inputs or services of the enclosing composition. `repeat` creates distinct section uses for array items with stable identities. `when` describes applicability where explicitly attached to a composition; a page's availability governs navigation. A wizard step is a page in an ordered workflow, not another wrapper. Routes and tabs present the same logical pages and share their form state. Presentation alone supplies no applicability or completion policy.

Inside a condition or an input connection, `.value` denotes a live dependency, not a value copied once. Local references resolve to a specific declared field in the authoring context; presentation does not control resolution. Use `visible when` for presentation-only disclosure. Bare `when` on a composition continues to denote applicability in these sketches.

Each sketch's validation, retention, inclusion, and response-handling statements are explicit requirements for that example. They do not establish global defaults. Application handlers own persistence, business validation, permissions, and durable execution.

## State across pages

Every field, section, page, and form exposes a view of its current requirements and completion. Pages also have identities and visit state; routes or tab keys map to those identities. The [state and completion model](../03-state-and-completion.md) explains how state rolls up without duplicating values, and why complete, visited, saved, and submitted are separate facts.

The sketches use `form` for the shared interaction and `workflow` for its navigation and action rules. A reusable page may accept an existing section reference or package its own uses. Merely reviewing those uses creates no extra values or completion obligations.

## The rubric

For every sketch, a reader should be able to answer:

1. Which fields are declared directly, what is reused, and which independent instances are created here?
2. Where does each answer live, and which other answers or services does it depend on?
3. What can move or be displayed again without changing those bindings or dependencies?
4. What makes a requirement apply, block an action, or enter its payload?
5. What makes each field, section, page, and the form complete, and what can revoke that completion?
6. Do the same page identities, values, rules, and state survive routes, tabs, and inactive UI?
7. Which operation belongs to the application after the handoff?
8. Which rendered surface does each layout or control prop affect, and how do reading order and focus behave when presentation changes?

The mental model needs revision if a scenario requires new core layers to answer those questions. The eventual API needs revision if expressing these relationships requires duplicated rules, repeated declarations, or manual rewriting of internal paths.

The same applies in reverse: remove unused Pages, Sections, or library extraction without entering a different form mode. Preserve remaining fields and behaviour; deliberately relocate still-needed rules, conditions, policies, and defaults. Measure required concepts and independent edits, not just short syntax.
