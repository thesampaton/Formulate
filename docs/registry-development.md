# Local source registry

Responsibilities and installation bundles are distinguished in the [building-block taxonomy](04-building-blocks.md).

The checked-in [registry.json](../registry.json) builds standard shadcn source items. The UI components in `examples/react/src/components/ui` were installed with the shadcn CLI; they are editable local source. The example app owns their package dependencies and theme. The core runtime stays independent of Tailwind and shadcn.

The installation destination is configured in [components.json](../examples/react/components.json): `aliases.ui` points to `@/components/ui`, with the example TypeScript/Vite alias resolving `@` to `src`. Its `style` is `base-nova` and `iconLibrary` selects Lucide. The supplied bindings currently require shadcn Base UI components; configure consumers with a `base-*` style too. Install or update UI components from the example project with:

```sh
pnpm --filter @formulate/examples exec shadcn add field input textarea checkbox switch select radio-group combobox command toggle-group slider calendar popover input-otp button tabs
```

`components/ui` contains the installed source. `components/formulate` contains Formulate's bindings, layouts, navigation, actions and field presentation. `lib/formulate-config.ts` maps declaration keys to those bindings. All UI source now comes from shadcn's Base UI catalogue. Command, Calendar and OTP retain that catalogue's cmdk, React DayPicker and input-otp implementations. These dependencies do not enter core or common fields.

Bindings expose editing values and a small set of configuration props. Base UI's `render`, internal refs, state callbacks, array-shaped single toggle values and popup focus APIs are handled locally. `useCompoundFieldBinding` supplies a UI-independent `canRestoreFocus()` policy, mapped to Base UI's `finalFocus`. Future Radix or React Aria bindings can implement the same field contracts through their own components. Their implementation and installation support remain future work; switching a consumer's shadcn style alone is not sufficient.

### Installation config and runtime bindings

| Concern | Owner | When it applies |
| --- | --- | --- |
| UI source locations, style and import aliases | The consumer's `components.json` and shadcn CLI | Installation. The CLI places source and rewrites imports for that project. |
| Input, Checkbox, Select and Field implementations | The consumer's local shadcn source | Rendering. Customisations are made in the components the app already uses. |
| Value/event/ref bindings and field presentation | Local Formulate binding source | Rendering. Thin wrappers connect those shadcn exports to the core field contract. |
| Declaration keys such as `input` and `checkbox` | `lib/formulate-config.ts` | Declaration authoring. Selects which local binding each key uses. |

`@formulate/shadcn-bindings` names a source registry item, not an npm UI package or a separate copy of shadcn. Its own files contain only Formulate code. Standard registry dependencies install the full [control catalogue](../packages/react/docs/control-catalogue.md), including the underlying UI/package dependencies for Combobox, Command and OTP. Existing components remain subject to the CLI's normal file-conflict choices; overwriting is not enabled by default. Consumers can also install missing primitives explicitly with `shadcn add` before adding the bindings.

Formulate does not read `components.json` at runtime or dynamically discover controls. Adapting paths is a distribution concern: the registry uses `@components/` and `@lib/` targets, and the CLI rewrites the corresponding imports during installation. The resulting code has ordinary local imports. Further install-time customisation can be added when needed without creating another runtime configuration system. See [components.json](https://ui.shadcn.com/docs/components-json), [registry targets](https://ui.shadcn.com/docs/registry/registry-item-json#target) and [CLI options](https://ui.shadcn.com/docs/cli#add).

Select and Combobox map Base UI's null selection to the existing empty string editing value. Select now shares the compound popup lifecycle: it closes on Activity/disabled transitions, validates on close and guards focus restoration. The previous Radix native-form-bridge workaround is removed.

The application supplies semantic theme tokens through a single `src/globals.css`, using `@theme inline` and `:root`/`.dark` CSS variables. It imports Tailwind and `tw-animate-css`; scaffold layout and typography use Tailwind defaults. Shadcn components own styling and variants. Slider's generated native range input is connected inside the binding; the width demo uses its standard `aria-labelledby` support. Two small accessibility fixes are retained in the installed UI source: Calendar attaches its day Button ref so keyboard focus works, and Combobox names its icon-only toggle/clear buttons. Apply these fixes in a consumer or preserve them when refreshing the UI files until upstream includes them; the bindings do not require extra component props.

```sh
pnpm registry:build
pnpm dev
```

The build writes ignored artifacts into `examples/react/public/r`; Vite serves them under `/r`. `pnpm build` also builds these artifacts into the example site's distribution. No registry has been published publicly.

| Item | Installs |
| --- | --- |
| `@formulate/core` | Core runtime source under `@/lib/formulate`, including dependent-choice definitions, the hook and private request/store modules, requiring React 19.2+, RHF, resolver and Zod. |
| `@formulate/common-fields` | Eight portable `defineField` definitions under `@/lib/formulate-fields/common-fields`; depends only on core and Zod. Controls remain locally bound. |
| `@formulate/layouts` | Stack, Row and ActionRow, built on the consumer's local shadcn FieldGroup. |
| `@formulate/shadcn-bindings` | Full control map, basic/group/search/date adapters, shared control utilities and Base UI Popover content, field presentation and pending boundary. UI source comes through standard shadcn registry dependencies with a `base-*` consumer style. |
| `@formulate/pickers` | Optional date-range and multiple-selection bindings; depends on core, the field presentation and locally installed shadcn Calendar, Popover, Button, Checkbox and Label. Add its exports to your control map. |
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

## Common fields

Using the same local registry configuration, install `@formulate/common-fields`. It installs semantic source separately from `@formulate/shadcn-bindings`; it does not create another package, runtime registry, or UI backend.

```sh
pnpm dlx shadcn@latest add @formulate/common-fields @formulate/shadcn-bindings
```

```tsx
import { defineForm, field } from "@/lib/formulate-config";
import { Email, Currency, Country } from "@/lib/formulate-fields/common-fields";

const Contact = defineForm({
  email: field(Email, { label: "Work email" }),
  budget: field(Currency),
  country: field(Country, {
    component: "select",
    componentProps: { options: [{ value: "AU", label: "Australia" }, { value: "NZ", label: "New Zealand" }] },
  }),
});
```

The default local map binds `currencyInput` to its numeric Input adapter. Applications can replace that entry with a formatted currency control accepting numbers. No currency symbol or locale is assumed. The common Country nominates the supplied `combobox`; the example above explicitly selects the existing `select` binding. `field(Country, { componentProps: { options } })` supplies Combobox's required options while retaining the common placeholder. Register `DateRangeControl` from `@formulate/pickers` as `dateRange` to use the common DateRange with that UI. None of these names resolves an implementation in core.

| Export | Primitive / default control | Initial value and validation policy |
| --- | --- | --- |
| `Email` | `text` / `input` | Empty string; Zod email; email input and autocomplete. |
| `Password` | `text` / `input` | Empty string; nonempty; password input with current-password autocomplete. Sign-up policy is a derived definition. |
| `Url` | `text` / `input` | Empty string; Zod URL validation; no HTTP-only restriction. |
| `Phone` | `text` / `input` | Empty string; permitted phone punctuation and at least seven digits. No country-specific validity or normalisation claim. |
| `Currency` | `number` / `currencyInput` | Zero; finite number in major units, including negative credits. Step `0.01` is a UI hint, not a rounding rule. Currency, precision and storage policy stay with the application. |
| `Percentage` | `number` / `number` | Zero; finite 0–100, including fractions. No conversion to a 0–1 ratio. |
| `Country` | `choice` / `combobox` | Empty string; two uppercase letters. Apps supply options and membership validation; the schema alone does not certify a real or eligible country. |
| `DateRange` | `object` / `dateRange` | `{ from: null, to: null }`; editing endpoints are nullable Dates. Validation requires both and rejects end-before-start at `to`; equal dates are allowed. Submission retains Dates unless explicitly derived. |

Defaults can intentionally be invalid while editing. To change validation, derive with the public helper, for example `defineField({ ...Country, schema: z.enum(["", "AU", "NZ"]).refine(value => value !== "", "Choose a country.") })`. Keeping the empty editing state lets the form start unselected. Existing dependent-choice membership rules remain available without changes to their API.

The common item imports only core and Zod, so it can be installed without shadcn. A domain item such as `@acme/project-code` uses the same `defineField`, files, targets and dependency conventions. The source browser identifies common fields as the actual `@formulate/common-fields` registry item.

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
