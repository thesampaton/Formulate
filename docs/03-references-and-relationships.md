# Part 3 Reference — References and Relationships

[Back to the mental model](03-mental-model.md). This reference develops local connections and reuse boundaries; the handle and subscription API remains open.

**A condition refers to a particular field and reacts to its current value, wherever that field is presented.**

## Local references and reuse

```text
form RequestSettings
  field showAdvanced
    control: Checkbox
    initial: false
  field retries
    control: Input, numeric
    initial: 3
    visible when showAdvanced.value
```

`showAdvanced` identifies the checkbox declared here; `.value` in the condition is a live dependency. One field key supplies identity and binding in this simple case. The same local-reference approach works within section, page, or form authoring. It needs no separate reference declaration or lookup from the form root.

| Boundary | Connection |
| --- | --- |
| **Inline composition** | Use a reference available where the relationship is authored. |
| **Reusable piece** | Refer to its own members or declared inputs. Each use resolves members independently. |
| **Between reusable pieces** | The containing composition connects exposed fields/values to inputs. |
| **Outside the form** | The application supplies an explicit input or service. |

Extracting the entire interaction keeps its wiring together. Extracting only the advanced controls exposes the outside dependency:

```text
library section AdvancedOptions
  input: expanded (Boolean)
  visible when expanded
  ... fields ...

caller:
  advanced = use AdvancedOptions at configuration
    expanded <- showAdvanced.value
```

The arrow expresses a live connection. The reusable definition does not guess the caller's path. Two uses have independent fields; a shared controller must be connected intentionally. Ordinary component extraction remains possible without introducing a semantic Section.

## Identity, binding, and presentation

| Concept | Meaning |
| --- | --- |
| **Reference** | Which field instance a rule reads. |
| **Value read** | Which input it observes, such as `showAdvanced.value`. |
| **Binding** | Where that field's value belongs in form data. |
| **Presentation** | Where a control or review view shows it. |

Moving a presentation preserves the resolved reference and binding. Labels, routes, DOM ancestry, and library names cannot distinguish instances reliably. Reading `range.value.end` observes part of one field's value; it creates no extra writable field.

A library definition packages the contract and defaults; each use has its own identity and state. Repeated items need stable identities through reordering. Removing an item ends that use: references and late responses must never attach to the item now at its old array index. Remounting a control, by contrast, preserves the logical use.

Duplicate identities and competing writable bindings need useful errors, including a DateRange at `period` competing with a separate field at `period.end`. A section's object binding routes its children's bindings rather than creating a competing value owner.

## Name the effect

| Intent | Illustrative relationship | Consequence |
| --- | --- | --- |
| Disclose controls | `advanced visible when showAdvanced.value` | Changes presentation; values and requirements remain. |
| Enable a branch | `advanced applies when enableAdvanced.value` | Changes applicability, with declared retention and payload policies. |
| Require an answer | `reason required when exception.value` | Changes the presence requirement. |
| Supply options | `region.accountId <- account.value` | Rechecks options and selection when account changes. |
| Validate related values | `end must be after start.value` | Checks values without writing them. |
| Compute a value | `total derived from lines` | Explicitly declares a result and its inputs. |

The [advanced-options example](03-scenarios/advanced-options.md) distinguishes disclosure from enablement. A hidden applicable field can still fail validation. Its controller must remain reachable, and correction needs a way to reveal and focus the field; arbitrary conditions cannot generally be inverted automatically.

## Changes and unresolved inputs

Changes re-evaluate affected relationships and feed [completion](03-state-and-completion.md), including when controls are unmounted. Distinguish:

- **Empty value:** follow the field's contract and defaults.
- **Unresolved required dependency:** expose it as unresolved; do not silently treat it as false or complete. A nonexistent declared target is a configuration error; optional inputs need an absence policy.
- **Inapplicable source with retained value:** the value remains readable. A rule meaning “the active answer is yes” checks both applicability and value, such as `choice.applicable and choice.value`.

Validate compatible connections and diagnose unsupported feedback. Two validators reading each other's stored values are not inherently a feedback loop. A computed result changing its own source, or a rule depending on its own completion, needs a supported policy or useful error. Scheduling belongs in Part 6.

A public reference needs observable values/state as well as stable identity. React `useRef` might hold a handle, but mutating `ref.current` alone does not trigger rendering. [React useRef](https://react.dev/reference/react/useRef#caveats). Later design must connect typed authoring handles and portable identity references to the same semantics.
