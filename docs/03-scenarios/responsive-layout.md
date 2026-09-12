# Responsive layout: shadcn field groups and grids

[Scenario rubric](README.md) · [Layout and presentation](../03-layout-and-presentation.md)

The [running example](../../examples/react/src/responsive-layout.tsx) puts first and last name on the same row when the form has enough room. A width slider narrows the form independently of the viewport. The fields stack without changing their order or losing edits.

```tsx
import { Field, FieldGroup } from "@/components/ui/field";

const Profile = defineForm({ name: Name, email: Email }, { layout: FieldGroup });

function ProfileForm() {
  const form = Profile.useForm();
  return <Profile.Form form={form} onSubmit={saveProfile}>
    <Profile.Fields />
    <Field orientation="horizontal">
      <button type="submit">Save</button>
    </Field>
  </Profile.Form>;
}
```

`Name` is a reusable section definition with firstName/lastName members. It renders a shadcn FieldSet with a FieldLegend and an inline FieldGroup grid by default. Its fields bind at `name.firstName` and `name.lastName`. The same group can be declared at two different keys without sharing values or DOM IDs.

The locally installed shadcn FieldGroup supplies body spacing directly. Sibling grids use `className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]"` on FieldGroup. Columns have a preferred minimum width of 14rem and can shrink below it when the container itself is narrower. This also works in a sidebar on a wide desktop, without a viewport breakpoint or resize subscription. The [shadcn Field](https://ui.shadcn.com/docs/components/base/field) and [Input](https://ui.shadcn.com/docs/components/base/input) components provide the underlying composition patterns.

FieldGroup can also be supplied to a Page or Section. A caller can replace Name's default grid with `<Profile.Section name="name" layout={FieldGroup} />`, or remove it with `layout={null}`. Name's presentation passes either override through LayoutBody. Layout does not cascade through logical scopes. A page arranges the content it actually renders, even when a section's fields appear across pages.

There are three styling surfaces: container layout, placement of the whole field, and control props. `className` on a field places its label, control and error together. `componentProps.className` reaches Input. shadcn field `orientation` controls label/control arrangement inside one field; it does not create a row of sibling fields.

| Change | Required outcome |
| --- | --- |
| Narrow the form while keeping the viewport wide. | The names stack in first/last order and retain edits. |
| Resize to a phone viewport. | No horizontal page overflow; fields and errors remain readable. |
| Reuse Name at two keys. | Independent values, nested field paths and unique control IDs. |
| Replace the Name grid with FieldGroup or a custom layout. | Same validation and submission shape; only presentation changes. |
| Submit empty names. | Error descriptions remain associated with inputs and focus reaches the first invalid control. |
| Add page navigation or a conditional section. | Existing retention, scope validation and correction behaviour remain unchanged. |

The tests cover independent bindings, defaults and overrides, error associations, focus and submission. The browser acceptance check is fitting the grid to narrow container widths and a 390px viewport. A grid introduces no value or completion scope; completion graphs remain future work. This example demonstrates the shadcn composition baseline; richer examples of reusable layouts remain later work.
