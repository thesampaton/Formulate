"use client";

import { useId } from "react";
import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from "react";
import { useController, useFormContext } from "react-hook-form";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { FieldContext } from "./field-context.js";

export type FieldPresentationProps = Omit<ComponentPropsWithoutRef<"div">, "id"> & {
  controlId: string;
  label: ReactNode;
  description?: ReactNode;
  descriptionId?: string;
  error?: string;
  errorId?: string;
  invalid: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
};

/** Plain HTML default; applications can supply their locally owned shadcn Field. */
function DefaultFieldPresentation({ controlId, label, description, descriptionId, error, errorId, invalid, orientation, children, ...props }: FieldPresentationProps) {
  return <div {...props} data-formulate="field" data-invalid={invalid || undefined} data-orientation={orientation}>
    <label htmlFor={controlId} data-formulate="label">{label}</label>
    {description != null ? <p id={descriptionId} data-formulate="description">{description}</p> : null}
    {children}
    {errorId ? <p id={errorId} role="alert" data-formulate="error">{error}</p> : null}
  </div>;
}

export type FieldRootProps<Values extends FieldValues, Name extends FieldPath<Values>, Output = Values> =
  Omit<ComponentPropsWithoutRef<"div">, "children"> & {
    /** RHF control override. Defaults to the parent Form's control; supply this for standalone fields or another runtime. */
    control?: Control<Values, unknown, Output>;
    /** Path of the editing value in the form. */
    name: Name;
    /** Visible label, associated with the connected control for accessibility. */
    label: ReactNode;
    /** Help text associated with the control through aria-describedby. */
    description?: ReactNode;
    /** Label/control arrangement inside the field, separate from its container layout. */
    orientation?: FieldPresentationProps["orientation"];
    /** Application-owned field chrome. Normally selected once with createFormulate. */
    presentation?: ComponentType<FieldPresentationProps>;
    /** Classes for the outer field wrapper. Use componentProps.className or the child's className to style the control. */
    className?: string;
    /** Inline styles for the outer field wrapper, rather than the control. */
    style?: ComponentPropsWithoutRef<"div">["style"];
    /** Connected control content receiving this field's value, events, and accessibility attributes. */
    children: ReactNode;
  };

/** Connected children share this binding and accessible context. */
export function FieldRoot<Values extends FieldValues, Name extends FieldPath<Values>, Output = Values>({
  control,
  name,
  label,
  description,
  orientation,
  presentation: Presentation = DefaultFieldPresentation,
  children,
  id,
  ...props
}: FieldRootProps<Values, Name, Output>) {
  const generatedId = useId();
  const controlId = id ?? `formulate-${generatedId}`;
  const form = useFormContext<Values, unknown, Output>();
  const resolvedControl = control ?? form?.control;
  if (!resolvedControl) throw new Error(`Field "${name}" needs a parent Form or an explicit control.`);
  const { field, fieldState } = useController<Values, Name, Output>({ name, control: resolvedControl });
  const descriptionId = description != null ? `${controlId}-description` : undefined;
  const errorId = fieldState.error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <Presentation {...props} controlId={controlId} label={label} description={description}
      descriptionId={descriptionId} error={fieldState.error?.message} errorId={errorId}
      invalid={fieldState.invalid} orientation={orientation}>
      <FieldContext value={{ ...field, id: controlId, "aria-invalid": fieldState.invalid || undefined, "aria-describedby": describedBy }}>
        {children}
      </FieldContext>
    </Presentation>
  );
}
