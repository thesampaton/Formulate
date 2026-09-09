/// <reference types="vite/client" />
import simple from "./compositions/sign-in.tsx?raw";
import advanced from "./compositions/request-settings.tsx?raw";
import confirmation from "./compositions/email-confirmation.tsx?raw";
import customer from "./compositions/customer.tsx?raw";
import responsive from "./compositions/profile.tsx?raw";
import multiPage from "./compositions/multi-page-form.tsx?raw";
import signInDeclaration from "./declarations/sign-in.ts?raw";
import requestDeclaration from "./declarations/request-settings.ts?raw";
import confirmationDeclaration from "./declarations/email-confirmation.ts?raw";
import customerDeclaration from "./declarations/customer.ts?raw";
import profileDeclaration from "./declarations/profile.ts?raw";
import multiPageDeclaration from "./declarations/multi-page-profile.ts?raw";
import address from "./declarations/address.tsx?raw";
import email from "./declarations/email.ts?raw";
import name from "./declarations/name.tsx?raw";
import layouts from "./components/formulate/layouts.tsx?raw";
import formTabs from "./components/formulate/form-tabs.tsx?raw";
import formActions from "./components/formulate/form-actions.tsx?raw";
import pageLayouts from "./components/formulate/form-page-layouts.tsx?raw";
import notifications from "./declarations/notifications.tsx?raw";
import pageState from "./hooks/use-profile-pages.ts?raw";
import pageRules from "./hooks/profile-pages.ts?raw";
import profileSummary from "./components/formulate/profile-summary.tsx?raw";
import pageActions from "./components/formulate/form-page-actions.tsx?raw";
import pendingFields from "./components/formulate/form-pending-fields.tsx?raw";
import controls from "./components/formulate/controls.tsx?raw";
import fieldPresentation from "./components/formulate/field-presentation.tsx?raw";
import shadcnConfig from "../components.json?raw";
import localInput from "./components/ui/input.tsx?raw";
import controlMap from "./lib/formulate-config.ts?raw";
import { exampleData } from "./data/example-data";

export type ExampleName = keyof typeof exampleData;

export const codeCategories = {
  form: { label: "This form", description: "The composition, declaration and data for this particular form." },
  fields: { label: "Fields & sections", description: "Reusable value contracts, rules and local behaviour, with default presentation." },
  layouts: { label: "Layouts", description: "Arrange content and action slots. Layouts add no values or validation rules." },
  navigation: { label: "Navigation", description: "Present and select pages, with shared context for page composition." },
  actions: { label: "Actions", description: "Express Submit, Continue and Edit intents through the owning form and navigation." },
  controls: { label: "shadcn bindings", description: "Map form values, events and field presentation onto your local shadcn components. UI props come from those components." },
  installation: { label: "Installation", description: "The shadcn CLI resolves source locations and rewrites imports when you install. Forms use ordinary local imports at runtime." },
  behaviour: { label: "Form behaviour", description: "This example's page scopes, completion, correction destinations and saved baseline." },
} as const;
export type CodeCategory = keyof typeof codeCategories;
export type CodeExcerpt = {
  category: CodeCategory;
  label: string;
  filename: string;
  code: string;
  description: string;
  registryItem?: string;
  provenance?: string;
};

// Whole checked-in modules. Responsibility and installation are separate metadata.
function source(category: CodeCategory, label: string, filename: string, code: string, description: string, registryItem?: string): CodeExcerpt {
  return { category, label, filename, code: code.trim(), description, registryItem };
}
const sample = (example: ExampleName) => source("form", "Sample data", `data/example-data.ts → ${example}`, JSON.stringify(exampleData[example], null, 2), "Shared example values consumed by the demo, source panel and tests.");
const declaration = (filename: string, code: string) => source("form", "Declaration", filename, code, "Declares this form's members, validation and editing defaults.");
const composition = (filename: string, code: string) => source("form", "Composition", filename, code, "Places declared fields, sections and pages into this form's rendered experience.");
const emailField = source("fields", "Email", "declarations/email.ts", email, "One reusable field declaration; each use supplies its own binding.");
const nameSection = source("fields", "Name", "declarations/name.tsx", name, "First and last name with local bindings and a default responsive row.", "@formulate/name");
const addressSection = source("fields", "Address", "declarations/address.tsx", address, "Address fields with country/postcode validation and local revalidation.");
const notificationSection = source("fields", "Notifications", "declarations/notifications.tsx", notifications, "Notification preference fields with a conditional mobile-number requirement.");
const bodyLayouts = source("layouts", "Content & action rows", "components/formulate/layouts.tsx", layouts, "Stack, Row and ActionRow arrange children without choosing actions.", "@formulate/layouts");
const stepLayout = source("layouts", "Page layout", "components/formulate/form-page-layouts.tsx", pageLayouts, "Places page content above default or supplied actions; inherits page context.", "@formulate/navigation");
const tabs = source("navigation", "Tabs & pages", "components/formulate/form-tabs.tsx", formTabs, "Page selection, panel mounting, layout inheritance and navigation context.", "@formulate/navigation");
const buttons = source("actions", "Action buttons", "components/formulate/form-actions.tsx", formActions, "Submit and Continue invoke the owning Form action; Back/Edit invoke a supplied callback.", "@formulate/actions");
const pageActionSets = source("actions", "Page actions", "components/formulate/form-page-actions.tsx", pageActions, "Default Back/Continue and Review action sets read available pages from navigation context.", "@formulate/navigation");
const connectedControls = source("controls", "Control bindings", "components/formulate/controls.tsx", controls, "Attach core value, event, accessibility and focus bindings to installed shadcn primitives.", "@formulate/shadcn-bindings");
const fieldChrome = source("controls", "Field presentation", "components/formulate/field-presentation.tsx", fieldPresentation, "Local shadcn labels, descriptions and errors receive the core field's accessible IDs.", "@formulate/shadcn-bindings");
const map = source("controls", "Control map", "lib/formulate-config.ts", controlMap, "Map declaration keys to bindings over local shadcn components. This is the runtime map; installation paths belong to components.json.", "@formulate/shadcn-bindings");
const pending = source("controls", "Pending editors", "components/formulate/form-pending-fields.tsx", pendingFields, "Disable editors while the owning Form validates or submits.", "@formulate/shadcn-bindings");
const installedInput: CodeExcerpt = {
  ...source("controls", "Local Input", "components/ui/input.tsx", localInput, "The actual shadcn Input source used by InputControl and NumberControl. Customise this component locally; its props flow into the bindings."),
  provenance: "Installed from shadcn/ui · editable local source",
};
const installation: CodeExcerpt = {
  ...source("installation", "shadcn config", "components.json", shadcnConfig, "aliases.ui chooses where shadcn primitives live; aliases.components and aliases.lib locate Formulate source. The CLI rewrites the bindings' imports to match. This project config is not installed by Formulate."),
  provenance: "Project-owned shadcn CLI configuration · used at installation",
};
const integration = [map, connectedControls, fieldChrome, installedInput, installation];

export const exampleCode = {
  simple: [
    composition("compositions/sign-in.tsx", simple), declaration("declarations/sign-in.ts", signInDeclaration), sample("simple"),
    emailField, buttons, ...integration,
  ],
  advanced: [
    composition("compositions/request-settings.tsx", advanced), declaration("declarations/request-settings.ts", requestDeclaration), sample("advanced"),
    bodyLayouts, buttons, ...integration,
  ],
  confirmation: [
    composition("compositions/email-confirmation.tsx", confirmation), declaration("declarations/email-confirmation.ts", confirmationDeclaration), sample("confirmation"),
    emailField, buttons, ...integration,
  ],
  multiPage: [
    composition("compositions/multi-page-form.tsx", multiPage), declaration("declarations/multi-page-profile.ts", multiPageDeclaration), sample("multiPage"),
    source("form", "Review summary", "components/formulate/profile-summary.tsx", profileSummary, "A reader of this form's existing values; it does not register editors."),
    nameSection, addressSection, notificationSection, emailField,
    bodyLayouts, stepLayout, tabs, buttons, pageActionSets, ...integration, pending,
    source("behaviour", "Page state", "hooks/use-profile-pages.ts", pageState, "Connect this form's navigation scopes, correction focus and save handler."),
    source("behaviour", "Page scopes & completion", "hooks/profile-pages.ts", pageRules, "Assign fields to this form's pages and derive completion from its synchronous schema."),
  ],
  layout: [
    composition("compositions/profile.tsx", responsive), declaration("declarations/profile.ts", profileDeclaration), sample("layout"),
    nameSection, emailField, bodyLayouts, buttons, ...integration,
  ],
  customer: [
    composition("compositions/customer.tsx", customer), declaration("declarations/customer.ts", customerDeclaration), sample("customer"),
    addressSection, emailField, bodyLayouts, buttons, ...integration,
  ],
} satisfies Record<ExampleName, readonly [CodeExcerpt, ...CodeExcerpt[]]>;
