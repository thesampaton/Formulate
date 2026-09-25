import { useEffect, useState, type ComponentType } from "react";
import type { ExampleName } from "./example-types";
import { FocusedExample, type FocusedGuide } from "./focused-example";

type ExampleContent = { guide: FocusedGuide; Demo: ComponentType; Reference?: ComponentType };

// Loading the guide and its working form together keeps each route independent.
const exampleLoaders: Record<ExampleName, () => Promise<ExampleContent>> = {
  simple: async () => {
    const [{ SimpleForm }, { simpleGuide }] = await Promise.all([import("./simple-form"), import("./guides/simple")]);
    return { guide: simpleGuide, Demo: () => <><h2>Welcome back</h2><p className="card-description">One form definition supplies the field rules. This sign-in renders, validates and submits two values from it.</p><SimpleForm onSignIn={() => undefined} /></> };
  },
  schema: async () => {
    const [{ SchemaCompositionExample }, { schemaGuide }] = await Promise.all([import("./schema-composition"), import("./guides/schema")]);
    return { guide: schemaGuide, Demo: SchemaCompositionExample };
  },
  advanced: async () => {
    const [{ AdvancedOptions }, { advancedGuide }] = await Promise.all([import("./advanced-options"), import("./advanced-guide")]);
    return { guide: advancedGuide, Demo: () => <AdvancedOptions onSave={() => undefined} /> };
  },
  confirmation: async () => {
    const [{ EmailConfirmationExample }, { confirmationGuide }] = await Promise.all([import("./email-confirmation"), import("./guides/confirmation")]);
    return { guide: confirmationGuide, Demo: EmailConfirmationExample };
  },
  customer: async () => {
    const [{ CustomerOnboarding }, { customerGuide }] = await Promise.all([import("./customer-onboarding"), import("./guides/customer")]);
    return { guide: customerGuide, Demo: () => <CustomerOnboarding onCreate={() => undefined} /> };
  },
  layout: async () => {
    const [{ ResponsiveLayout }, { layoutGuide }] = await Promise.all([import("./responsive-layout"), import("./guides/layout")]);
    return { guide: layoutGuide, Demo: ResponsiveLayout };
  },
  multiPage: async () => {
    const [{ MultiPageExample }, { multiPageGuide }] = await Promise.all([import("./multi-page-form"), import("./guides/multi-page")]);
    return { guide: multiPageGuide, Demo: MultiPageExample };
  },
  employment: async () => {
    const [{ EmployeeWorkflowsExample }, { employmentGuide }] = await Promise.all([import("./employee-workflows"), import("./guides/employment")]);
    return { guide: employmentGuide, Demo: EmployeeWorkflowsExample };
  },
  cloud: async () => {
    const [{ CloudDeploymentExample }, { cloudGuide }] = await Promise.all([import("./cloud-deployment"), import("./guides/cloud")]);
    return { guide: cloudGuide, Demo: CloudDeploymentExample };
  },
  infrastructure: async () => {
    const [{ InfrastructureExample }, { infrastructureGuide }] = await Promise.all([import("./infrastructure"), import("./guides/infrastructure")]);
    return { guide: infrastructureGuide, Demo: InfrastructureExample };
  },
  controls: async () => {
    const [{ ControlGalleryExample }, { controlsGuide }, { ControlReference }] = await Promise.all([
      import("./control-gallery"), import("./guides/controls"), import("./control-reference"),
    ]);
    return { guide: controlsGuide, Demo: ControlGalleryExample, Reference: ControlReference };
  },
  structured: async () => {
    const [{ StructuredEditingExample }, { structuredGuide }] = await Promise.all([import("./structured-editing"), import("./guides/structured")]);
    return { guide: structuredGuide, Demo: StructuredEditingExample };
  },
  composed: async () => {
    const [{ ComposedValuesExample }, { composedGuide }] = await Promise.all([import("./composed-values"), import("./guides/composed")]);
    return { guide: composedGuide, Demo: ComposedValuesExample };
  },
};

const pending = new Map<ExampleName, Promise<ExampleContent>>();
const resolved = new Map<ExampleName, ExampleContent>();

function loadExample(example: ExampleName) {
  let result = pending.get(example);
  if (!result) {
    result = exampleLoaders[example]().then((content) => {
      resolved.set(example, content);
      return content;
    }, (error: unknown) => {
      pending.delete(example);
      throw error;
    });
    pending.set(example, result);
  }
  return result;
}

export default function ExamplePage({ example, title }: { example: ExampleName; title: string }) {
  const [content, setContent] = useState<ExampleContent | null>(() => resolved.get(example) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void loadExample(example).then(
      (next) => { if (active) setContent(next); },
      () => { if (active) setFailed(true); },
    );
    return () => { active = false; };
  }, [example]);

  if (failed) return <p role="status">This example could not load. Reload the page to try again.</p>;
  if (!content) return <p role="status">Loading example…</p>;
  const { Demo, guide, Reference } = content;
  const wideDemo = ["customer", "multiPage", "employment", "cloud", "infrastructure", "controls", "structured", "composed"].includes(example);
  return <FocusedExample title={title} guide={guide} reference={Reference ? <Reference /> : null} wideDemo={wideDemo}><Demo /></FocusedExample>;
}
