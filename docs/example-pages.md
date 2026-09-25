# Example page presentation

Every example introduces one Formulate capability. The page names the principle first, gives readers a specific task in a working form, explains the capability through two to four short excerpts from the checked-in source, then offers complete application files in collapsed disclosures. The [Step validation page](../examples/react/src/advanced-guide.ts) established this format; [React Aria's component documentation](https://react-aria.adobe.com/Button) remains a useful reference for clarity.

## Page recipe

1. Name the principle in the page title and **New here** line. Explain it first in the summary; use the live scenario to make it concrete.
2. Put the live form next, with one concrete interaction that reveals the capability. If the form has required fields, the task must tell readers how to satisfy them.
3. Follow with two to four ordered steps. Each step needs a task-focused title, one short explanation, and only the source lines that support it.
4. Label the source file on every excerpt. Keep the few complete application files needed to understand the example available on demand.
5. Prefer schema composition and `<Definition.Fields />` after the foundation pages introduce them. Place typed fields or sections explicitly in React when page flow or a layout override calls for it. Keep application-owned services, navigation policy and persistence distinct from Formulate's rules and bindings.

[FocusedExample](../examples/react/src/focused-example.tsx) provides the page structure. Each route has its own guide data module in [guides](../examples/react/src/guides), and [sourceExcerpt](../examples/react/src/source-excerpt.ts) selects exact lines from imported source files. It fails if the boundary lines are no longer unique, so documentation changes remain tied to implementation changes. [SourceCode](../examples/react/src/source-code.tsx) renders TypeScript and TSX with Shiki highlighting, line numbers, horizontal scrolling and a copy action; complete files load only when opened.

## Capability progression

| Example | New capability |
| --- | --- |
| 00 Form lifecycle | Define, validate and submit a basic form |
| 01 Schema composition | Render a nested schema automatically |
| 02 Step validation | Validate the active step |
| 03 Cross-field validation | Validate a relationship between fields |
| 04 Retained drafts | Retain an inactive draft and derive the effective payload |
| 05 Reusable layouts | Override presentation without changing field paths or values |
| 06 Page completion | Derive page completion and correction from one schema |
| 07 Reusable pages | Reuse a page presentation across independent forms |
| 08 Dependent choices | Narrow later choices using earlier answers |
| 09 Stable repeated sections | Repeat a section with stable identity |
| 10 Interchangeable controls | Render one value contract with different local controls |
| 11 Structured field values | Keep a compound editor as one field value |
| 12 Composed values | Build one canonical string from several segments |

Supporting mechanics can appear in a walkthrough, but the new capability should remain clear from the task and the first source steps. When two pages appear to teach the same thing, sharpen their task or combine them.
