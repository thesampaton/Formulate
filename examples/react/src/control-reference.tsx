import { useEffect } from "react";
import { SourceCode } from "./source-code";
import "./control-reference.css";

type PropRow = { name: string; type: string; use: string };
type ControlApi = {
  id: string;
  title: string;
  key: string;
  binding: string;
  propsType: string;
  source: string;
  value: string;
  primitive: string;
  shadcn: string;
  description: string;
  props: readonly PropRow[];
  usage: string;
  note: string;
};
type ControlGroup = { id: string; title: string; controls: readonly ControlApi[] };

const optionsProp: PropRow = {
  name: "options",
  type: "readonly ControlOption[]",
  use: "Required. Each option is { value: string, label: string, disabled?: boolean }.",
};

const groups: readonly ControlGroup[] = [
  {
    id: "choices",
    title: "Choices",
    controls: [
      {
        id: "select", title: "Select", key: "select", binding: "SelectControl",
        propsType: "SelectControlProps", source: "components/formulate/controls.tsx",
        value: "string (empty: \"\")", primitive: "choice", shadcn: "select",
        description: "A single selected option. The adapter translates an empty Base UI selection to the field's empty string.",
        props: [
          optionsProp,
          { name: "onValueChange?", type: "(value: string) => void", use: "Optional callback after Formulate receives the selected value." },
        ],
        usage: [
          "regionId: field(Region, {",
          "  component: \"select\",",
          "  componentProps: { options: regionOptions, placeholder: \"Choose a region\" },",
          "}),",
        ].join("\n"),
        note: "Use a schema or a choice rule to enforce membership. Disabling an option only changes the control's UI.",
      },
      {
        id: "radio-group", title: "Radio Group", key: "radioGroup", binding: "RadioGroupControl",
        propsType: "RadioGroupControlProps", source: "components/formulate/group-controls.tsx",
        value: "string (empty: \"\")", primitive: "choice", shadcn: "radio-group",
        description: "Several visible options edit one field. Focus moving between options does not count as leaving the field.",
        props: [optionsProp],
        usage: [
          "country: field(CountryChoice, {",
          "  component: \"radioGroup\",",
          "  componentProps: { options: countryOptions, orientation: \"horizontal\" },",
          "}),",
        ].join("\n"),
        note: "Formulate supplies the field label, errors, disabled state and blur behavior for the group.",
      },
      {
        id: "combobox", title: "Combobox", key: "combobox", binding: "ComboboxControl",
        propsType: "ComboboxControlProps", source: "components/formulate/choice-controls.tsx",
        value: "string (empty: \"\")", primitive: "choice", shadcn: "combobox",
        description: "Searchable suggestions edit one selected value. Search text stays inside the control until an option is chosen.",
        props: [
          optionsProp,
          { name: "showClear?", type: "boolean", use: "Defaults to true. Clearing commits the empty string to Formulate." },
        ],
        usage: [
          "country: field(CountryChoice, {",
          "  component: \"combobox\",",
          "  componentProps: { options: countryOptions, showClear: true },",
          "}),",
        ].join("\n"),
        note: "The schema validates the selected option value, not the text used to filter suggestions.",
      },
      {
        id: "command", title: "Command", key: "command", binding: "CommandControl",
        propsType: "CommandControlProps", source: "components/formulate/choice-controls.tsx",
        value: "string (empty: \"\")", primitive: "choice", shadcn: "command",
        description: "An inline searchable list used as a field picker. Highlighting or typing does not commit a value; selecting an item does.",
        props: [optionsProp],
        usage: [
          "country: field(CountryChoice, {",
          "  component: \"command\",",
          "  componentProps: { options: countryOptions, placeholder: \"Search countries…\" },",
          "}),",
        ].join("\n"),
        note: "This binding treats Command as a choice field, not an action menu. Its Clear selection action writes the empty string.",
      },
      {
        id: "toggle-group", title: "Toggle Group", key: "toggleGroup", binding: "ToggleGroupControl",
        propsType: "ToggleGroupControlProps", source: "components/formulate/group-controls.tsx",
        value: "string (empty: \"\")", primitive: "choice", shadcn: "toggle-group",
        description: "A single selection shown as pressed buttons. The adapter translates shadcn's array-shaped value to one string.",
        props: [optionsProp],
        usage: [
          "country: field(CountryChoice, {",
          "  component: \"toggleGroup\",",
          "  componentProps: { options: countryOptions, variant: \"outline\" },",
          "}),",
        ].join("\n"),
        note: "Pressing the selected item again writes the empty string. Add a required rule if that empty value must be rejected.",
      },
      {
        id: "multi-toggle-group", title: "Toggle Group (multiple)", key: "multiToggleGroup",
        binding: "MultiToggleGroupControl", propsType: "ToggleGroupControlProps",
        source: "components/formulate/group-controls.tsx",
        value: "string[] (empty: [])", primitive: "multiChoice", shadcn: "toggle-group",
        description: "The same shadcn presentation with an array value. Use this distinct binding key for multiple selections.",
        props: [optionsProp],
        usage: [
          "countries: {",
          "  primitive: \"multiChoice\", schema: z.array(z.enum([\"AU\", \"NZ\"])),",
          "  defaultValue: [], label: \"Countries\", component: \"multiToggleGroup\",",
          "  componentProps: { options: countryOptions, variant: \"outline\" },",
          "},",
        ].join("\n"),
        note: "There is no multiple prop to switch a scalar field into an array. The schema must validate each selected code.",
      },
    ],
  },
  {
    id: "text",
    title: "Text",
    controls: [
      {
        id: "input", title: "Input", key: "input", binding: "InputControl",
        propsType: "InputControlProps", source: "components/formulate/controls.tsx",
        value: "string", primitive: "text", shadcn: "input",
        description: "A native text-like input bound to one string. Formulate owns its value, change, blur, name, disabled state and errors.",
        props: [
          { name: "type?", type: '"text" | "email" | "password" | "search" | "tel" | "url" | "date" | "time" | "datetime-local"', use: "Allowed input types. Even native date and time inputs edit a string here." },
        ],
        usage: [
          "email: field(Email, {",
          "  component: \"input\",",
          "  componentProps: { type: \"email\", autoComplete: \"email\" },",
          "}),",
        ].join("\n"),
        note: "Input and Textarea accept their local shadcn props except the binding-owned value, events, ID, name, ref and state props.",
      },
      {
        id: "textarea", title: "Textarea", key: "textarea", binding: "TextareaControl",
        propsType: "TextareaControlProps", source: "components/formulate/controls.tsx",
        value: "string", primitive: "text", shadcn: "textarea",
        description: "A multiline string using the same Formulate value and validation contract as Input.",
        props: [],
        usage: [
          "notes: {",
          "  primitive: \"text\", schema: z.string().min(1),",
          "  defaultValue: \"\", label: \"Notes\", component: \"textarea\",",
          "  componentProps: { rows: 3, placeholder: \"Add a note…\" },",
          "},",
        ].join("\n"),
        note: "Changing from Input to Textarea does not require a different primitive or value shape.",
      },
      {
        id: "input-otp", title: "Input OTP", key: "inputOTP", binding: "InputOTPControl",
        propsType: "InputOTPControlProps", source: "components/formulate/controls.tsx",
        value: "string", primitive: "text", shadcn: "input-otp",
        description: "Several visible slots edit one string. Leading zeroes remain intact.",
        props: [
          { name: "maxLength?", type: "number", use: "Positive integer; defaults to 6 and sets the number of slots." },
        ],
        usage: [
          "code: {",
          "  primitive: \"text\", schema: z.string().regex(/^\\d{6}$/),",
          "  defaultValue: \"\", label: \"Code\", component: \"inputOTP\",",
          "  componentProps: { maxLength: 6 },",
          "},",
        ].join("\n"),
        note: "Slot count and input restrictions are UI hints. The schema enforces the required length and format; completion does not submit automatically.",
      },
    ],
  },
  {
    id: "booleans",
    title: "Booleans",
    controls: [
      {
        id: "checkbox", title: "Checkbox", key: "checkbox", binding: "CheckboxControl",
        propsType: "CheckboxControlProps", source: "components/formulate/controls.tsx",
        value: "boolean", primitive: "boolean", shadcn: "checkbox",
        description: "A two-state boolean. The binding turns the shadcn checked event into true or false.",
        props: [
          { name: "onValueChange?", type: "(value: boolean) => void", use: "Optional callback after Formulate receives the checked state." },
        ],
        usage: [
          "enabled: {",
          "  primitive: \"boolean\", schema: z.boolean(),",
          "  defaultValue: false, label: \"Enabled\", component: \"checkbox\",",
          "},",
        ].join("\n"),
        note: "This adapter does not expose an indeterminate field value. Use the schema for any rule that requires true.",
      },
      {
        id: "switch", title: "Switch", key: "switch", binding: "SwitchControl",
        propsType: "SwitchControlProps", source: "components/formulate/controls.tsx",
        value: "boolean", primitive: "boolean", shadcn: "switch",
        description: "Another presentation of a boolean field, without changing its stored value or schema.",
        props: [],
        usage: [
          "enabled: field(BooleanField, {",
          "  component: \"switch\", label: \"Enabled\",",
          "}),",
        ].join("\n"),
        note: "Choose Checkbox or Switch for the desired interaction; both edit one boolean contract.",
      },
    ],
  },
  {
    id: "numbers-dates",
    title: "Numbers and dates",
    controls: [
      {
        id: "slider", title: "Slider", key: "slider", binding: "SliderControl",
        propsType: "SliderControlProps", source: "components/formulate/group-controls.tsx",
        value: "finite number", primitive: "number", shadcn: "slider",
        description: "One thumb edits one number. The adapter translates shadcn's array-shaped value to a scalar.",
        props: [
          { name: "min? / max? / step?", type: "number", use: "Set the interaction range and increment; keep the schema bounds in sync." },
        ],
        usage: [
          "percentage: field(Percentage, {",
          "  component: \"slider\",",
          "  componentProps: { min: 0, max: 100, step: 1 },",
          "}),",
        ].join("\n"),
        note: "Give the field a finite starting number. The schema, rather than the slider range alone, enforces accepted values.",
      },
      {
        id: "calendar", title: "Calendar", key: "calendar", binding: "CalendarControl",
        propsType: "CalendarControlProps", source: "components/formulate/calendar-controls.tsx",
        value: "Date | null", primitive: "date", shadcn: "calendar",
        description: "An inline, single-date editor. Selecting or clearing a day updates one nullable Date field.",
        props: [
          { name: "defaultMonth?", type: "Date", use: "Controls the initially visible month, not the field's defaultValue." },
          { name: "disabledDates?", type: "Calendar disabled matcher", use: "Prevents selection in the UI; the schema still defines valid dates." },
        ],
        usage: [
          "visitDate: field(SingleDate, {",
          "  component: \"calendar\",",
          "  componentProps: { defaultMonth: new Date(2026, 8, 1) },",
          "}),",
        ].join("\n"),
        note: "Use a Date | null schema for the editing value. Add schema rules for required or allowed dates; disabledDates alone is presentation.",
      },
      {
        id: "date-picker", title: "Date Picker", key: "datePicker", binding: "DatePickerControl",
        propsType: "DatePickerControlProps", source: "components/formulate/calendar-controls.tsx",
        value: "Date | null", primitive: "date", shadcn: "date-picker",
        description: "The same single-date value in a popup. This local binding composes shadcn Calendar, Popover and Button.",
        props: [
          { name: "disabledDates?", type: "Calendar disabled matcher", use: "Prevents selection in the UI; the schema still defines valid dates." },
          { name: "placeholder?", type: "string", use: "Shown when the field value is null. Clear date writes null." },
        ],
        usage: [
          "visitDate: field(SingleDate, {",
          "  component: \"datePicker\",",
          "  componentProps: { placeholder: \"Choose a date\" },",
          "}),",
        ].join("\n"),
        note: "Selecting a date closes the popup; Clear date writes null. shadcn documents Date Picker as a Calendar and Popover pattern.",
      },
    ],
  },
];

const ids = new Set(groups.flatMap((group) => group.controls.map((control) => control.id)));

function scrollToSection(section: string) {
  const id = section === "api" ? "control-api" : "control-" + section;
  document.getElementById(id)?.scrollIntoView?.({ block: "start" });
}

function sectionFromHash() {
  const query = window.location.hash.split("?")[1] ?? "";
  const section = new URLSearchParams(query).get("section");
  return section && (section === "api" || ids.has(section)) ? section : null;
}

function ControlEntry({ control }: { control: ControlApi }) {
  return <section className="control-api-entry" id={"control-" + control.id} aria-labelledby={"control-" + control.id + "-heading"}>
    <div className="control-api-entry-heading">
      <div>
        <h4 id={"control-" + control.id + "-heading"}>{control.title}</h4>
        <p>{control.description}</p>
      </div>
      <a href={"https://ui.shadcn.com/docs/components/base/" + control.shadcn}>shadcn {control.title} docs ↗</a>
    </div>
    <dl className="control-api-contract">
      <div><dt>Component key</dt><dd><code>{control.key}</code></dd></div>
      <div><dt>Editing value</dt><dd><code>{control.value}</code></dd></div>
      <div><dt>Primitive</dt><dd><code>{control.primitive}</code></dd></div>
      <div><dt>Local adapter</dt><dd><code>{control.binding}</code></dd></div>
      <div><dt>Props type</dt><dd><code>{control.propsType}</code></dd></div>
    </dl>
    <p className="control-api-source">Local binding source: <code>{control.source}</code> (expand it under Complete source below). See the shadcn docs for the full visual component API.</p>
    {control.props.length > 0 ? <div className="control-api-table-wrap">
      <table>
        <thead><tr><th scope="col">Relevant componentProps</th><th scope="col">Type</th><th scope="col">Effect in a Formulate form</th></tr></thead>
        <tbody>{control.props.map((prop) => <tr key={prop.name}>
          <th scope="row"><code>{prop.name}</code></th><td><code>{prop.type}</code></td><td>{prop.use}</td>
        </tr>)}</tbody>
      </table>
    </div> : null}
    <SourceCode filename="field-definition.ts" code={control.usage} label={control.title + " declaration"} kind="Usage example" />
    <p className="control-api-note">{control.note}</p>
    <a className="control-api-back" href="#/examples/controls?section=api" onClick={() => scrollToSection("api")}>Back to control index ↑</a>
  </section>;
}

export function ControlReference() {
  useEffect(() => {
    const update = () => {
      const section = sectionFromHash();
      if (section) scrollToSection(section);
    };
    update();
    // Browser scroll restoration can run after this async route mounts. Reapply
    // the bookmark once it has settled, including in background tabs where
    // requestAnimationFrame may not run.
    const restore = window.setTimeout(update, 100);
    window.addEventListener("hashchange", update);
    window.addEventListener("pageshow", update);
    return () => {
      window.clearTimeout(restore);
      window.removeEventListener("hashchange", update);
      window.removeEventListener("pageshow", update);
    };
  }, []);

  return <section className="control-reference" id="control-api" aria-labelledby="control-api-heading">
    <div className="control-reference-intro">
      <p className="eyebrow">LOCAL BINDING REFERENCE</p>
      <h2 id="control-api-heading">Control binding API</h2>
      <p>These are the Formulate-facing types for this app's shadcn bindings. A field definition owns its editing value, schema and default; <code>component</code> selects a local adapter, and <code>componentProps</code> configures it. Formulate supplies the control's value, change and blur handling, disabled state, label and errors. The short declarations below show practical usage; the shadcn links cover each visual component's full API.</p>
    </div>
    <nav className="control-api-index" aria-label="Controls on this page">
      <h3>On this page</h3>
      <div className="control-api-index-groups">{groups.map((group) => <div key={group.id}>
        <h4>{group.title}</h4>
        <ul>{group.controls.map((control) => <li key={control.id}>
          <a href={"#/examples/controls?section=" + control.id} onClick={() => scrollToSection(control.id)}>{control.title}</a>
        </li>)}</ul>
      </div>)}</div>
    </nav>
    <aside className="control-api-principle" aria-labelledby="control-api-principle-heading">
      <h3 id="control-api-principle-heading">Static options and dependent choices</h3>
      <p>The six choice bindings here accept <code>options: readonly ControlOption[]</code>, where each option has a string <code>value</code>, a <code>label</code> and optional <code>disabled</code>. For dependent choices, a field's <code>choices</code> rule loads and validates allowed values. Pass the current <code>useChoice</code> options to the rendered binding so users see those values.</p>
      <SourceCode filename="dependent-choice.tsx" label="Dependent choice binding" kind="Usage example" code={[
        "// In the section definition:",
        "regionId: {",
        "  schema: z.string().min(1), choices: regionChoices,",
        "  defaultValue: \"\", label: \"Region\", component: \"select\",",
        "  componentProps: { options: [] },",
        "}",
        "",
        "// Render within the matching section use:",
        "function RegionField() {",
        "  const view = DeploymentTarget.useChoice(\"regionId\");",
        "  return <DeploymentTarget.Field name=\"regionId\"",
        "    componentProps={{ options: view?.options ?? [] }} />;",
        "}",
      ].join("\n")} />
      <p>The choice view also exposes loading status, validation feedback and retry. Static <code>options</code> and option <code>disabled</code> flags only affect the UI; use a schema or choice rule to enforce accepted values. <a href="#/examples/cloud">See the complete dependent choices example →</a></p>
    </aside>
    {groups.map((group) => <section className="control-api-group" key={group.id} aria-labelledby={"control-group-" + group.id}>
      <h3 id={"control-group-" + group.id}>{group.title}</h3>
      {group.controls.map((control) => <ControlEntry key={control.id} control={control} />)}
    </section>)}
  </section>;
}
