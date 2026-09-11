# Fields and sections

Start with the [README's first form](../README.md), then use this guide to reuse declarations, add form-wide rules, and arrange larger forms.

## Reuse a field declaration

A declaration is ordinary configuration. Keep it at module scope and create a new object when changing it for another use. Each member key gets its own value and binding.

```tsx
import { defineForm } from "@formulate/react";
import type { InputControlProps } from "@formulate/react";
import { z } from "zod";

const Email = {
  schema: z.email(),
  defaultValue: "",
  label: "Email",
  component: "input" as const,
  componentProps: { type: "email" } satisfies InputControlProps,
};

const Confirmation = defineForm({
  email: Email,
  confirmEmail: { ...Email, label: "Confirm email" },
}, {
  schema: (schema) => schema.refine(
    (values) => values.email === values.confirmEmail,
    { path: ["confirmEmail"], message: "Email addresses must match." },
  ),
});
```

`as const` keeps the component name specific; `satisfies` checks the extracted props. The `schema` callback adds the matching-email rule to every use of `Confirmation.useForm()`, including when an editor is hidden or has never mounted.

## Keep editing values separate from submission output

The schema callback must continue accepting the complete declared editing shape. It can add rules or transform the submission result. Fields and defaults use `z.input<typeof Definition.schema>`; `onSubmit` receives `z.output<typeof Definition.schema>`.

For example, this field edits a string and submits a number:

```tsx
const Booking = defineForm({
  guests: {
    schema: z.string().regex(/^\d+$/, "Enter a whole number.")
      .transform(Number).pipe(z.number().int().min(1)),
    defaultValue: "1",
    label: "Guests",
    component: "input",
    componentProps: { inputMode: "numeric" },
  },
});
```

Parsing does not replace the values in the editors. Defaults may intentionally start invalid, but must match the editing type: the built-in input needs a string, so use `""` for an empty input. An optional value needs an adapter that supports it.

Both `.schema` and `.defaultValues` are available on a definition. For a schema built independently, use `useFormulate({ schema, defaultValues })`. Changing a schema outside a definition does not change that definition's `useForm` hook.

## Prefill and reset a form

Static `defaultValues` override only the supplied top-level fields:

```tsx
function usePrefilledConfirmation() {
  return Confirmation.useForm({
    defaultValues: { email: "person@example.com" },
  });
}
```

Here, `confirmEmail` keeps its declared empty default. A supplied object or array replaces that field's entire default; nested values are not merged. Explicit `""`, `false`, `0`, `null`, and `undefined` are overrides when the editing type allows them.

These values become the initial/reset baseline. Rerenders and editor remounts do not reapply them. Use RHF's `form.reset(nextValues)` or reactive `values` option for later updates.

This merge also applies to `useFormulate(Definition, options)` and `Definition.useChoiceForm`. Schema-first defaults and async default loaders use RHF's replacement behavior: return the complete desired record from an async loader, and wait for `form.formState.isLoading` to become false before rendering its editors.

## Arrange fields without changing their data

`Definition.Fields` renders members in declaration order. Place individual `Definition.Field` and `Definition.Section` components yourself for another arrangement. `Field` accepts field keys; `Section` accepts section keys.

`Form`, `Page`, and `Section` accept a `layout` component that receives `children`. Define layouts at module scope to keep their identity stable:

```tsx
import type { ReactNode } from "react";

function Stack({ children }: { children?: ReactNode }) {
  return <div className="form-stack">{children}</div>;
}

const Contact = defineForm({ email: Email }, { layout: Stack });
```

Use `<Contact.Form>` to apply that default layout; plain `<Form>` does not infer it. A particular use can replace it with `layout={OtherLayout}` or remove it with `layout={null}`. Layouts arrange the body; headings, descriptions, and form submission errors remain outside. Child sections and pages choose their own layouts, and `Fields` adds no wrapper.

Field labels, descriptions, wrapper props, and declared `componentProps` can be overridden at the render site. Control props merge shallowly, so an override such as `componentProps={{ className: "wide" }}` replaces the declaration's class string. See [custom controls](custom-controls.md) for child composition and styling.

## Reuse a group of fields

`defineSection` groups declarations into a nested object. In this example, the same address fields edit `billing.street` and `delivery.street` independently:

```tsx
import { defineSection } from "@formulate/react";

const Address = defineSection({
  street: {
    schema: z.string().min(1, "Enter a street address."),
    defaultValue: "", label: "Street", component: "input",
  },
  postcode: {
    schema: z.string().min(1, "Enter a postcode."),
    defaultValue: "", label: "Postcode", component: "input",
  },
}, { title: "Address" });

const Customer = defineForm({ billing: Address, delivery: Address });

function CustomerForm() {
  const form = Customer.useForm();
  return <Customer.Form form={form} onSubmit={console.info}>
    <Customer.Section name="billing" title="Billing address" />
    <Customer.Section name="delivery" title="Delivery address" />
    <button type="submit">Save</button>
  </Customer.Form>;
}
```

The default presentation renders a `Section` heading and its members. Its title comes from the use, the definition, or the member name, in that order. A plain `<Section title="Address">` is only a visual group and creates no nested value.

For deeper nesting, declare another section, such as `const Details = defineSection({ address: Address })`, then use it in `defineForm({ details: Details })`. Its leaf paths become `details.address.street` and `details.address.postcode`.

## Add local presentation and behavior

A section can set `presentation: AddressFields` in its options. This component extends the `Address` declaration above; add `Section` and `SectionPresentationProps` to the package imports:

```tsx
function AddressFields({ title, layout }: SectionPresentationProps) {
  const postcode = Address.useWatch("postcode");
  const trigger = Address.useTrigger();
  return <Section title={title} layout={layout}>
    <Address.Fields />
    <button type="button" onClick={() => void trigger("postcode")}>
      Check postcode
    </button>
    <p>Current postcode: {postcode || "Not entered"}</p>
  </Section>;
}
```

Local hooks resolve names against the nearest matching section use. `useWatch` reads editing values; `useTrigger` returns a check for local paths; `useChoice` reads a declared dependent choice. Call them in components below that section's `Section` or `Bind` and the owning `Form`. Triggering named paths still runs the full resolver; it refreshes the requested errors. Programmatic changes need an explicit trigger for immediate error refresh.

Forward `layout` from a custom presentation to `Section` or `LayoutBody`. Passing children to a particular section use replaces its full presentation, including the heading; those children are wrapped in the selected layout. Nested placement works the same way: inside `<Registration.Section name="details">`, render `<Details.Section name="address" />` when `Registration` declares `details: Details`.

## Bind a section for navigation or a different data shape

`const delivery = Customer.bindSection("delivery")` captures a declared use. Render `<delivery.Section />` inside `Customer.Form`, or pass `delivery` as an action or navigation `scope`. The definition caches this object and its component.

Its `errorPaths` contains the section object path, including errors on that object. Its ordered `focusPaths` contains the leaf editors. `resolveFieldPath("street")` returns `"delivery.street"`; `resolveChoiceId` resolves a local choice ID; `focusFirstField(form)` focuses the first editor after your application reveals it. A definition's `fieldPaths` lists its unbound leaf paths. Your application still chooses which page contains the section.

For a form with a different shape, map each local member to a host path. This example uses the `Address` declaration above; import `Form` and `useFormulate`, plus `SectionPathMap` with `import type`, from the package:

```tsx
const hostSchema = z.object({
  shippingStreet: Address.schema.shape.street,
  postalCode: Address.schema.shape.postcode,
});
type HostValues = z.input<typeof hostSchema>;
const bindings = {
  street: "shippingStreet", postcode: "postalCode",
} satisfies SectionPathMap<z.input<typeof Address.schema>, HostValues>;

function ShippingForm() {
  const form = useFormulate(hostSchema, {
    defaultValues: { shippingStreet: "", postalCode: "" },
  });
  return <Form form={form} onSubmit={console.info}>
    <Address.Bind control={form.control} bindings={bindings} />
    <button type="submit">Save</button>
  </Form>;
}
```

Mappings must support both reading and writing: a string editor cannot bind to a boolean, optional string, or narrower string literal. Nested section members can map to compatible objects. `Bind` maps editors only; compose their validation into the host schema, as above.

When a map also drives choices or navigation, create `Address.bind<HostValues>({ id: "shipping", bindings })` and pass it as `binding` to `Address.Bind`. That descriptor shares `errorPaths`, `focusPaths`, path/focus helpers, and `bindChoices({ values, services })`. Repeated items need stable unique IDs from their data, even when their array paths change. See the [repeated resource example](../../../examples/react/src/declarations/infrastructure.ts).

## Choose context or an explicit control

Use a definition's `Field` to check field names against its editing shape. Plain `Field` reads the enclosing form at runtime, but React context cannot infer that parent's generic type into JSX children. It still checks component names and props.

For a standalone plain field, pass `control={form.control}` to retain name and value checks. This also explicitly chooses which form it edits; the enclosing `Form` continues submitting its own runtime. Root definition fields accept a control override; section fields inherit the control from their section use. Use definition fields with the matching definition's runtime. Without a form context or explicit control, a field throws an error.

The component that creates a `Form` can use ordinary RHF hooks with its explicit `form.control`. Definition hooks belong below the provider. Keep the form hook mounted above pages or other hidden React Activity boundaries so its subscriptions and validation remain active.
