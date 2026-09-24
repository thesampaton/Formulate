/** Values crossing the portable boundary must survive a JSON round trip. */
export type JsonValue = null | boolean | number | string | readonly JsonValue[] | { readonly [key: string]: JsonValue };

/** The host supplies executable behavior; the graph only names it. */
export type CapabilityRef = { readonly capability: string };

export type Condition =
  | { readonly binding: string; readonly equals: JsonValue }
  | { readonly binding: string; readonly present: true }
  | { readonly all: readonly Condition[] }
  | { readonly any: readonly Condition[] }
  | { readonly not: Condition };

export type ValueContract = {
  readonly type?: "string" | "number" | "boolean" | "object" | "array";
  readonly enum?: readonly JsonValue[];
  readonly minLength?: number;
  readonly pattern?: string;
};

type FixedOptions = { readonly readonly?: true };
type Transform = { readonly transform?: CapabilityRef };

/** The existing composed-string segments, with named host transforms/parsers. */
export type PortableValueSegment =
  | ({ readonly literal: string; binding?: never; context?: never; input?: never; transform?: never } & FixedOptions)
  | ({ readonly binding: string; literal?: never; context?: never; input?: never } & FixedOptions & Transform)
  | ({ readonly context: string; literal?: never; binding?: never; input?: never } & FixedOptions & Transform)
  | { readonly input: true; readonly label?: string; readonly placeholder?: string; literal?: never; binding?: never; context?: never; transform?: never; readonly?: never };

export type PortableStringComposition = {
  readonly segments: readonly PortableValueSegment[];
  readonly parse?: CapabilityRef;
};

export type PortableChoices = {
  readonly options?: readonly { readonly value: string; readonly label: string }[];
  readonly capability?: string;
  /** Value binding paths, independent of presentation and node identities. */
  readonly dependencies?: readonly string[];
};

export type PortableAction = {
  readonly id: string;
  readonly capability: string;
  readonly when?: Condition;
};

export type NodeRole = "form" | "page" | "section" | "field";

export type PortableNode = {
  readonly id: string;
  readonly role: NodeRole;
  /** Reusable definition identity, retained after its semantics are expanded. */
  readonly use?: string;
  readonly bind?: string;
  readonly label?: string;
  readonly defaultValue?: JsonValue;
  readonly required?: boolean | Condition;
  readonly requiredMessage?: string;
  readonly applicable?: Condition;
  /** Node identities. Binding-based dependencies also become graph relations. */
  readonly dependsOn?: readonly string[];
  /** Describes supported schema input structure for inspection, never an extra
   * validator. Named validation capabilities remain authoritative when present. */
  readonly valueSchema?: JsonValue;
  /** Authoritative for data-only nodes; descriptive when validate is supplied. */
  readonly contract?: ValueContract;
  readonly validate?: CapabilityRef;
  readonly parse?: CapabilityRef;
  readonly choices?: PortableChoices;
  readonly composition?: PortableStringComposition;
  readonly actions?: readonly PortableAction[];
};

/** Human-authored containment is hierarchical; value scope is always explicit. */
export type AuthorNode = Omit<PortableNode, "role"> & {
  readonly role?: NodeRole;
  readonly children?: readonly AuthorNode[];
  readonly scope?: string;
};

export type NodeDefinition = Omit<AuthorNode, "id"> & { readonly id?: string };
export type DefinitionLibrary = Readonly<Record<string, NodeDefinition>>;
export type GraphRelation = readonly [source: string, relation: "contains" | "dependsOn", target: string];

export type NormalizedGraph = {
  readonly version: 1;
  readonly root: string;
  readonly nodes: Readonly<Record<string, PortableNode>>;
  readonly relations: readonly GraphRelation[];
};
