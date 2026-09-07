# Part 3 — References and Relationships

**A condition refers to a declared field in this composition and reacts to its current value. Where either part is presented does not change the relationship.**

The [mental model](03-mental-model.md) describes the parts. References explain how those parts connect. This belongs in Part 3 because it determines whether fields, sections, and pages can be rearranged or reused without rebuilding their behaviour. It adds no new hierarchy layer.

## Start with a local reference

The ordinary case should read like using a variable or passing a prop:

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

`showAdvanced` identifies the checkbox declared here. The condition reads its current value and controls the retries field's presentation. It requires no Section, Page, library field, registry entry, or lookup from the form root. The simple field key supplies its binding and identity without a separate alias.

The same idea works wherever the author composes the relationship: within a section, within a page's content, or at the form level. If the author already has a reference to the intended field, the condition uses that reference. Section, page, and form declarations provide useful local names; the exact JSX, helper, or name-resolution API remains open.

The [advanced-options example](03-scenarios/advanced-options.md) starts with direct fields, then pressure-tests adding an optional section or presenting those same fields on different pages.

## A reference identifies a use, not a location

| Concept | Question it answers | Example |
| --- | --- | --- |
| **Field reference** | Which existing field does this rule read? | `showAdvanced` in this running form. |
| **Value read** | What aspect of that field is an input to the rule? | `showAdvanced.value`, a Boolean answer. |
| **Value binding** | Where does its answer live in the form data? | `showAdvanced` in this simple case; a different path can be supplied when needed. |
| **Presentation** | Where is the field currently shown? | Directly in the form, or later in a section, page, or tab. |

Changing presentation preserves the resolved reference. The checkbox could be rendered on Basics and the controlled section on Configuration, but the condition still reads the same field. A page may introduce local names while authoring content; it does not introduce a separate value store or make the route part of field identity.

Reference resolution must be unambiguous. Labels, DOM ancestry, the currently visible page, and a library field's name cannot choose between several instances. An authoring alias may change during refactoring; preserving the field's identity and binding preserves the relationship's meaning. Reading `range.value.end` selects part of an existing object-valued field and creates no extra writable field.

In these sketches, a value read inside a condition or an input connection is a **live dependency**, not a Boolean copied once when the form is created. Ordinary one-time values and defaults remain possible; the API must distinguish them from connections.

## The composition provides the boundary

| Where the rule is composed | How it gets its reference |
| --- | --- |
| **Inline section, page, or form content** | Refer directly to the field declared in the available authoring context. Keep the common case local and concise. |
| **Inside a reusable section or page** | Refer to its own named members or declared inputs. Each use resolves local members to its own instances. |
| **Between reusable pieces** | The containing composition connects the relevant exposed field/value to the other piece's input. |
| **Outside the running form** | The application supplies an explicit input or service. Another form with the same field names is a separate scope. |

If this whole interaction is later extracted as Options, two uses each have their own `showAdvanced`. Toggling the primary use cannot reveal the recovery use accidentally. If both should share one controlling checkbox, the containing composition connects that shared dependency intentionally.

Extracting just the advanced controls introduces an outside input at the reuse boundary:

```text
library section AdvancedOptions
  input: expanded (Boolean)
  visible when expanded
  ... fields ...

caller:
  advanced = use AdvancedOptions at configuration
    expanded <- showAdvanced.value
```

The caller can be a section, page, or form. The reusable piece need not know the caller's field name or value path. Extracting the entire interaction instead keeps its checkbox and condition together, with no outside input needed. Ordinary component extraction remains available without a semantic Section. These are composition choices, not a requirement to create a context object for every field.

## Say what the relationship does

The reference, the test, and the effect are separate ideas. The same field value can supply several clearly named behaviours:

| Intent | Illustrative relationship | Consequence |
| --- | --- | --- |
| Reveal controls | `advanced visible when showAdvanced.value` | Changes presentation. Existing requirements and values still apply. |
| Enable a branch | `advanced applies when enableAdvanced.value` | Changes applicability. Declare retention, validation, and payload policies for disabling it. |
| Require an answer | `reason required when exception.value` | Changes the relevant presence requirement, with completion re-evaluated. |
| Supply dependent options | `region.accountId <- account.value` | Rechecks selections and required option data when account changes. |
| Check related values | `end must be after start.value` | Adds validation without writing either value. |
| Compute a value | `total derived from lines` | Explicitly declares a computed result and its inputs. Reading a reference alone never creates this write. |

“Show advanced options” is commonly disclosure. Its hidden fields may have valid defaults and still be submitted. “Enable advanced configuration” can instead opt into requirements. Both use a simple reference; the named effect determines their meaning. The example chooses disclosure and an explicit payload mapping.

A controller must remain reachable when its target is hidden. A hidden applicable field can also become invalid. Error correction must have a declared way to reveal the appropriate presentation and focus its control; Formulate cannot generally infer how to reverse an arbitrary visibility expression. The example supplies an explicit reveal action that sets the disclosure checkbox.

## Changes must propagate through the same state model

Changing a referenced value re-evaluates the affected conditions, dependencies, and requirements. Their results feed the existing [field, section, page, and form completion](03-state-and-completion.md). A pure disclosure change alone does not revoke completion, clear answers, or remove validation.

Relationships persist when page UI unmounts. Removing a repeated item is different: that field instance no longer exists. A reference or late response must not attach to whichever item now occupies its old array index. Invalid configuration references require useful errors; intentionally optional inputs need a declared absence policy.

An empty value, an unresolved input, and an inapplicable source are also different:

- An empty value follows the field's value contract and defaults. The example checkbox starts with a known `false` value.
- An unresolved required dependency cannot silently be treated as `false` to remove a requirement or report completion. Expose that it is unresolved until it can be evaluated; a nonexistent declared target is a configuration error.
- A retained value remains readable when its source is inapplicable. If a condition means “the active answer is yes,” it must consider both source applicability and value, for example `choice.applicable and choice.value`. Visibility must not silently redefine `.value`.

Validate relationship compatibility and unsupported feedback loops when definitions are composed. Two validators reading each other's stored values are not inherently a feedback loop. A computed value that continually changes its own source, or a completion rule depending on its own completion, needs an explicit supported policy or an actionable error. Part 6 must define scheduling and diagnostics; Part 3 need not invent a general graph API.

## Keep the hook and wire format open

A public field reference represents a stable logical identity plus observable values/state. React `useRef` could hold an implementation handle, but changing `ref.current` does not trigger a render. The relationship therefore also needs a way to observe relevant field changes; `useRef` alone would not supply reactive conditional rendering. [React useRef reference](https://react.dev/reference/react/useRef#caveats).

Typed handles in React authoring and validated identity references in portable definitions may express the same relationship. The choice belongs in later API design. This part anchors the semantics: simple local references, explicit connections across reuse boundaries, unambiguous instances, named effects, and current results that survive presentation changes.
