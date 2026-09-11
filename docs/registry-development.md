# Local source registry

Responsibilities and installation bundles are distinguished in the [building-block taxonomy](04-building-blocks.md).

The checked-in [registry.json](../registry.json) builds standard shadcn source items. The UI components in `examples/react/src/components/ui` were installed with the shadcn CLI; they are editable local source. The example app owns their package dependencies and theme. The core runtime stays independent of Tailwind and shadcn.

The installation destination is configured in [components.json](../examples/react/components.json): `aliases.ui` points to `@/components/ui`, with the example TypeScript/Vite alias resolving `@` to `src`. Its `style` selects the installed shadcn style and `iconLibrary` selects Lucide. Install or update UI components from the example project with:

```sh
pnpm --filter @formulate/examples exec shadcn add field input checkbox select button slider tabs
```

`components/ui` contains the installed source. `components/formulate` contains Formulate's bindings, layouts, navigation, actions and field presentation. `lib/formulate-config.ts` maps declaration keys to those bindings. Binding props derive from the local shadcn exports; backend imports such as Radix stay inside `components/ui`. The current installed style uses Radix. Changing the shadcn backend later should be checked at this local UI boundary; Formulate does not expose a backend selector or promise that every backend's component props are identical.

### Installation config and runtime bindings

| Concern | Owner | When it applies |
| --- | --- | --- |
| UI source locations, style and import aliases | The consumer's `components.json` and shadcn CLI | Installation. The CLI places source and rewrites imports for that project. |
| Input, Checkbox, Select and Field implementations | The consumer's local shadcn source | Rendering. Customisations are made in the components the app already uses. |
| Value/event/ref bindings and field presentation | Local Formulate binding source | Rendering. Thin wrappers connect those shadcn exports to the core field contract. |
| Declaration keys such as `input` and `checkbox` | `lib/formulate-config.ts` | Declaration authoring. Selects which local binding each key uses. |

`@formulate/shadcn-bindings` names a source registry item, not an npm UI package or a separate copy of shadcn. Its own files contain only Formulate code. Standard registry dependencies (`field`, `input`, `checkbox`, `select`) let the shadcn CLI acquire the required UI source using the consumer's configuration. Existing components remain subject to the CLI's normal file-conflict choices; overwriting is not enabled by default. Consumers can also install missing primitives explicitly with `shadcn add` before adding the bindings.

Formulate does not read `components.json` at runtime or dynamically discover controls. Adapting paths is a distribution concern: the registry uses `@components/` and `@lib/` targets, and the CLI rewrites the corresponding imports during installation. The resulting code has ordinary local imports. Further install-time customisation can be added when needed without creating another runtime configuration system. See [components.json](https://ui.shadcn.com/docs/components-json), [registry targets](https://ui.shadcn.com/docs/registry/registry-item-json#target) and [CLI options](https://ui.shadcn.com/docs/cli#add).

The local Select binding ignores empty changes emitted by Radix’s native form bridge as Activity reconnects effects. Empty is not a selectable Radix item; RHF reset/setValue still controls clearing. This adapter fix is covered by selection, retained-page and hidden-reset tests. The installed shadcn Select source is unchanged.

The application supplies semantic theme tokens and imports `tw-animate-css`. Shadcn components own control styling and variants. The only local source adjustment to Slider forwards its existing ARIA label props to its generated thumbs, so the width control has an accessible name. No new Slider API is introduced.

```sh
pnpm registry:build
pnpm dev
```

The build writes ignored artifacts into `examples/react/public/r`; Vite serves them under `/r`. `pnpm build` also builds these artifacts into the example site's distribution. No registry has been published publicly.

| Item | Installs |
| --- | --- |
| `@formulate/core` | Core runtime source under `@/lib/formulate`, including dependent-choice definitions, the hook and private request/store modules, requiring React 19.2+, RHF, resolver and Zod. |
| `@formulate/layouts` | Stack, Row and ActionRow, built on the consumer's local shadcn FieldGroup. |
| `@formulate/shadcn-bindings` | Bindings over local shadcn controls, field presentation, pending editor boundary and the declaration control map; UI source comes through standard shadcn registry dependencies. |
| `@formulate/actions` | Submit, Continue and Back/Edit controls; depends on core and shadcn Button, with no tab/page dependency. |
| `@formulate/navigation` | FormTabs/FormTabPage, page action sets and an inherited page layout; depends on core, layouts, actions and shadcn Tabs. |
| `@formulate/name` | Reusable first/last name definition, fieldset presentation and all required items. |

In a React 19.2+ (19.x) + Tailwind 4 consumer with shadcn configured, add this entry to its `components.json`. Use the actual port printed by Vite if 5173 is occupied:

```json
{
  "registries": {
    "@formulate": "http://localhost:5173/r/{name}.json"
  }
}
```

Then run in that consumer:

```sh
pnpm dlx shadcn@latest add @formulate/name
```

```tsx
import { defineForm } from "@/lib/formulate-config";
import { Name } from "@/components/formulate/name";
import { Stack } from "@/components/formulate/layouts";

const Profile = defineForm({ name: Name }, { layout: Stack });

export function ProfileForm() {
  const form = Profile.useForm();
  return <Profile.Form form={form} onSubmit={(values) => console.info(values)}>
    <Profile.Fields />
    <button type="submit">Save</button>
  </Profile.Form>;
}
```

The registry installs local source, so consumers do not need the private `@formulate/react` workspace package. This repository uses a small development facade at `examples/react/src/lib/formulate.ts` to exercise the same public API against workspace source. Registry items install the actual core files at that alias instead. All installed primitives resolve the same React contexts.

Declare imported npm packages in `dependencies`, and installed source requirements in `registryDependencies`, including dependencies on the same namespace. Shared shadcn components remain the consumer's local components. This follows the [registry item contract](https://ui.shadcn.com/docs/registry/registry-item-json). Hosting, public release URLs and release compatibility policy remain future work.

## Form navigation

Install `@formulate/navigation` alongside the form declarations and controls. Its components compose within the owning Form:

```tsx
<FormTabs pages={tabs} value={navigation.page} onValueChange={navigation.goToPage}
  onNavigate={navigateToPage} label="Profile pages" pageLayout={FormStepLayout}>
  <FormTabPage value="profile" title="Your details">
    <Profile.Fields />
  </FormTabPage>
  <FormTabPage value="review" title="Review"
    actions={<FormReviewActions pendingLabel="Saving…">Save profile</FormReviewActions>}>
    <ProfileSummary />
  </FormTabPage>
</FormTabs>
```

This fragment assumes the enclosing Form supplies `scopedAction` with the current scope and next destination. Continue submits that scoped action; FormSubmitButton submits the final action when no scope is supplied. Back/Edit never submits. All action buttons and tab triggers read the owning Form's pending state. FormActionFieldset can disable the editors for the same period. Tabs use manual keyboard activation: arrows focus a trigger, Enter or Space selects it.

The caller owns the selected page and supplies status values. [The multi-page-form scenario](03-scenarios/multi-page-form.md) shows the complete composition, synchronous completion rules and shared editing state. Active panels mount their editors in the same navigation commit so correction focus reaches the new field; inactive shadcn panel shells preserve ARIA relationships without keeping editors mounted.

FormTabPage combines a tab panel and a semantic Page, inheriting `pageLayout` from FormTabs. The existing core `layout` prop can replace that default for one page; `layout={null}` renders its body directly. FormStepLayout places children above an action row, deriving Back and Continue labels from the parent's available page order. The final page defaults to Submit. A page can provide `actions` to replace that row's contents or `actions={null}` to remove it. These overrides are consumed by FormStepLayout; custom layouts choose how to use them through `useFormPage()`.

FormReviewActions derives Edit links to the other available pages and supplies the final submit button. `onValueChange` handles tab selection; `onNavigate` handles Back/Edit and can additionally focus a destination editor. It defaults to `onValueChange`. Disabled pages are excluded from these actions. Validation scopes and Continue destinations remain the enclosing Form's responsibility, so a layout never becomes another value or workflow owner.

ActionRow lives with layouts; FormReviewActions and FormPageActions live in `form-page-actions.tsx`. FormActionFieldset lives in `form-action-fieldset.tsx` and is distributed by the shadcn bindings item. Registry items carry standard category tags, and the example source browser identifies their actual item names.
