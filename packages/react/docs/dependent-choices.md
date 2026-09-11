# Dependent choices

Use dependent choices when one answer determines the options available for another: an account determines its regions, or a region determines its machine sizes. A reusable section can keep that relationship together with its controls, layout, loading feedback, and retry button.

This example uses the same registry setup as the [README](../README.md): `shadcn-bindings` for connected controls, `layouts` for `Stack`, and `actions` for `FormSubmitButton`. The `@/` imports refer to those files in your project.

## 1. Declare the dependency

Someone enters an account ID, then chooses one of its regions. Keep the rule and definitions at module scope. The section uses the `TargetFields` presentation defined in the next step.

```tsx
import { defineChoice, LayoutBody } from "@/lib/formulate";
import type { Choice, ChoiceLoader, SectionPresentationProps } from "@/lib/formulate";
import { defineForm, defineSection } from "@/lib/formulate-config";
import { FieldSet, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/formulate/layouts";
import { FormSubmitButton } from "@/components/formulate/form-actions";
import { z } from "zod";

const regionChoices = defineChoice({
  getInput: (target: { accountId: string }) => target.accountId || null,
  getRequestKey: (accountId: string) => accountId,
  getLoader: (services: { listRegions: ChoiceLoader }) => services.listRegions,
  validateSelection: (regionId: string, options: readonly Choice[]) =>
    options.some((option) => option.value === regionId)
      ? undefined
      : "Choose an available region.",
  messages: {
    missing: "Enter an account ID first.",
    pending: "Loading regions…",
    failed: "Regions could not be loaded. Try again.",
  },
});

const Target = defineSection({
  accountId: {
    schema: z.string().min(1, "Enter an account ID."),
    defaultValue: "", label: "Account ID", component: "input",
  },
  regionId: {
    schema: z.string(), choices: regionChoices,
    defaultValue: "", label: "Region", component: "select",
    componentProps: { options: [], placeholder: "Choose a region" },
  },
}, { title: "Deployment target", layout: Stack, presentation: TargetFields });

const Deployment = defineForm({ primary: Target, recovery: Target }, { layout: Stack });
```

The four functions answer separate questions:

| Function | What it provides |
| --- | --- |
| `getInput(values, services)` | The input for this request, or `null` when a prerequisite is missing. Values belong to the containing section. |
| `getRequestKey(input)` | A string that changes whenever the requested result should change. |
| `getLoader(services)` | The application function that loads the options. |
| `validateSelection(selection, options)` | An error message for an unacceptable selection, or `undefined` when it is valid. This function is synchronous. |

A `Choice` has `{ value: string, label: string }`. A `ChoiceLoader` receives `(input, signal)` and returns a promise of options. Both the input and option types can be customized with `ChoiceLoader<Input, Option>`; the control must support the chosen option type.

## 2. Load and display the options

Define `TargetFields` in the same module. It supplies the current options to the connected shadcn select and uses the section's title and layout. Each use of the section gets this presentation automatically.

```tsx
function TargetFields({ title, layout }: SectionPresentationProps) {
  const regions = Target.useChoice("regionId");

  return (
    <FieldSet>
      <FieldLegend>{title}</FieldLegend>
      <LayoutBody layout={layout}>
        <Target.Field name="accountId" />
        <Target.Field name="regionId" componentProps={{ options: regions?.options ?? [] }} />
        {regions?.validationMessage && <p role="status">{regions.validationMessage}</p>}
        {regions?.status === "failed" && (
          <Button type="button" variant="outline" onClick={regions.retry}>Retry</Button>
        )}
      </LayoutBody>
    </FieldSet>
  );
}

export function DeploymentForm({ listRegions, onDeploy }: {
  listRegions: ChoiceLoader;
  onDeploy: (values: z.output<typeof Deployment.schema>) => void | Promise<void>;
}) {
  const form = Deployment.useChoiceForm({ services: { listRegions } });

  return (
    <Deployment.Form form={form} onSubmit={onDeploy}>
      <Deployment.Section name="primary" title="Primary target" />
      <Deployment.Section name="recovery" title="Recovery target" />
      <FormSubmitButton pendingLabel="Deploying…">Deploy</FormSubmitButton>
    </Deployment.Form>
  );
}
```

Supply your `listRegions` service and `onDeploy` handler when rendering `DeploymentForm`. `Deployment.useChoiceForm({ services })` enables loading and membership validation. `Deployment.useForm()` applies only the schema; adding `choices` to a declaration does not start requests by itself.

Both sections share the controls, spacing, loading feedback, and selection rule. Each reads its own account and validates its own region. Required services are inferred through nested sections, and loading works even when their editors are unmounted.

`Target.useChoice("regionId")` must run inside that target's `Section` or `Bind`, beneath the `Form` that owns the choice-aware runtime. The view can be `undefined` before its binding is available. It contains `status`, `options`, `validationMessage`, `revision`, and `retry`.

The configured `select` control accepts the `options` prop used here. `useChoice` supplies the data; the section's presentation decides how to display it. See [custom controls](custom-controls.md) to adapt another picker, or the [Cloud Deployment example](../../../examples/react/src/declarations/cloud-deployment.ts) for a larger form.

## What happens when an answer changes

- **The current selection stays.** Changing an account reloads its regions but does not clear `regionId`. The rule decides whether the retained selection is still acceptable.
- **Missing input blocks validation.** Returning `null` skips the request and uses `messages.missing`. Empty strings, zero, and false can be valid inputs if your rule returns them instead of `null`.
- **Loading and failure block validation.** Services run outside validation. A check uses the available request state immediately, with `messages.pending` or `messages.failed`; it does not wait for a service call.
- **Loaded options do not prove a valid selection.** `status: "ready"` means loading succeeded. Check `validationMessage` to know whether the selected value is acceptable. `retry()` runs the request again.

The resolver reads dependencies and selections from editing values, parses the form schema once, and adds membership errors at the editing field paths. Schema errors are preserved. Parsed output can rename fields or change their types; it never replaces the editing values or becomes the dependency input.

Keep definitions and loader functions stable. The definition hook handles an inline services object when its top-level entries are unchanged. It also supports the same static default overrides as `useForm`; see [defaults and prefills](fields-and-sections.md). Keep the form hook mounted outside hidden React Activity boundaries so loading and validation subscriptions stay active.

## Repeated or remapped sections

For an array of targets, use the lower-level `useChoiceForm` and provide `getChoiceBindings`. The callback connects each item's current paths to its stable identity. Continuing with `Target` above:

```tsx
import { useCallback } from "react";
import { useChoiceForm } from "@/lib/formulate";

const repeatedSchema = z.object({
  targets: z.array(Target.schema.extend({ targetId: z.string().min(1) })),
});
type RepeatedValues = z.input<typeof repeatedSchema>;

function bindTarget(targetId: string, index: number) {
  return Target.bind<RepeatedValues>({
    id: targetId,
    bindings: {
      accountId: `targets.${index}.accountId`,
      regionId: `targets.${index}.regionId`,
    },
  });
}

function useRepeatedTargets(listRegions: ChoiceLoader) {
  const getChoiceBindings = useCallback((values: RepeatedValues) =>
    values.targets.flatMap((target, index) =>
      bindTarget(target.targetId, index).bindChoices({
        values, services: { listRegions },
      }),
    ), [listRegions]);

  return useChoiceForm({
    schema: repeatedSchema,
    defaultValues: { targets: [] },
    getChoiceBindings,
  });
}
```

This returns the form directly, augmented with `choices` and `getValidationRevision`, just like the definition hook. Pass it to `Form`. For each editor, pass the matching `bindTarget(targetId, index)` result to `Target.Bind` as its `binding` prop, along with `control={form.control}`. `Bind` uses the section's `TargetFields` presentation and default layout automatically. See the complete [Infrastructure example](../../../examples/react/src/hooks/use-infrastructure.ts) for adding, moving, and restoring items. Keep these three identifiers separate:

| Identifier | Example | Rule |
| --- | --- | --- |
| `choiceId` | `target-123.regionId` | Stable and unique within the form. Use an item ID, never its array index. Obtain it with `binding.resolveChoiceId("regionId")`. |
| `fieldPath` | `targets.0.regionId` | The current editing location. Moving an item changes this path while preserving its request state; old and new error paths are refreshed. |
| `requestKey` | `account-456` | Encodes every dependency that affects the result. Equal keys assert interchangeable input for this use. |

The callback must remain stable and receive complete editing defaults for every dependency it reads. Include external dependencies in its `useCallback` dependency list. Repeated arrays, conditional membership, and cross-section context are application decisions; `getInput` can also read host-supplied services/context.

## Clearing requests and handling obsolete work

Call `form.choices.clearRequests()` immediately before `form.reset(restoredValues)` when restoring a validated draft. Clearing aborts requests and discards options without changing selections or immediately reloading. The reset then starts fresh requests, even for identical values. Validate external draft data before resetting.

Unmounting an editor retains its requests and options. Omitting a binding from `getChoiceBindings` removes that use. Request keys are per use; there is no shared cache, request deduplication, debounce, or dependency graph.

Obsolete service results are ignored, including failures and results from loaders that ignore their `AbortSignal`. Replacing a loader cancels only uses of that loader. Retries, loader replacement, removal, and restoration change the form's validation revision even if values and options are unchanged.

`Form` reads that revision automatically and suppresses callbacks from checks that became obsolete. Override `getValidationRevision` only to combine it with another application revision. This guard cannot cancel asynchronous work inside a callback that has already started, and an obsolete asynchronous schema check can still write RHF errors. See [navigation and validation](navigation-and-validation.md) for action behavior.

For coordination outside a definition's presentation, `form.choices.get(choiceId, rule)` returns a typed view or `undefined` if the use is missing or the rule does not match. Read views again on each render; use RHF's `useWatch` for live selected values. Direct `Definition.bindChoices({ id, values, bindings, services })` is also available, but sharing a `Section.bind(...)` result keeps presentation and request bindings together.

[Back to the package README](../README.md)
