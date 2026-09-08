import type { FieldPresentationProps } from "@/lib/formulate";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

/** Formulate owns binding and IDs; the locally installed shadcn Field owns markup. */
export function ShadcnField({ controlId, label, description, descriptionId, error, errorId, invalid, orientation = "vertical", children, ...props }: FieldPresentationProps) {
  const labelId = `${controlId}-label`;
  const labelContent = <FieldLabel id={labelId} htmlFor={controlId} data-formulate="label">{label}</FieldLabel>;
  const help = description != null ? <FieldDescription id={descriptionId} data-formulate="description">{description}</FieldDescription> : null;
  const message = errorId ? <FieldError id={errorId} data-formulate="error">{error}</FieldError> : null;
  return <Field {...props} orientation={orientation} data-formulate="field" data-invalid={invalid || undefined}>
    {orientation === "horizontal" ? <>
      {children}
      <FieldContent>{labelContent}{help}{message}</FieldContent>
    </> : <>
      {labelContent}
      <FieldContent>{children}{help}{message}</FieldContent>
    </>}
  </Field>;
}
