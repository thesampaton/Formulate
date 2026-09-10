import { LayoutBody, Page } from "@formulate/react";
import type { CompatibleFieldPath, CorrectionDestination, FormNavigationAction, LayoutProps } from "@formulate/react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { Employment, employmentTypes, managers } from "@/declarations/employment";
import type { EmploymentValues } from "@/declarations/employment";
import { ActionRow, Stack } from "./layouts";
import { FormContinueButton } from "./form-actions";

/** Local page contract. The host composes Employment into its schema and binds
 * this page beneath that section use; neither rules nor paths come from JSX. */
export function EmploymentSetup({ id, active, layout = Stack }: {
  id: string;
  active: boolean;
} & LayoutProps) {
  return <Page id={id} title="Employment details" active={active} layout={Stack}>
    <p>Choose the employment arrangement, start date and manager.</p>
    <LayoutBody layout={layout}><Employment.Fields /></LayoutBody>
    <ActionRow><FormContinueButton>Continue</FormContinueButton></ActionRow>
  </Page>;
}

/** Prototype adapter, kept local until other pages justify a shared contract.
 * Root compatibility checks reads/writes; only prefix construction is erased. */
export function bindEmploymentSetup<Values extends FieldValues, Output>(
  form: UseFormReturn<Values, unknown, Output>,
  root: CompatibleFieldPath<Values, EmploymentValues>,
) {
  const fields = Employment.fieldNames.map((name) => `${root}.${name}` as FieldPath<Values>);
  return {
    root,
    destinations: <Destination extends string>(page: Destination): CorrectionDestination<Values, Destination>[] =>
      fields.map((name) => ({ name, page })),
    continueAction: (id: string | number, onContinue: () => void): FormNavigationAction<Values> => ({
      id, fields: [root], onValid: onContinue,
    }),
    focusFirst: () => form.setFocus(fields[0]!),
  };
}

/** Reads an existing section; it registers no additional editors. */
export function EmploymentSummary() {
  const type = Employment.useWatch("employmentType");
  const start = Employment.useWatch("startDate");
  const manager = Employment.useWatch("managerId");
  return <dl className="review-summary">
    <div><dt>Employment type</dt><dd>{employmentTypes.find((item) => item.value === type)?.label ?? "Not selected"}</dd></div>
    <div><dt>Start date</dt><dd>{start || "Not entered"}</dd></div>
    <div><dt>Manager</dt><dd>{managers.find((item) => item.value === manager)?.label ?? "Not selected"}</dd></div>
  </dl>;
}
