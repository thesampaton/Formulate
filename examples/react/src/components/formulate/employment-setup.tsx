import { LayoutBody, Page } from "@formulate/react";
import type { LayoutProps } from "@formulate/react";
import { Employment, employmentTypes, managers } from "@/declarations/employment";
import { ActionRow, Stack } from "./layouts";
import { FormContinueButton } from "./form-actions";

/** Reusable page presentation. Its host supplies one bound Employment section
 * for rendering, the Continue scope and error focus while choosing destinations. */
export function EmploymentSetup({ pageId, active, layout = Stack }: {
  pageId: string;
  active: boolean;
} & LayoutProps) {
  return <Page pageId={pageId} title="Employment details" active={active} layout={Stack}>
    <p>Choose the employment arrangement, start date and manager.</p>
    <LayoutBody layout={layout}><Employment.Fields /></LayoutBody>
    <ActionRow><FormContinueButton>Continue</FormContinueButton></ActionRow>
  </Page>;
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
