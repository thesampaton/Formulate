# Advanced options: disclosure between fields

[Scenario rubric](README.md) · [References and relationships](../03-references-and-relationships.md)

A checkbox can reveal neighbouring fields directly. Grouping and navigation are optional.

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

`showAdvanced.value` is a live reference to this checkbox. Moving either presentation preserves the relationship; no section, registry, or full-path lookup is needed.

This is **disclosure**: the settings always apply and enter the payload. Hiding them retains their values and requirements. The explicit mapping omits the UI-only toggle and supplies the requested payload shape; it requires no matching Section.

Validated defaults can make the form complete before disclosure. Invalid retries make the field and form incomplete even when hidden. Correction reveals the field, waits for its control, then focuses it.

| Change | Required outcome |
| --- | --- |
| Add an Advanced Section. | It may share the visibility condition and show group completion; bindings and payload stay the same. |
| Put the checkbox and settings on different pages. | Keep the same dependency. Correction opens the settings page before revealing and focusing the field. |
| Unmount inactive pages. | Retain values and evaluate dependencies at the form boundary. |
| Reuse the interaction twice. | Each use resolves its own checkbox and fields independently. |

If only the numeric fields are reusable, expose their external control as an input:

```text
library section AdvancedOptions
  input: expanded
  visible when expanded
  ... retries and timeoutSeconds ...

caller connects:
  expanded <- showAdvanced.value
```

An **Enable advanced configuration** checkbox instead describes applicability. Its policy might retain answers, skip their requirements, and exclude them from submission while disabled. Re-enabling rechecks retained answers. Those effects must be chosen explicitly; hiding controls does not imply them.

## Executable scoped-navigation extension

The [example](../../examples/react/src/advanced-options.tsx) now has two editing pages and a reader:

1. **Settings:** the disclosure toggle, retries, and timeout. Next checks those paths only.
2. **Destination:** a required Request URL, initially empty. Review checks the URL path only; Back returns freely to Settings.
3. **Review:** current values, Edit retries / Edit destination links, and Save. Save validates and parses the entire form.

The payload extends the original numeric configuration with `configuration.endpoint`. No network request is made to that URL. The empty URL is deliberate: valid Settings must advance even while another page is incomplete, without displaying that untouched page's error prematurely.

Correction destinations explicitly map each field to its page. Numeric errors also reveal Advanced options. Navigation commits before focus; the same destinations drive Review edit links. Layout still contributes no data paths or rule membership.

Acceptance evidence in [scenario tests](../../tests/scenarios.test.tsx) and [navigation tests](../../tests/navigation.test.tsx):

- Next and Enter share the current page's scope. Only Save invokes the application callback with the complete parsed result.
- Hidden numeric requirements still block Settings. A blank or invalid URL blocks Destination.
- Final validation catches newly invalid values and cross-page requirements, including unmounted editors, and uses the declared correction destination.
- Values survive Back and review edit links. Review mounts no editors and does not copy values into another form.
- A newer navigation replaces pending focus. Edits, resets, leaving a page, and unmounting suppress obsolete validation callbacks.
- Duplicate events share one pending attempt. A thrown check releases the guard and allows retry with entered values intact.

The helper does not abort async validators or reconcile their eventual RHF errors. Each scope selects error paths from the resolver, not a partial schema; cross-field requirements must be assigned deliberately. Page completion, route guards, disappearing destinations, and async reveal remain outside this slice.
