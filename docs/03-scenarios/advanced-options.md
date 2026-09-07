# Advanced options: a field controlling another presentation

[Scenario rubric](README.md) · [References and relationships](../03-references-and-relationships.md)

This Part 3 example tests a checkbox revealing advanced settings. It supplements the seven Part 9 hero scenarios. The baseline has only a Form and three inline Fields. A condition can apply directly to a field; grouping and navigation are optional additions.

The pseudocode expresses relationships, not an API proposal. Each field key supplies its identity and binding here. Explicit binding overrides remain available when needed; this example needs none.

```text
form RequestSettings
  field showAdvanced
    control: Checkbox
    label: Show advanced options
    value: Boolean, initially false

  field retries
    control: Input, numeric
    initial: 3
    validate: integer from 0 to 10
    visible when showAdvanced.value

  field timeoutSeconds
    control: Input, numeric
    initial: 30
    validate: positive number
    visible when showAdvanced.value

  reveal advanced fields for correction:
    set showAdvanced.value to true

  submit:
    validate: all applicable form requirements
    payload:
      configuration:
        retries: retries.value
        timeoutSeconds: timeoutSeconds.value
    handler: application.saveRequestSettings
```

`showAdvanced` references this checkbox in the running form. Its `.value` is a live dependency on the current answer. The relationship needs no section, library definition, registry, DOM search, or full-path lookup. Moving either presentation preserves the resolved reference. A Page or Section can compose the same relationship when one exists.

The checkbox controls **disclosure**: settings always apply, start with valid defaults, and enter the mapped payload. Hiding them preserves values and requirements. The UI-only toggle is omitted because the payload explicitly selects configuration values. Its nested `configuration` shape does not require a matching Section. Visibility alone does not determine inclusion, validation, applicability, retention, or permissions.

**Completion and correction:** both Boolean answers satisfy the checkbox contract. Validated defaults can make the form complete without revealing the advanced fields. An invalid retry count makes that field and the form incomplete; hiding it does not clear the failure. Correction sets `showAdvanced` to true, waits for the editable control to mount, then focuses it. There is no Section or Page completion state to author. If those constructs are added, their assigned requirements can supply additional indicators.

| Change to pressure-test | Required outcome |
| --- | --- |
| Add an Advanced Section around the two numeric fields. | Grouping can supply a shared visibility condition and completion indicator. It does not automatically rename bindings or change the payload. |
| Put the checkbox on Basics and numeric fields on Configuration. | Conditions still read the same checkbox. Page availability changes only if explicitly connected. No copied value or rewritten dependency is needed. |
| Present those Pages as routes or tabs, unmounting inactive UI. | Relationships, values, and requirements remain in the form. A full reload needs draft restoration and re-evaluation. |
| Enter invalid retries, hide the fields, then submit. | Submission remains blocked with an explanation and correction action. If paginated, correction opens the appropriate page, reveals the field, then focuses it. |
| Extract the whole interaction and use it twice. | Each use has independent fields and local references, with distinct caller-supplied bindings. Toggling one does not affect the other. |

Extracting the whole interaction into an optional reusable Section preserves its internal wiring. If only the numeric fields are reusable, their external control becomes a declared input:

```text
library section AdvancedOptions
  input: expanded
  visible when expanded
  ... retries and timeoutSeconds fields ...

caller connects:
  expanded <- showAdvanced.value
```

The caller supplies the live relationship; the reusable definition does not hardcode its caller's path. Its local reference scope is deliberate. Removing a grouping or navigation wrapper must preserve field bindings and resolved relationships. Move any still-needed group rules, conditions, retention/inclusion policies, or defaults to surviving fields or their owner.

An alternative **Enable advanced configuration** checkbox describes applicability. That example must explicitly choose what disabling means: for example, retain answers, skip their requirements, and exclude their values from submission. Re-enabling rechecks retained answers. Those consequences come from the declared policy, not from hiding the controls.
