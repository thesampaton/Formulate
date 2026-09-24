export type SchemaKeyReference = {
  key: string;
  accepts: string;
  defaultValue?: string;
  description: string;
  example: string;
};

export const fieldKeys: SchemaKeyReference[] = [
  {
    key: "schema",
    accepts: "Required · Zod schema",
    description: "Owns the editing value type, validation, and parsed submission value. Put requirements here once; z.string() alone accepts an empty string, so use .min(1) when text is required.",
    example: 'schema: z.string().trim().min(1, "Enter your name.")',
  },
  {
    key: "defaultValue",
    accepts: "Required · the schema's input type",
    description: "Seeds the editable draft. An empty string can be a valid starting draft even when validation rejects it. This is an initial value, not a second validation rule or live state.",
    example: 'defaultValue: ""',
  },
  {
    key: "label",
    accepts: "Required · ReactNode",
    description: "The visible, accessible field label. A plain string also becomes the graph's inspectable label.",
    example: 'label: "Email"',
  },
  {
    key: "component",
    accepts: "A key from your createFormulate components map",
    description: "Choose this or children. The selected connected control must accept the schema's editing value. This example app configures input, checkbox, select, textarea, and other controls; these names are application configuration, not a universal list.",
    example: 'component: "input"',
  },
  {
    key: "children",
    accepts: "ReactNode containing a connected control",
    description: "An alternative to component when you need custom control markup. Connected controls use the field binding. Do not also supply component or componentProps.",
    example: "children: <MyConnectedControl />",
  },
  {
    key: "componentProps",
    accepts: "The selected control's props",
    defaultValue: "Omitted unless the control requires props",
    description: "Configures the control, such as its type or placeholder. Available keys depend on the component map; Formulate's connected control supplies its value and change handlers.",
    example: 'componentProps: { type: "email" }',
  },
  {
    key: "description",
    accepts: "ReactNode",
    defaultValue: "No help text",
    description: "Help text associated with the control through its accessibility attributes.",
    example: 'description: "We will send your confirmation here."',
  },
  {
    key: "orientation",
    accepts: '"vertical" | "horizontal" | "responsive"',
    defaultValue: '"vertical" in this app\'s field presentation',
    description: "Arranges a field's label, control, help, and error. Container layout is configured separately.",
    example: 'orientation: "horizontal"',
  },
  {
    key: "applicable",
    accepts: "A structured Condition (see below)",
    defaultValue: "Always applicable",
    description: "Includes the field only when the condition matches. Otherwise its editor is hidden, it does not block validation, and its value is omitted from parsed output. Binding paths are relative to the owning form or section.",
    example: 'applicable: { binding: "needsInvoice", equals: true }',
  },
  {
    key: "className / style / classNames",
    accepts: "CSS class string / React CSSProperties / slot class strings",
    defaultValue: "The configured presentation's styles",
    description: "Styles the field wrapper or label, content, description, and error slots. Put control styling in componentProps instead. These are React presentation settings, not validation rules.",
    example: 'classNames: { label: "font-medium", error: "text-destructive" }',
  },
  {
    key: "presentation",
    accepts: "React component accepting FieldPresentationProps",
    defaultValue: "The field presentation selected by createFormulate",
    description: "Replaces the field's label/help/error wrapper for this declaration while retaining its connected value binding.",
    example: "presentation: MyFieldPresentation",
  },
];

export const definitionKeys: SchemaKeyReference[] = [
  {
    key: "id",
    accepts: "Non-empty string",
    defaultValue: 'Export root: "form" or "section"',
    description: "Stable identity for the definition's root when exported. An embedded section normally takes its member key as its instance identity; use Section.use({ id, bind }) to declare a particular reuse.",
    example: 'id: "workshop-registration"',
  },
  {
    key: "definitionId",
    accepts: "String identifying a reusable definition",
    defaultValue: "No reusable definition identifier",
    description: "Identifies the reusable recipe, independently of any instance ID or value binding. The graph preserves it as use; it does not load a definition from a catalogue.",
    example: 'definitionId: "registration.contact"',
  },
  {
    key: "title",
    accepts: "ReactNode · defineSection only",
    defaultValue: "The section's member key when rendered by its parent",
    description: "The visible section heading. It labels the group without changing the group's value path.",
    example: 'title: "Contact details"',
  },
  {
    key: "layout",
    accepts: "React component accepting children, or null",
    defaultValue: "No layout wrapper",
    description: "Arranges the form or section body. Use a stable component declared at module scope, such as this app's FieldGroup. A supplied layout replaces the default; null removes it.",
    example: "layout: FieldGroup",
  },
  {
    key: "bodyClassName",
    accepts: "CSS class string",
    defaultValue: "No extra body wrapper",
    description: "Adds a styled body div around the layout and its children.",
    example: 'bodyClassName: "space-y-6"',
  },
  {
    key: "children",
    accepts: 'Array of member names or { id, role: "page" | "section", label?, children }',
    defaultValue: "All members in declaration order",
    description: "Optionally places existing members into nested pages or presentation sections. Each member must appear exactly once. A container's id is its identity, label is its heading (defaults to id), and children holds its contents. Placement does not change value bindings.",
    example: 'children: [{ id: "details", role: "page", label: "Your details", children: ["contact", "needsInvoice", "company"] }]',
  },
  {
    key: "schema",
    accepts: "Function from the assembled Zod object to a Zod schema",
    defaultValue: "The schema assembled from all members",
    description: "Adds cross-field validation or parses the final output. The returned schema must preserve the complete editing input type. Unlike a field's schema key, this is a builder receiving the composed object schema.",
    example: 'schema: (schema) => schema.refine((values) => values.start < values.end, { path: ["end"], message: "End must follow start." })',
  },
  {
    key: "presentation",
    accepts: "React component accepting SectionPresentationProps · defineSection only",
    defaultValue: "Section shell with the declared fields",
    description: "Supplies a custom section view using the definition's local Field, Section, and hook helpers. The reusable section retains its schema and semantics.",
    example: "presentation: ContactPresentation",
  },
  {
    key: "applicable",
    accepts: "A structured Condition (see below)",
    defaultValue: "Always applicable",
    description: "Applies a condition to the whole form or section. For an embedded section, binding paths refer to its parent definition's values. Inapplicable sections are omitted from parsed output; an inapplicable root form parses to an empty object.",
    example: 'applicable: { binding: "needsInvoice", equals: true }',
  },
  {
    key: "dependsOn / actions",
    accepts: "Node ID array / named action array",
    defaultValue: "No explicit dependencies or actions",
    description: "Reusable sections can carry the same dependency and action metadata as fields. See the relationship keys below for each shape. Dependencies on an embedded section govern completion of that section.",
    example: 'dependsOn: ["contact"]',
  },
];

export const relationshipKeys: SchemaKeyReference[] = [
  {
    key: "id",
    accepts: "Non-empty string",
    defaultValue: "The member key, scoped by its containing section instance",
    description: "The field's stable node identity. It can differ from the key used to address the value. A dependency references node identities, not labels.",
    example: 'id: "contact-email"',
  },
  {
    key: "bind",
    accepts: "Dot-separated value path",
    defaultValue: "The member key, relative to the owning definition",
    description: "Selects where the field's value lives, such as contact.email. It is independent of node identity and page placement. For a reusable section, declare its value scope through Section.use({ id, bind }).",
    example: 'bind: "contact.email"',
  },
  {
    key: "definitionId",
    accepts: "String identifying a reusable definition",
    defaultValue: "No reusable definition identifier",
    description: "Records which reusable field definition an instance came from. Multiple independently bound instances can share this identifier.",
    example: 'definitionId: "contact.email-address"',
  },
  {
    key: "dependsOn",
    accepts: "Array of node IDs or local member names",
    defaultValue: "No explicit dependencies",
    description: "Requires the referenced nodes to complete before this node can complete. References resolve in the owning definition's identity scope. Unlike applicable and choice dependencies, these references are node identities, not value paths.",
    example: 'dependsOn: ["contact"]',
  },
  {
    key: "choices",
    accepts: "A rule returned by defineChoice",
    defaultValue: "No dependent choice rule",
    description: "Carries loading and selection validation together. Its config supplies getInput, getRequestKey, getLoader, validateSelection, and missing/pending/failed messages; optional dependencies names value paths. Host services are supplied to useForm({ services }).",
    example: "choices: RegionChoices",
  },
  {
    key: "composition",
    accepts: "{ segments, parse? } · string-valued fields",
    defaultValue: "No composed value",
    description: "Builds one string from segments containing literal text, a binding value path, a context path, or input: true. Binding/context segments may transform a value to text; editable segments may have label and placeholder. Multiple input segments require a parse function returning the editable strings in order.",
    example: 'composition: { segments: [{ literal: "ws-" }, { input: true }] }',
  },
  {
    key: "actions",
    accepts: "Array of { id: string, capability: string, when?: Condition }",
    defaultValue: "No declared actions",
    description: "Describes actions for graph inspection and invocation through a named host capability. An optional when condition controls availability. The declaration does not create a React button; the host provides the action implementation.",
    example: 'actions: [{ id: "suggest", capability: "suggest-name", when: { binding: "topic", present: true } }]',
  },
  {
    key: "primitive",
    accepts: '"text" | "number" | "boolean" | "choice" | "multiChoice" | "date" | "time" | "dateTime" | "file" | "object" | "array"',
    defaultValue: "Optional for inline fields; required by defineField",
    description: "Names a reusable field's semantic value category. It does not select a control or replace the authoritative Zod schema.",
    example: 'primitive: "text"',
  },
];

export const conditionKeys: SchemaKeyReference[] = [
  {
    key: "binding + equals",
    accepts: "{ binding: string, equals: JSON value }",
    description: "Reads a value path in the condition's scope and compares it with a string, number, boolean, null, array, or object. Equality compares object and array contents as well as scalar values.",
    example: '{ binding: "needsInvoice", equals: true }',
  },
  {
    key: "binding + present",
    accepts: "{ binding: string, present: true }",
    description: "Matches when the value is neither undefined, null, a blank string, nor an empty array. The values false and 0 count as present. Use not around this condition to test absence; present: false is not a supported shape.",
    example: '{ binding: "contact.email", present: true }',
  },
  {
    key: "all",
    accepts: "Array of conditions",
    description: "Matches only when every nested condition matches. Conditions may be combined recursively.",
    example: '{ all: [{ binding: "needsInvoice", equals: true }, { binding: "company", present: true }] }',
  },
  {
    key: "any",
    accepts: "Array of conditions",
    description: "Matches when at least one nested condition matches.",
    example: '{ any: [{ binding: "contact.email", present: true }, { binding: "contact.phone", present: true }] }',
  },
  {
    key: "not",
    accepts: "One condition",
    description: "Inverts the nested condition.",
    example: '{ not: { binding: "needsInvoice", equals: true } }',
  },
];
