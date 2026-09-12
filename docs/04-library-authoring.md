# Part 4 Reference — Defining a Library

[Back to Part 4](04-registry.md) · [Primitive catalogue](04-registry-catalogue.md) · [Entity shapes](04-entity-shapes.md)

**A library is a collection of reusable definitions built with Formulate's primitives.** Start with source exports that work in an application. A registry can distribute those exports individually or in useful groups.

The first two steps below use the implemented field and section API. Later sketches include proposed page references, requirements, and publication contracts; see the [package guide](../packages/react/README.md#reuse-a-section) for the executable scope.

## 1. Define a field

`defineField` packages primitive semantics, a Zod schema, an editing default and presentation defaults. The control name is portable; consuming forms resolve it through their local map. Metadata can use the existing Zod schema metadata API.

```ts
import { defineField } from "@/lib/formulate";
import { z } from "zod";

export const Email = defineField({
  primitive: "text",
  schema: z.email().meta({ description: "A contact email address." }),
  defaultValue: "",
  label: "Email",
  component: "input",
  componentProps: { type: "email", autoComplete: "email" },
});
```

The schema defines editing values, emptiness and validation; this Email starts empty but requires a valid email for submission. Derive a new `defineField({ ...Email, schema: ... })` to change validation. Instance label/control overrides preserve those rules. Automatic presence adaptation and runtime metadata inspection remain proposed. The source-owned [common fields](registry-development.md#common-fields) and application-authored fields use the same helper.

## 2. Compose a section

`defineSection` creates a reusable group with local members. Use `field` from the same configured control map to instantiate a reusable definition; existing inline declarations remain valid.

```ts
import { defineSection, field } from "@/lib/formulate-config";

export const ContactDetails = defineSection({
  name: {
    primitive: "text", schema: z.string().min(1), defaultValue: "",
    label: "Name", component: "input",
  },
  email: field(Email, { label: "Work email" }),
}, { title: "Contact details" });
```

Each member key supplies its default local binding and reference. Declaration order supplies default presentation order. The caller can arrange those references differently while preserving membership and rules.

Members may also be section uses. For example, CustomerDetails can contain ContactDetails and two independent Address uses; Address can itself contain further sections. These are all sections. “Subsection” is an optional name for that parent-child relationship, and any future alias or convenience helper must use the same section contract. The parent supplies each child's binding; adding a visual nesting level alone does not add a payload object.

Two uses of ContactDetails have independent values and connections:

```text
form Customer
  requesting = use ContactDetails at contacts.requesting
  billing = use ContactDetails at contacts.billing
```

The explicit bindings create the two payload objects. A Section used only for grouping does not automatically add an object to form data.

## 3. Define a page using existing members

A reusable page can accept section or field references as inputs. It presents those instances and uses their requirements for its completion scope.

```text
define page ContactPage
  input: contact (reference to a ContactDetails section)
  content: present contact
  completion: contact requirements
  navigation port: continue

form Registration
  contact = use ContactDetails at contact
  page Details = use ContactPage
    contact <- contact
    continue -> Review
  page Review
    review contact
```

The host connects navigation. A page can also declare its own local members when the whole composition should travel together. Both forms use the same Page contract.

## 4. Export the library

Ordinary TypeScript exports are sufficient for local consumption:

```ts
// library/index.ts
export { Email } from "./email"
export { ContactDetails } from "./contact-details"
export { ContactPage } from "./contact-page"
```

The conceptual library shape is:

```text
library ContactLibrary
  exports: Email, ContactDetails, ContactPage
  requirements: compatible Formulate primitives and validation/rendering adapters
  documentation: setup, public inputs, configuration, examples
  examples: direct contact form, two independent sections, paginated registration
  optional distribution: registry items or a package
```

A library introduces no form state or runtime scope. A `defineLibrary` helper is unnecessary unless we later find useful work for it, such as deriving publication metadata. The exported definitions remain usable individually.

The direct form example connects the section to an application handler:

```text
define form ContactForm
  capability: saveContact
  contact = use ContactDetails at contact
  submit: included values -> saveContact

application:
  use ContactForm
    saveContact <- application.saveContact
```

## 5. Describe the library's installable items

When a library is distributed through `@acme`, its item dependencies describe how it builds on Formulate:

| Proposed item | Export | Direct source dependencies |
| --- | --- | --- |
| `@acme/email` | Email | `@formulate/field`, plus its selected renderer source. |
| `@acme/contact-details` | ContactDetails | `@formulate/section`, `@formulate/field`, `@acme/email`, plus the inline name renderer. |
| `@acme/contact-page` | ContactPage | `@formulate/page`, `@acme/contact-details`. |

Each manifest also declares the files it installs and any npm dependencies those files import. The [distribution sketch](04-registry-distribution.md) shows a standard item. Other entries in `@acme` can use completely different libraries; Formulate is a dependency of the items that compose with it.

## Adding domain services

A more specialised definition declares what the caller must supply:

```text
define field EmployeePicker
  value: employee reference or empty
  input: organisationId
  service: directory (search, resolve selection, check eligibility)
  renderer: employee picker
  validate: selected employee is eligible in the current organisation

caller:
  manager = use EmployeePicker at manager
    organisationId <- organisation.value
    directory <- application.employeeDirectory
```

The library keeps its internal rules and wiring. The application supplies the service implementation and permissions. A runnable example can provide fixture services so a developer or v0 can try the composition before connecting production services.
