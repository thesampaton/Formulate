# Customer onboarding

[Scenario rubric](README.md)

Customer onboarding is an original Part 9 hero scenario. This proposed example tests the mental model; it is neither a complete onboarding design nor a published API.

A customer supplies an email address, billing address, and delivery address before reviewing the request. The important distinction is between the reusable Address definition and its two independent uses. Each use brings its country-to-postcode dependency with it. The form should not rebuild that relationship or teach the section where the other address lives.

The notation below is illustrative plain text. Country is a reusable library field; street is configured inline against a local shadcn Input. Email packages its value contract, presentation defaults, and email validation. Address exposes separately addressable fields because callers need to place, validate, and reference them individually.

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

Inline `field` directly declares an instance; no named definition or registry entry is required. It has the same binding, state, and completion model as `use Email`. Extracting street into a library later preserves each use's identity, values, configuration, and rules. Reusable sections can contain either style.

The bindings explicitly produce `billingAddress` and `deliveryAddress` objects. Their visual grouping does not produce those objects implicitly. Review reads existing instances without duplicating field instances or their requirement counts. Reading that page is not acknowledgement; declare an explicit requirement if acknowledgement is needed. Each running form has its own values and errors. Details and Review have logical page identities that do not depend on their paths or tab labels.

**Completion and state:** each field exposes its current validation and completion; billing and delivery each aggregate their own applicable members. Details checks its assigned fields and requirements. The form checks all applicable requirements, including any explicit review requirement. Completion can regress after an edit and is independent of whether a field was touched, a page visited, or a request saved or accepted. Form state survives page navigation and unmounting.

| Proposed change | Invariant expectations |
| --- | --- |
| Change only the billing country. | Only billing postcode is rechecked against that country. Delivery values, errors, and dependencies remain independent. Any rule linking the addresses must be declared by their containing form. |
| Add “delivery is the same as billing”, then switch it off again. | Declare the policy explicitly: retain the manual delivery draft, suspend its requirements, and exclude it while the option is active. Construct and validate the effective delivery address from current billing values. Switching off restores and rechecks the manual draft. No competing instances bind to the same value. |
| Split Details into Contact and Addresses, then reject the submitted email on the server. | Moving presentations preserves identities, bindings, and payload shape. The rejection identifies the relevant attempt and email field; useful address work remains available even when its page is off-screen. |
| Complete Addresses, visit Review, then change billing country on a routed or tabbed page. | Recompute the affected postcode, address, page, and form completion. Navigation keeps the same values and errors; a full document reload restores a persisted draft and re-evaluates requirements. |

Formulate coordinates applicable input, validation, review, and submission feedback. The application owns customer creation, eligibility decisions, and persistence. Acceptance means the application accepted this request; it need not mean every onboarding operation has finished.

**Open design question:** How should an action declare a derived payload value, such as delivery-from-billing, so its source, validation, and error destination remain obvious without creating another editable field instance?
