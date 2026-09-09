import type { ReactNode } from "react";
import { Stack, ActionRow } from "./layouts";
import { useFormPage } from "./form-tabs";
import { FormPageActions } from "./form-page-actions";

/** Place page content above its default or supplied actions. */
export function FormStepLayout({ children }: { children?: ReactNode }) {
  const { actions } = useFormPage();
  return <Stack>
    {children}
    {actions === null ? null : <ActionRow>{actions ?? <FormPageActions />}</ActionRow>}
  </Stack>;
}
