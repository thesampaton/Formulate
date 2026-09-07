"use client";

import { useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useController } from "react-hook-form";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { FieldContext } from "./field-context.js";

export type FieldRootProps<Values extends FieldValues, Name extends FieldPath<Values>, Output = Values> =
  Omit<ComponentPropsWithoutRef<"div">, "children"> & {
    control: Control<Values, unknown, Output>;
    name: Name;
    label: ReactNode;
    description?: ReactNode;
    children: ReactNode;
  };

/** Connected children share this binding and accessible context. */
export function FieldRoot<Values extends FieldValues, Name extends FieldPath<Values>, Output = Values>({
  control,
  name,
  label,
  description,
  children,
  id,
  ...props
}: FieldRootProps<Values, Name, Output>) {
  const generatedId = useId();
  const controlId = id ?? `formulate-${generatedId}`;
  const { field, fieldState } = useController<Values, Name, Output>({ name, control });
  const descriptionId = description != null ? `${controlId}-description` : undefined;
  const errorId = fieldState.error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div {...props} data-formulate="field" data-invalid={fieldState.invalid || undefined}>
      <label htmlFor={controlId} data-formulate="label">{label}</label>
      {description != null ? <p id={descriptionId} data-formulate="description">{description}</p> : null}
      <FieldContext value={{ ...field, id: controlId, "aria-invalid": fieldState.invalid || undefined, "aria-describedby": describedBy }}>
        {children}
      </FieldContext>
      {fieldState.error ? (
        <p id={errorId} role="alert" data-formulate="error">{fieldState.error.message}</p>
      ) : null}
    </div>
  );
}
