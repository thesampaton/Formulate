// Compile-time assertions; included by pnpm typecheck, never rendered.
import { z } from "zod";
import { defineForm, field } from "../examples/react/src/lib/formulate-config";
import { ControlGallery } from "../examples/react/src/declarations/control-gallery";
import { Country, Email } from "../examples/react/src/declarations/common-fields";

export function additionalControlTypes() {
  const form = ControlGallery.useForm();
  const date: Date | null = form.getValues("datePicker");
  const amount: number = form.getValues("slider");
  const code: string = form.getValues("inputOTP");
  const multiple: string[] = form.getValues("multiToggleGroup");
  <ControlGallery.Field name="textarea" componentProps={{ rows: 5 }} />;
  <ControlGallery.Field name="inputOTP" componentProps={{ maxLength: 8, inputMode: "text", pattern: "[a-z]*" }} />;
  // @ts-expect-error DatePicker edits a nullable Date, not an ISO string.
  defineForm({ date: { schema: z.string(), defaultValue: "", label: "Date", component: "datePicker" } });
  // @ts-expect-error Calendar has the same date contract as DatePicker.
  defineForm({ date: { schema: z.string(), defaultValue: "", label: "Date", component: "calendar" } });
  // @ts-expect-error Sliders edit numbers, not text or arrays.
  defineForm({ value: { schema: z.array(z.number()), defaultValue: [], label: "Slider", component: "slider" } });
  // @ts-expect-error Switches edit booleans.
  field(Email, { component: "switch" });
  // @ts-expect-error OTP preserves leading zeroes as a string.
  defineForm({ code: { schema: z.number(), defaultValue: 0, label: "Code", component: "inputOTP" } });
  // @ts-expect-error Single toggle groups edit strings.
  defineForm({ values: { schema: z.array(z.string()), defaultValue: [], label: "Choices", component: "toggleGroup", componentProps: { options: [] } } });
  // @ts-expect-error Multiple toggle groups edit arrays.
  field(Country, { component: "multiToggleGroup", componentProps: { options: [] } });
  // @ts-expect-error Choice options are required.
  field(Country);
  // @ts-expect-error Command also requires options.
  field(Country, { component: "command" });
  // @ts-expect-error Radio choices require string option values.
  field(Country, { component: "radioGroup", componentProps: { options: [{ value: 1, label: "One" }] } });
  // @ts-expect-error Instance props cannot replace managed event handlers.
  field(Email, { component: "textarea", componentProps: { rows: 3, onChange: () => {} } });
  // @ts-expect-error Calendar selection is owned by the binding.
  <ControlGallery.Field name="calendar" componentProps={{ selected: new Date() }} />;
  // @ts-expect-error Scalar/array choice mode is determined by the selected binding.
  <ControlGallery.Field name="toggleGroup" componentProps={{ type: "multiple" }} />;
  // @ts-expect-error Base UI's render API stays inside the binding.
  <ControlGallery.Field name="checkbox" componentProps={{ render: <button /> }} />;
  // @ts-expect-error The boolean field contract has no indeterminate state.
  <ControlGallery.Field name="checkbox" componentProps={{ indeterminate: true }} />;
  // @ts-expect-error Consumers cannot replace the managed input ref.
  <ControlGallery.Field name="switch" componentProps={{ inputRef: () => {} }} />;
  // @ts-expect-error Base UI state callbacks are not declaration styling props.
  <ControlGallery.Field name="radioGroup" componentProps={{ className: () => "grid" }} />;
  // @ts-expect-error Scalar/array semantics do not come from Base UI's multiple flag.
  <ControlGallery.Field name="toggleGroup" componentProps={{ multiple: true }} />;
  void date; void amount; void code; void multiple;
}
