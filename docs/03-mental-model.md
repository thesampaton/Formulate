# Part 3 — Mental Model

**Start with a form and its fields. Add sections, pages, and reuse when they serve the experience.**

This model follows the [product vision](01-product-vision.md) and [design principles](02-design-principles.md). The examples illustrate the intended composition; API syntax remains open.

## The minimum is Form → Fields

```text
form Contact submit application.saveContact
  field name
    control: Input
    label: Name
    rules: required
  field email
    control: Input
    label: Email
    rules: required, valid email
  action submit
```

Each field is declared once, with one value key. Normal integration supplies binding, validation, errors, and form completion. Fields can be configured ad hoc using familiar control props; a library definition is optional. The [simple-form rubric](03-scenarios/simple-form.md) tests this baseline and the cost of growing or simplifying it.

## The parts and their relationships

| Part | What it means |
| --- | --- |
| **UI primitive** | A shadcn or HTML building block such as Input, Select, or Checkbox. It supplies the control's appearance and interaction. |
| **Field instance** | One configured field in a form, with an identity, value binding, validation, and dependencies. It connects a control to form behaviour. |
| **Library field — optional** | A reusable field definition packaging a control, value contract, rules, and defaults. Each use creates its own field instance. |
| **Section — optional** | Related fields composed as a named group, with shared rules, dependencies, layout, or completion. Sections can nest or repeat. |
| **Page — optional** | A named part of the experience with content, navigation, and a completion scope. It can appear as a route, tab, or wizard step. |
| **Form** | The shared boundary for values, requirements, state, and actions across the whole interaction. |

A form contains fields, optionally grouped into sections. Pages organise how that content is visited. Either construct works without the other: a page can show direct fields, and a section can appear in an unpaginated form. A section can also span pages while keeping its internal relationships. A review page shows existing values.

For example, a library `CostCentre` field packages its picker and validation. Requesting and billing each use a separate instance, with independent values and errors. A field can contain several controls under one value contract, such as a DateRange; a section groups independently bound fields.

Sections and pages can also be extracted for reuse with their defaults and rules. Ordinary React component extraction remains available; use a semantic section when the group itself needs meaning, rules, or state.

## Connections survive presentation changes

**Bindings determine data shape; presentation determines where fields appear.** Moving a field into a section, another page, or a CSS row—or showing it again in Review—preserves its identity, value, and relationships. Grouping creates an object or array in the data only when explicitly bound that way.

A condition can refer directly to a field available in the section, page, or form where it is composed:

```text
field showAdvanced: Checkbox, initially false
field retries: Input, numeric
  visible when showAdvanced.value
```

Here the condition reacts to the current checkbox value. A reusable piece refers to its own fields; its caller connects any outside inputs. Reusing it twice gives each use independent local references. [References and relationships](03-references-and-relationships.md) develops this boundary.

Visibility controls presentation. Changing whether answers apply, remain required, or enter submission is a separate policy. The [advanced-options example](03-scenarios/advanced-options.md) shows the distinction.

## State belongs to the running form

Fields, sections, pages, and the form expose views of shared state. Page UI can unmount while its values and requirements remain available.

**Complete means the current applicable requirements are satisfied.** A field checks its own requirements; a section includes its members and group rules; a page checks its assigned requirements; the form checks the whole interaction. Completion can change when an earlier answer changes. Visited, dirty, saved, and submitted describe other facts.

A page showing Account can be complete while Region on the next page, their shared section, and the form remain incomplete. The [state and completion reference](03-state-and-completion.md) covers these scopes and indicators.

## People and agents share the interaction

The composition should be readable for people and AI building forms. The running form should also expose structured context for filling them: field purpose, value contracts, current values and choices, dependencies, requirements, errors, completion, and permitted actions. Stable references connect this context to the same fields across presentations. It derives from the existing composition and current state, within application permissions. Human and agent edits follow the same validation and action rules, allowing either to continue from the other's work. The [design notes](design-notes.md#testing-the-ai-composition-hypothesis) develop the mechanism.

## Layout and workflow describe how the form is used

Layout uses ordered content and ordinary CSS on a form, page, section, or plain wrapper. Container layout and child placement stay distinct from the primitive's supported props. Meaningful rendered order supplies normal reading and tab order; focus requests use field references. See [layout and presentation](03-layout-and-presentation.md).

**Workflow** describes navigation, conditions, and actions. A wizard step is a page's position in that workflow. **Submission** validates the relevant requirements and passes included values to an application handler, with custom mapping when needed. The application owns persistence and business execution.

## Applying the model

The [seven hero scenarios](03-scenarios/README.md) test reuse, dependencies, pages, and submission in context. The [pressure tests](03-mental-model-pressure-tests.md) hold the edge cases for later API prototypes. These references support the model; they are not prerequisites for defining a form.
