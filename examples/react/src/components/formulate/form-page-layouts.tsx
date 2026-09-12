import type { ReactNode } from "react";
import { Field, FieldGroup } from "@/components/ui/field";
import { useFormPage } from "./form-tabs";
import { FormPageActions } from "./form-page-actions";

/** Place page content above its default or supplied actions. */
export function FormStepLayout({ children }: { children?: ReactNode }) {
  const { actions } = useFormPage();
  return <FieldGroup>
    {children}
    {actions === null ? null : <Field orientation="horizontal" className="flex-wrap">{actions ?? <FormPageActions />}</Field>}
  </FieldGroup>;
}
