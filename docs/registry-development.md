# Local source registry

The checked-in [registry.json](../registry.json) builds standard shadcn source items. The UI components in `examples/react/src/components/ui` were installed with the shadcn CLI; they are editable local source. The example app owns their package dependencies and theme. The core runtime stays independent of Tailwind and shadcn.

The installation destination is configured in [components.json](../examples/react/components.json): `aliases.ui` points to `@/components/ui`, with the example TypeScript/Vite alias resolving `@` to `src`. Its `style` selects the installed shadcn style and `iconLibrary` selects Lucide. Install or update UI components from the example project with:

```sh
pnpm --filter @formulate/examples exec shadcn add field input checkbox select button slider
```

`components/ui` contains the installed source. `components/formulate` contains only Formulate's connected adapters, layouts and field presentation. `lib/formulate-config.ts` maps control keys to those adapters. Adapter props derive from the local shadcn exports; backend imports such as Radix stay inside `components/ui`. The current installed style uses Radix. Changing the shadcn backend later should be checked at this local UI boundary; Formulate does not expose a backend selector or promise that every backend's component props are identical.

The application supplies semantic theme tokens and imports `tw-animate-css`. Shadcn components own control styling and variants. The only local source adjustment to Slider forwards its existing ARIA label props to its generated thumbs, so the width control has an accessible name. No new Slider API is introduced.

```sh
pnpm registry:build
pnpm dev
```

The build writes ignored artifacts into `examples/react/public/r`; Vite serves them under `/r`. `pnpm build` also builds these artifacts into the example site's distribution. No registry has been published publicly.

| Item | Installs |
| --- | --- |
| `@formulate/core` | Core runtime source under `@/lib/formulate`, with RHF, resolver and Zod dependencies. |
| `@formulate/layouts` | Stack and Row, built on the consumer's local shadcn FieldGroup. |
| `@formulate/shadcn` | Connected controls, Field presentation and a configured definition factory, declaring Field/Input/Checkbox/Select as registry dependencies. |
| `@formulate/name` | Reusable first/last name definition, fieldset presentation and all required items. |

In a React 19 + Tailwind 4 consumer with shadcn configured, add this entry to its `components.json`. Use the actual port printed by Vite if 5173 is occupied:

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
