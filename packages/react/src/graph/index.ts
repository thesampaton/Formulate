/** Headless entry point: no React components or hooks. */
export { normalizeGraph } from "./normalize.js";
export type { AuthorNode, NodeDefinition, DefinitionLibrary, NormalizedGraph, PortableNode, NodeRole, GraphRelation, Condition, JsonValue, CapabilityRef, ValueContract, PortableChoices, PortableAction, PortableStringComposition, PortableValueSegment } from "./model.js";
export { createGraphRuntime, flattenGraphValues, expandGraphValues } from "./runtime.js";
export type { GraphCapabilities, GraphRuntime, GraphRuntimeOptions, GraphStatus, GraphValidationIssue, GraphActionInspection, GraphNodeInspection, InteractionState, GraphSnapshot } from "./runtime.js";
