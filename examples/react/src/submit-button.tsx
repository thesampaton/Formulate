import type { ComponentProps, ReactNode } from "react";
import { useFormState } from "react-hook-form";

type SubmitButtonProps = Omit<ComponentProps<"button">, "type"> & {
  pendingLabel?: ReactNode;
};

// Local shared UI for these examples; Form still owns submission and validation.
export function SubmitButton({ children, pendingLabel, disabled, ...props }: SubmitButtonProps) {
  const { isSubmitting } = useFormState();
  return (
    <button {...props} type="submit" disabled={disabled || isSubmitting}>
      {isSubmitting ? pendingLabel ?? children : children}
    </button>
  );
}
