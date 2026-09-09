import { useFormPage } from "./form-tabs";
import { FormContinueButton, FormNavigationButton, FormSubmitButton } from "./form-actions";
import type { FormSubmitButtonProps } from "./form-actions";

/** The available page order supplies default Back/Continue actions. */
export function FormPageActions() {
  const { previous, next, navigate } = useFormPage();
  return <>
    {previous ? <FormNavigationButton onClick={() => navigate(previous.id)}>Back to {previous.label.toLowerCase()}</FormNavigationButton> : null}
    {next ? <FormContinueButton>Continue to {next.label.toLowerCase()}</FormContinueButton> : <FormSubmitButton>Submit</FormSubmitButton>}
  </>;
}

/** Review differs only in its actions: edit links and a final submit. */
export function FormReviewActions({ children = "Save", ...props }: FormSubmitButtonProps) {
  const { current, pages, navigate } = useFormPage();
  return <>
    {pages.filter((page) => page.id !== current.id).map((page) =>
      <FormNavigationButton key={page.id} onClick={() => navigate(page.id)}>Edit {page.label.toLowerCase()}</FormNavigationButton>)}
    <FormSubmitButton {...props}>{children}</FormSubmitButton>
  </>;
}
