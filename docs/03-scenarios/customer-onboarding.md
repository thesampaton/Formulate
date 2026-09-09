# Customer onboarding

[Scenario rubric](README.md) · [References](../03-references-and-relationships.md)

A customer supplies email, billing address, and delivery address. The Address definition is reused twice; each use has independent values and its own country-to-postcode dependency.

```text
library field Email
  value: email address
  validate: email format

library field Postcode
  input: country
  validate: postcode accepted for country

library section Address
  street = field at street
    control: Input
    placeholder: Enter street address
    validate: required
  country = use Country at countryCode
  postcode = use Postcode at postcode
    country <- country.value

form CustomerOnboarding
  email = use Email at email
  billing = use Address at billingAddress
  delivery = use Address at deliveryAddress

  page Details
    present email, billing, delivery
  page Review
    review email, billing, delivery
  workflow: Details -> Review
  submit: applicable customer details to application
```

Address contains separately bound fields, mixing inline street configuration with library uses. The explicit bindings produce `billingAddress` and `deliveryAddress` objects; visual grouping alone would not. Review reads the same instances. Each address reports completion for its own requirements; Details and the form include both.

| Change | Required outcome |
| --- | --- |
| Change billing country. | Recheck billing postcode only. A rule connecting both addresses belongs to their containing form. |
| Add “delivery is the same as billing”. | Explicitly retain the manual delivery draft, suspend its requirements, and exclude it while enabled. Construct and validate effective delivery from current billing values. Switching off restores and rechecks the manual draft. |
| Split Details into Contact and Addresses. | Preserve field identities, bindings, dependencies, and payload shape. |
| Change billing country after reaching Review. | Recompute affected postcode, address, page, and form completion, including off-screen content. |
| Receive a server email rejection. | Associate it with the submitted attempt and email field; preserve useful address work. |

The application owns customer creation, eligibility, and persistence. An accepted request need not mean onboarding has finished.

**Later API question:** How can a derived payload value such as delivery-from-billing expose its source, validation, and error destination clearly, without introducing another editable field?

## Executable slice — September 2026

The [customer example](../../examples/react/src/compositions/customer.tsx) now implements Details → Review → a local demo creation handler. The model above includes future capabilities; the running example does not expose address, page, or form completion.

- [Address](../../examples/react/src/declarations/address.tsx) is a reusable defineSection declaration. Customer declares billingAddress and deliveryAddress uses, then renders Customer.Section by name. Address.Field and its local watch/trigger helpers inherit each use’s runtime and binding. No per-use control, member map, or postcode callback is required. Sections may contain further sections using the same contract.
- Country changes refresh only that address's postcode error path through an event handler. RHF still evaluates the whole boundary schema; there is no independent requirement executor.
- [The boundary schema](../../examples/react/src/declarations/customer.ts) is supplied through Customer’s schema option, preserving its bound useForm hook and editing types. It validates email, billing, and effective delivery. While delivery comes from billing, the manual draft stays in RHF with its requirements suspended and is excluded from output. Switching back restores the draft and rechecks its requirements.
- Review reads current values. “Edit delivery” focuses billing when billing supplies delivery, otherwise manual delivery. Shared-source validation reports a billing issue once at the editable source path. Final submission trims output and excludes the toggle without changing edits.
- [Five tests](../../tests/customer-onboarding.test.tsx) cover independent dependencies and runtimes, correction focus, retention/restoration, exact derived/separate payloads, and boundary validation without editors. Compile-time checks cover reusable binding paths and output typing.

The postcode checks intentionally support only two demo formats. Programmatic or off-screen changes require an explicit check for immediate error refresh; every final submission revalidates current values. Automatic dependency scheduling and completion propagation, splitting Details into further pages, different delivery-only requirements, and attempt-owned server email errors remain future pressure tests. Creation is application-owned; the demo response does not mean onboarding is complete.
