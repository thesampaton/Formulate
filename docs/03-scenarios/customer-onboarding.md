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
