"use client";

import { useId } from "react";
import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from "react";
import { useController, useFormContext } from "react-hook-form";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { FieldContext } from "./field-context.js";

export type FieldClassNames = Partial<Record<"label" | "content" | "description" | "error", string>>;

export type FieldPresentationProps = Omit<ComponentPropsWithoutRef<"div">, "id"> & {
  controlId: string;
  classNames?: FieldClassNames;
  label: ReactNode;
  description?: ReactNode;
  descriptionId?: string;
  error?: string;
  errorId?: string;
  invalid: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
};

/** Plain HTML default; applications can supply their locally owned shadcn Field. */
function DefaultFieldPresentation({ controlId, label, description, descriptionId, error, errorId, invalid, orientation, classNames, children, ...props }: FieldPresentationProps) {
  return <div {...props} data-formulate="field" data-invalid={invalid || undefined} data-orientation={orientation}>
    <label id={`${controlId}-label`} className={classNames?.label} htmlFor={controlId} data-formulate="label">{label}</label>
    {description != null ? <p className={classNames?.description} id={descriptionId} data-formulate="description">{description}</p> : null}
    <div data-formulate="field-content" className={classNames?.content}>{children}</div>
    {errorId ? <p className={classNames?.error} id={errorId} role="alert" data-formulate="error">{error}</p> : null}
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
    /** Styling slots for field chrome; control styling stays in componentProps. */
    classNames?: FieldClassNames;
    /** Application-owned field chrome. Normally selected once with createFormulate. */
    presentation?: ComponentType<FieldPresentationProps>;
    /** Classes for the outer field wrapper. Use componentProps.className or the child's className to style the control. */
    className?: string;
    /** Inline styles for the outer field wrapper, rather than the control. */
    style?: ComponentPropsWithoutRef<"div">["style"];
    /** Connected control content receiving this field's value, events, and accessibility attributes. */
    children: ReactNode;
  };

/** Structured editors register their root path; resolver issues may be below it. */
function errorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("message" in error && typeof error.message === "string") return error.message;
  for (const [key, child] of Object.entries(error)) {
    if (["ref", "type", "types"].includes(key)) continue;
    const message = errorMessage(child);
    if (message) return message;
  }
}

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
      descriptionId={descriptionId} error={errorMessage(fieldState.error)} errorId={errorId}
      invalid={fieldState.invalid} orientation={orientation}>
      <FieldContext value={{ ...field, id: controlId, "aria-invalid": fieldState.invalid || undefined, "aria-describedby": describedBy }}>
        {children}
      </FieldContext>
    </Presentation>
  );
}
