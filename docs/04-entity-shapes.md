# Part 4 Reference — Initial Entity Shapes

[Back to Part 4](04-registry.md) · [Primitive catalogue](04-registry-catalogue.md) · [Library authoring](04-library-authoring.md)

**These are provisional records assembled by Formulate's primitive authoring helpers.** The [library guide](04-library-authoring.md) shows the author-facing mechanism; these TypeScript-like sketches explore the resulting contracts. Names such as `ValueContract`, `FieldRef`, and `Content` stand for later APIs.

| Primitive item | Proposed helper | Reusable output |
| --- | --- | --- |
| `@formulate/field` | `defineField` | `FieldDefinition` |
| `@formulate/section` | `defineSection` | `SectionDefinition` |
| `@formulate/page` | `definePage` | `PageDefinition` |
| `@formulate/form` | `defineForm` | `FormDefinition` |

A library exports a collection of these definitions. A registry item distributes their source and dependencies. Instantiating a definition supplies runtime identity, bindings, and connections. Direct authoring should infer the corresponding structure while meeting the [simple-form budget](03-scenarios/simple-form.md).

## Shared definition shape

```ts
type Definition<Kind, Body> = {
  kind: Kind
  meta: {
    title: string
    description?: string
    tags?: string[]
  }
  inputs?: InputContracts
  capabilities?: CapabilityContracts
  body: Body
}
```

`inputs` describe outside data the definition needs, including whether absence is supported. `capabilities` describe application operations it needs. A value/reference connection and a service implementation are supplied at use time. Internal references resolve relative to that use; definitions cannot reach into an assumed caller path.

Source address, release, exported symbol, and compatibility requirements belong to the [distribution metadata](04-registry-distribution.md). Definition metadata explains meaning. It contains no selected values, lookup results, errors, or completion flags. Shared definition objects should be treated as immutable.

| Placeholder | Intended meaning |
| --- | --- |
| `ValueContract<Editing, Accepted>` | Editing-value type, empty-value semantics, validation/parsing into an accepted result, and inspectable meaning where available. Zod is the default adapter. |
| `InputContracts` / `InputConnections` | Typed named ports / connections to constants or observable values and state. Required unresolved inputs remain unresolved. |
| `CapabilityContracts` / `CapabilityConnections` | Typed operation requirements / supplied application implementations. No credentials or implicit global client. |
| `FieldRef<T>`, `SectionRef`, `RequirementRef` | Logical references scoped to a use; independent of labels, routes, DOM IDs, or current array index. |
| `RuleUse` | A rule connected to its typed inputs and issue targets, declared once. A scope can reference its requirement without copying the rule. |
| `Content` | Ordered presentations of existing references, ordinary content, and action controls; exact React/portable representation is open. |
| `MemberDeclarations` | Locally owned field/section uses, including repeat declarations. These supply references for rules and presentation. |

## Field: one value contract

```ts
type FieldDefinition<Editing, Accepted> = Definition<"field", {
  value: ValueContract<Editing, Accepted>
  checks?: RuleUse[]
  choices?: DataSourceConnection
  defaults: {
    label?: string
    help?: string
    presence?: "optional" | "required"
    renderer: RendererRef<Editing>
    rendererProps?: SupportedRendererProps
  }
  handling?: {
    sensitivity?: "ordinary" | "sensitive"
    review?: "display" | "redact"
    draft?: "application-policy" | "omit"
  }
}>
```

The value contract specifies an empty value and how a non-empty value is checked. Presence is a separate requirement; a basic Email can be optional in one form and required in another. A domain definition may require presence as part of its documented contract. Choosing “optional” does not make a non-empty malformed answer valid.

Editing and accepted output are distinct when needed: an incomplete phone number remains editable while its accepted output follows a declared format. Validation must not silently rewrite stored values. A normalisation operation or submission conversion needs an explicit boundary. An optional empty value follows its declared output policy; it does not manufacture an accepted domain value.

Issues can target a part of a structured value, such as `DateRange.end`, without creating another field. A renderer changing from two controls to one preserves that ownership boundary.

An illustrative use record:

```ts
type FieldUse<Editing, Accepted> = {
  key: LocalKey
  definition: FieldDefinition<Editing, Accepted> | InstalledDefinitionRef
  bind?: ValueBinding<Editing>
  initial?: Editing
  inputs?: InputConnections
  capabilities?: CapabilityConnections
  configure?: {
    label?: string
    help?: string
    presence?: PresenceRequirement
    addChecks?: RuleUse[]
    renderer?: RendererRef<Editing>
    rendererProps?: SupportedRendererProps
  }
  relationships?: RelationshipUse[]
}
```

For direct fields, `key` can supply both identity and the default binding. `bind` expresses a deliberate different location. Runtime identity is resolved once for that use; it must not be recomputed from a changing array index or presentation path. `initial` seeds a new use and must not reset its current value when a control remounts.

### Configuration composition

| Configuration | Proposed behaviour |
| --- | --- |
| Label/help and supported renderer props | Instance configuration overrides the definition's defaults for that use. Prop merging details belong to Part 5. |
| Value contract | Preserved. Changing output type, empty semantics, or normalisation creates an explicit contract adaptation. |
| Checks | Definition checks and added instance checks both apply. Cross-field checks belong to their declared scope. |
| Replacing/removing a check | Requires a named, explicit operation or a new derived definition; never an accidental array replacement. Exact API remains open. |
| Renderer replacement | Must accept the editing value and preserve interaction obligations; unsupported props need adaptation. |
| Sensitive handling | A renderer or label override cannot silently broaden access or draft persistence. Application policy enforces access. |

No deep-merge algorithm should be treated as the semantic definition of composition.

## Section: members and their connections

The current [package API](../packages/react/README.md#reusable-sections-and-subsections) implements a narrower defineSection slice: recursive declarations, typed bindings, local rendering/watch/trigger helpers, and schema customization. The requirement/reference records below remain the broader model.

A section's members can be fields or other sections. The same SectionDefinition and SectionUse contracts apply at every nesting level. A child section may be called a **subsection** for readability; it has no separate entity discriminator, runtime behaviour, or binding rules. If useful, names such as SubsectionDefinition and SubsectionUse can be aliases of the corresponding Section types, rather than additional contracts.

```ts
type SectionDefinition = Definition<"section", {
  members: MemberDeclarations
  requirements?: RuleUse[]
  expose?: NamedMemberReferences
  presentation?: {
    content: Content
    layout?: LayoutUse
  }
}>

type SectionUse = {
  key: LocalKey
  definition: SectionDefinition | InstalledDefinitionRef
  binding?: ChildBindingMap | ObjectBindingPrefix
  inputs?: InputConnections
  capabilities?: CapabilityConnections
  relationships?: RelationshipUse[]
}
```

Bindings route child values; the section does not register an additional writable object over those children. Without an explicit object binding, semantic grouping alone creates no nested payload. When local member keys would collide, the caller supplies distinct bindings or object prefixes.

This also applies recursively: a parent routes a child section's bindings, and that child routes its own members. Each section use keeps its local member references and relationships. A reusable Address section can therefore be used inside a CustomerDetails section without changing the Address definition or requiring a special subsection implementation.

`expose` states which internal references the caller can connect or present. Inline authoring can use local references directly. Two extracted uses resolve the same local names to different instances.

Repeat is a use-site composition around a section definition: collection binding, section per item, stable item identity, and any collection requirements. Reordering changes value positions without recreating logical instances. Removal ends an instance; insertion at the old index creates another. The exact collection API belongs in Part 6.

## Page: presentation and a completion scope

```ts
type PageDefinition = Definition<"page", {
  members?: MemberDeclarations
  content: Content
  completion?: {
    include: RequirementRef[]
    own?: RuleUse[]
  }
  navigationPorts?: NamedNavigationIntents
  presentation?: {
    title?: string
    layout?: LayoutUse
  }
}>
```

A page can declare local members for a self-contained reusable page, or accept existing member references as typed inputs. Its content presents those references; it does not register them again. The convenient inline authoring form should derive ordered content from declarations rather than require duplicate lists.

Default completion includes requirements of the whole sections or selected editable fields presented, following the [state reference](03-state-and-completion.md). `completion` expresses explicit assignments or additional obligations. Merely reviewing a value introduces no field requirement; acknowledgement of a current summary is an explicit page requirement.

A cross-page section requirement stays in section/form completion unless explicitly assigned to a page or action too. Assignment references the same requirement. No scope copies a rule or becomes another value authority.

Navigation ports name intents such as `continue`; the containing form/workflow supplies destinations. A reusable Employment page exports no hard-coded `/onboarding/payroll` route. The host chooses routes, tabs, or another presentation. Moving a member to another page relocates its presentation while preserving its existing logical use and binding.

## Form: the interaction boundary

```ts
type FormDefinition<Payload> = Definition<"form", {
  members: MemberDeclarations
  content?: Content
  pages?: PageUses
  requirements?: RuleUse[]
  actions: ActionUses
  workflow?: WorkflowUse
  submission: {
    payload: ValueContract<SubmissionInput, Payload>
    map?: ApplicationPayloadMapping
  }
}>
```

Direct content is enough for a small form. Pages and workflow are optional. One declaration can supply a field's ordered presentation as well as its membership. The normal submission contract is inferred from included member values; a mapper is needed only for a deliberate different application payload.

The running form provides the shared boundary for values, requirements, and attempts. A reused Form creates a new interaction; embedding content into an existing form normally calls for a Section or Page, not an implicitly nested Form runtime. The application supplies action handlers and draft persistence where needed.

## Supporting definitions

These records name the minimum information the later phases need to explore. They can begin as ordinary local code packaged with a field, section, or form.

| Kind | Draft body | Boundary to preserve |
| --- | --- | --- |
| `renderer` | Accepted editing-value contract; render implementation; supported props/slots; value/change/blur, accessibility, review, and focus capabilities. | Uses a connected instance. Does not independently decide valid/complete or fetch unrelated selection state. Part 5 settles this interface. |
| `layout` | Supported container/placement configuration; ordered content slots; CSS defaults. | Adds no members, data, or requirements. A section split across pages uses each page's local arrangement. |
| `rule` | Typed inputs; check implementation; issue codes/messages; target references or value-part paths. | Returns checks without hidden writes. Required async checks participate in completion; suggestions need not. |
| `behaviour` | Typed inputs and targets; named effect; explicit effect-specific policy. | Distinguishes `visible`, `applicable`, `required`, and `derived-value` effects. Applicability policy includes retention and payload inclusion; disclosure alone does not. |
| `data-source` | Input/query/value contracts; search result contract; resolve-selected operation; eligibility operation when the domain requires it. | Supplies choices/checks through application capabilities. Pagination, pending, failed, and obsolete requests cannot masquerade as an authoritative empty result. |
| `action` | Intent; input/output contracts; requirement scope; guard connections; payload mapping when needed; handler or navigation port. | Declares an operation available to human and agent consumers. Attempts and reconciliation belong to the runtime; application execution stays outside. |
| `workflow` | Page/action ports; ordering or transitions; named conditions/guards; host navigation connections. | Composes logical pages. Scheduling and navigation semantics remain Part 6 work. An ordinary wizard should not require a graph language. |

A data-source sketch for domain pickers:

```ts
type Choice<Value> = {
  value: Value
  label: string
  description?: string
  disabledReason?: string
}

type ChoiceSource<Context, Value> = {
  search: Operation<
    { context: Context; query: string; cursor?: string },
    { items: Choice<Value>[]; nextCursor?: string }
  >
  resolve: Operation<
    { context: Context; value: Value },
    { status: "found"; choice: Choice<Value> } | { status: "unavailable" }
  >
  check?: Operation<
    { context: Context; value: Value },
    { eligible: true } | { eligible: false; reason: string }
  >
}
```

`Operation` also needs an error/cancellation contract, to be designed with Part 6. A failed operation is not a successful `unavailable` or `eligible: false` result. `check` is optional for general choice sources but required where a field declares membership/eligibility validation. A static-choice adapter can fulfil these obligations locally.

Capabilities may have different concrete signatures; this shared sketch is a candidate adapter shape, not a requirement to remodel every backend. Authentication and authorisation remain application responsibilities.

## Definition → use → live instance

| Identity | Example | What it identifies |
| --- | --- | --- |
| Installation address | `@acme/email` | Where source is acquired, using a configured namespace. |
| Installed definition reference | Local `Email` export | The selected contract/implementation. Portable references and version resolution remain open. |
| Logical instance reference | `requesting.email` | This particular field in this particular form runtime. Not a globally unique registry key. |
| Value binding | `contacts.requesting.email` | Where its stored value lives. |
| Presentation identity | The Email control on a page or its Review view | One rendered view, with its own DOM/accessibility IDs. |

```text
Field instance:
  identity + lifetime
  resolved definition + configuration
  value binding + resolved inputs/capabilities
  references to requirements
  state view: value, touched/dirty, issues, pending checks, applicability, completion

Section/Page/Form instance:
  identity + lifetime
  resolved definition + connections
  member/content references as appropriate
  requirement scope + state summary
  page visits or form attempts where appropriate
```

These are views over runtime authorities, not additional stores to implement. React Hook Form owns field values by default. Formulate coordinates requirements and scoped state. A presentation can unmount without ending the instance; a new form runtime or removed repeat item has a different lifecycle.

Inspection combines static meaning with current, authorised values, choices, dependencies, issues, and permitted actions. The registry provides descriptions and contracts, not live data. Human and agent consumers must observe and edit the same instances through shared validation; concurrency/freshness and transport belong to later phases.

## Applying the shapes

The [library authoring walkthrough](04-library-authoring.md) composes Field → Section → Page and exports the resulting library. The [registry pressure tests](04-registry-pressure-tests.md) apply these contracts to domain values and larger compositions. The [deployment scenario](03-scenarios/cloud-deployment-wizard.md) traces dependency and instance behaviour in detail.
