# @formulate/react

**The workflow composition layer for forms built with shadcn/ui.**

Formulate aims to make complex forms easier to assemble and change by composing fields, sections, layouts, and behaviour together. Validation, conditional UI, dependent choices, navigation, and submission should fit into the same model, with reusable parts carrying their internal wiring into each form that uses them.

A deployment-target section, for example, can bring together shadcn account and region controls, their layout, and the rule that loads regions when the account changes. Reuse that interaction in an application settings screen, an onboarding flow, or a branching provisioning form. You keep control of the component source, domain rules, and application services. React Hook Form and Zod provide the default state and validation engines.

The current implementation provides reusable definitions and layouts, dependent choices, scoped actions, and error navigation. Automatic rules for which sections apply and when a workflow is complete are still being designed. Today, application code decides which branches to show, tracks completion, and saves drafts. The [product vision](../../docs/01-product-vision.md) describes the direction, and [current capabilities](../../docs/05-06-rendering-and-workflow.md) records what is implemented.

This is an experimental, private workspace package for React 19.2+, React Hook Form 7.87+, and Zod 4. To try it, [run the examples](../../README.md#run-the-examples). To use the source in another project, follow the [registry guide](../../docs/registry-development.md).

## Compose your first form

Start with the [local shadcn setup](../../docs/registry-development.md): the `shadcn-bindings`, `layouts`, and `actions` registry items provide the imports below. They are already present in the example app. Declare each field’s validation, starting value, and control, then compose them with a layout and an action:

```tsx
import { defineForm } from "@/lib/formulate-config";
import { Stack } from "@/components/formulate/layouts";
import { FormSubmitButton } from "@/components/formulate/form-actions";
import { z } from "zod";

const Contact = defineForm({
  email: {
    schema: z.email(),
    defaultValue: "",
    label: "Email",
    component: "input",
    componentProps: { type: "email" },
  },
}, { layout: Stack });

export function ContactForm({ onSave }: {
  onSave: (values: { email: string }) => void | Promise<void>;
}) {
  const form = Contact.useForm();

  return (
    <Contact.Form form={form} onSubmit={onSave}>
      <Contact.Fields />
      <FormSubmitButton pendingLabel="Saving…">Save contact</FormSubmitButton>
    </Contact.Form>
  );
}
```

`defineForm` creates a reusable definition. `Contact.useForm()` creates the values and state for one mounted form. `Contact.Fields` renders its fields in declaration order, with labels and validation messages.

Fields validate on blur by default. Submitting checks the whole form and calls `onSave` with the accepted values. Each use of `ContactForm` has independent state. Keep the definition outside the component so its field components remain stable while the user edits.

The configured `input` uses your local shadcn Input and field markup. `Stack` supplies the layout, and `FormSubmitButton` shows pending state while the form validates and saves. These components remain editable application source.

For reuse, `defineField({ primitive: "text", schema: z.email(), defaultValue: "", label: "Email", component: "input", componentProps: { type: "email" } })` creates an `Email` definition. Then declare `email: field(Email)` using `field` from your local control-map configuration. Reusable fields work in both `defineForm` and `defineSection`; presentation and control overrides do not replace their schemas. The optional `@formulate/common-fields` source item supplies eight starting definitions. See [semantic fields, primitive types and overrides](docs/fields-and-sections.md#reuse-a-semantic-field).

## Arrange and customise fields

Replace `<Contact.Fields />` with individual fields when you want to choose their order, layout, or presentation:

```tsx
<Contact.Field
  name="email"
  description="We’ll send your receipt here."
  componentProps={{ placeholder: "you@example.com" }}
/>
```

The field keeps its declared validation and starting value. Its `name` is checked against the definition, and its value comes from the enclosing `Contact.Form`.

Compose the supplied `Stack` and `Row` layouts, or write a layout with your own shadcn components. `Form`, `Section`, and `Page` accept a `layout` component that receives their children; ordinary React wrappers also work. A field’s `className` styles its outer wrapper; `componentProps.className` styles its control.

You can also supply initial values when the form is created:

```tsx
// Inside ContactForm, in place of Contact.useForm():
const form = Contact.useForm({
  defaultValues: { email: "person@example.com" },
});
```

Other fields keep their declared defaults. Supplied objects and arrays replace that field’s default as a whole. For later updates, use the returned form’s React Hook Form methods, such as `form.reset(values)`.

See [fields and sections](docs/fields-and-sections.md) for defaults, cross-field validation, layouts, and explicit bindings.

## Reuse a section

Use `defineSection` when several fields belong together. Here, billing and delivery addresses share one definition:

```tsx
import { defineForm, defineSection } from "@/lib/formulate-config";
import { Stack } from "@/components/formulate/layouts";
import { z } from "zod";

const Address = defineSection({
  street: {
    schema: z.string().min(1, "Enter a street address."),
    defaultValue: "",
    label: "Street",
    component: "input",
  },
  city: {
    schema: z.string().min(1, "Enter a city."),
    defaultValue: "",
    label: "City",
    component: "input",
  },
}, { title: "Address", layout: Stack });

const Checkout = defineForm(
  { billing: Address, delivery: Address },
  { layout: Stack },
);
```

Create the form with `Checkout.useForm()`. Inside its `<Checkout.Form>`, render both sections:

```tsx
<Checkout.Section name="billing" title="Billing address" />
<Checkout.Section name="delivery" title="Delivery address" />
```

Each section has separate values: `billing.street`, `delivery.street`, and so on. Sections can contain other sections using the same API. A plain `<Section>` wrapper only groups presentation; declaring a section inside `defineForm` creates the nested value structure shown here.

A section can also carry its own presentation and dependent-choice rules. Reusing it carries those connections with it; each form chooses where to place it and how to use it. See [reusable sections and custom layouts](docs/fields-and-sections.md) for those patterns.

## Dependent choices

Reuse behaviour alongside the fields it governs. When one answer determines another field’s available options—for example, an account determines its regions—declare that relationship with `defineChoice`.

Attach the rule to the field’s `choices` property, then create the form with `Definition.useChoiceForm({ services })`. The definition supplies the dependency and selection rules; your services load the options; your control displays them. Ordinary `Definition.useForm()` applies the schema without starting these requests.

The [dependent choices guide](docs/dependent-choices.md) walks through account and region fields, loading feedback, retry, and repeated sections.

## Add pages when the experience needs them

Keep one form mounted while the user moves between pages. There are two parts to the setup:

- `useFormNavigation` tracks the current page and provides `goToPage`, `goToField`, and `goToFirstError`.
- The `scopedAction` prop on `Form` tells a Continue action which errors must be clear before calling `onValid`. On the final page, omit it to validate and submit the whole form.

A `<Page>` shows its content when `active` is true. Its visibility does not remove fields from validation. Error navigation can open the right page and focus a field that needs attention.

Use `useFormActionStatus()` inside the form for buttons that should stay disabled during either a Continue check or final submission.

Follow the [two-page form guide](docs/navigation-and-validation.md) for a complete example, including error focus and pending buttons.

## Own and customise the shadcn components

Formulate follows shadcn’s editable source model: controls, field markup, layouts, and action components live in your application. The local control map connects declaration keys such as `input` and `select` to those components. Change their appearance or adapt their props while keeping the form’s bindings and rules.

The [custom controls guide](docs/custom-controls.md) covers `createFormulate`, local adapters, composition, and styling. The [example control map](../../examples/react/src/lib/formulate-config.ts) is the starting point used above.

## Find a working example

| Build this | Example |
| --- | --- |
| A simple form | [Sign in](../../examples/react/src/compositions/sign-in.tsx) |
| Reusable layouts and conditional fields | [Responsive layout](../../examples/react/src/responsive-layout.tsx) and [advanced settings](../../examples/react/src/compositions/request-settings.tsx) |
| Reuse sections in different forms | [Employee onboarding](../../examples/react/src/compositions/employee-onboarding.tsx) and [internal transfer](../../examples/react/src/compositions/internal-transfer.tsx) |
| A form with tabs and a review page | [Multi-page profile](../../examples/react/src/compositions/multi-page-form.tsx) |
| Branching pages with dependent options | [Cloud deployment](../../examples/react/src/compositions/cloud-deployment.tsx) |
| Repeated sections and draft save/restore | [Infrastructure](../../examples/react/src/compositions/infrastructure.tsx) |

For the current support boundaries and design decisions, see [rendering and workflow](../../docs/05-06-rendering-and-workflow.md). For contribution conventions, see [naming and readability](../../docs/naming-and-readability-audit.md).

The public entry point is `src/index.ts`. Package builds emit ESM and TypeScript declarations; the source registry distributes the same runtime under `@/lib/formulate`.

Structured objects/arrays and compound pickers use `useCompoundFieldBinding`; see the [control guide](docs/custom-controls.md#structured-values-and-compound-pickers) for focus, logical blur, portals, styling slots and heading conventions. The optional `@formulate/pickers` registry item supplies bindings over local shadcn components.
