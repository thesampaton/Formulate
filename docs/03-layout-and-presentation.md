# Part 3 Reference — Layout and Presentation

[Back to the mental model](03-mental-model.md). This reference develops styling, order, and focus responsibilities. The [responsive-layout example](03-scenarios/responsive-layout.md) applies them with ordinary CSS.

**Layout arranges existing content.** It is optional presentation configuration on a form, page, section, or plain wrapper; it adds no data or completion scope.

## Implemented composition API

A layout is a module-level React component accepting `children`. The same component can be supplied to `Form`, `Page`, or `Section` using `layout={FieldGroup}`, or reused directly around a few children. Layouts arrange each container's body; Page and Section headings and descriptions stay outside it. Form submission errors stay outside the form body layout.

```tsx
import { Field, FieldGroup } from "@/components/ui/field";

const Customer = defineForm({ name: Name, email: Email }, { layout: FieldGroup });

function CustomerForm() {
  const form = Customer.useForm();
  return <Customer.Form form={form} onSubmit={saveCustomer}>
    <Page pageId="details" title="Details" layout={FieldGroup}>
      <Customer.Section name="name" />
      <Customer.Field name="email" />
      <Field orientation="horizontal">
        <button type="submit">Save</button>
      </Field>
    </Page>
  </Customer.Form>;
}
```

`defineForm` supplies its default to `Definition.Form`. A plain `Form` uses only its own `layout` prop; `Definition.Fields` continues to render ordered members without a wrapper. `defineSection` supplies its default to each `Definition.Section` or `Bind` use. An explicit layout replaces the definition default; `layout={null}` removes it. Parent layouts arrange their direct children and do not become implicit defaults for descendants.

Custom section renderers receive `{ title, layout }` and forward the layout to a Section or `LayoutBody`. Explicit section children replace the full presentation and are wrapped in the selected layout. Declare layout components at module scope; creating a new component type during render can remount its fields. Responsive CSS changes preserve the mounted controls and focus.

The examples use the locally installed shadcn `FieldGroup` directly for body spacing and apply CSS grid classes where sibling fields share a line:

```tsx
<FieldGroup className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
  <Customer.Field name="name.firstName" />
  <Customer.Field name="name.lastName" />
</FieldGroup>
```

This grid fits columns to the actual container, including a narrow panel on a wide screen. The 14rem preferred minimum can shrink to the container's width. Reading and Tab order follow JSX order. Horizontal shadcn `Field` groups arrange action buttons. These arrangements need no additional Formulate layout components. See [shadcn Field](https://ui.shadcn.com/docs/components/base/field) and [Input composition](https://ui.shadcn.com/docs/components/base/input).

The [Name definition](../examples/react/src/declarations/name.tsx) is a reusable group of fields using the existing section binding contract and shadcn `FieldSet`/`FieldLegend`. Its custom presentation supplies an inline `FieldGroup` grid by default and uses `LayoutBody` for a caller's replacement or `null` override. A grid alone adds no binding; declaring `name: Name` supplies `name.firstName` and `name.lastName`. Reusing the definition at another key creates independent values and IDs. No separate field-group entity is needed.

Field `orientation` is a separate concern: shadcn uses it to arrange the label and control *inside one field*. It does not place sibling fields next to each other. The local configured `fieldPresentation` uses shadcn Field, FieldContent, FieldLabel, FieldDescription and FieldError while Formulate retains binding, error IDs and focus refs. [shadcn Field](https://ui.shadcn.com/docs/components/base/field).

## Styling targets

| Target | Responsibility |
| --- | --- |
| **Container** | Ordered children, classes/styles, grid or flex layout, spacing, and alignment. Arranges the presentations it renders. |
| **Child placement** | The span, width, or alignment of a field/section's outer presentation within its container. |
| **Renderer / control** | Supported props and slots: placeholder, variant, control class, trigger, label, help, and error styling. Owns its internal markup and interaction. |

These are configuration targets, not mandatory wrapper elements. A field's column span includes its label and error; Input padding belongs to the control interface. The rendering contract must make prop destinations clear.

Use existing stylesheets, utility classes, CSS Modules, grid, flexbox, and responsive rules. A visual row needs no semantic Section. Ordered React children can supply the sequence without a second declaration or presentation list.

A section split across pages keeps its fields and relationships, but each page arranges its rendered content. The section's default grid cannot position controls across unrelated pages.

## Reading and keyboard order

Render content in its intended logical sequence, preserving field and repeated-item identities. CSS positioning alone does not change normal reading or sequential focus order. Reorder the source when the intended sequence changes. [CSS Grid accessibility](https://www.w3.org/TR/css-grid-1/#order-accessibility).

Use ordinary control keyboard behaviour and a meaningful sequence that also works when columns stack. Avoid a separate positive-`tabindex` ordering system. [HTML tabindex](https://html.spec.whatwg.org/multipage/interaction.html#the-tabindex-attribute), [W3C focus-order guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html).

Pickers, radio groups, and tabs own their internal arrow-key and focus behaviour. One logical field can contain multiple keyboard stops.

## Focus requests

Initial and error focus use a [field reference](03-references-and-relationships.md). The renderer resolves it to an Input, Select trigger, or appropriate subcontrol. Focusing a control does not choose its answer; defaults and text selection are separate control concerns.

| Situation | Responsibility |
| --- | --- |
| **Deliberate entry** | Consider the preferred field, meaningful heading, or restoration target when content is ready. |
| **Validation, async updates, resizing** | Preserve current focus. Do not repeat initial focus on every update or remount. |
| **Return navigation** | Restore an available target or use an explicit fallback. |
| **Error correction** | Choose an editable presentation, navigate and reveal it, wait for its control, then request focus. |

Page preferences must respect the chosen presentation. Activating a tab does not automatically move focus into its first input. [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/#keyboardinteraction).

A review view cannot substitute for an editable correction target. If a condition removes the focused control, provide a reachable fallback such as its disclosure control. Cancel a late focus request when the user has navigated elsewhere.

## Classes, selectors, and state hooks

Expose supported classes/slots and documented state attributes for container, field, label, help, error, and popup surfaces. Completion/error attributes reflect the [shared state](03-state-and-completion.md); they do not set it. Native and ARIA attributes must retain their proper semantics.

CSS follows the actual DOM and cascade. Logical sections do not create CSS isolation. Portalled popups need supported styling hooks rather than assumed descendant selectors. Shared classes can style many independent uses.

Logical field identities, CSS classes, and DOM IDs have separate purposes. Repeated uses and multiple mounted presentations need unique control IDs with correct label/help/error associations. Behavioural conditions use logical references rather than selectors.

Hiding with CSS does not change applicability, validation, retention, or inclusion in submission. Custom presentations must still let users reveal applicable content for correction.

## Reuse and overrides

Library fields can supply control defaults; reusable form/section definitions and ordinary page components can supply layout defaults. Callers adapt each use through the appropriate target. The `layout` prop replaces the default component; CSS classes still follow the cascade, and appending a class does not guarantee an override.

A replacement renderer accepts only its supported props and slots. Adapting Input to a compound picker may require changing props while preserving the value contract. Prop forwarding must preserve value binding, change/blur coordination, accessible associations, and focus integration.

The [pressure tests](03-mental-model-pressure-tests.md) capture layout invariants. Keyboard and focus outcomes still need verification in rendered prototypes.

## Inherited page layouts

The [multi-page form](../examples/react/src/compositions/multi-page-form.tsx) sets `pageLayout={FormStepLayout}` on FormTabs. Nested FormTabPage components inherit it and pass only their title, content and differences. The layout receives content through children and obtains page order, navigation and optional action overrides through `useFormPage()`. A local `layout` or `layout={null}` follows the existing replacement contract. This is reusable composition over the existing Page layout API; it adds no core layout syntax.
