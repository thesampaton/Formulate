import type { ComponentProps, ReactNode } from "react";
import { useFormActionStatus } from "@formulate/react";

type SubmitButtonProps = Omit<ComponentProps<"button">, "type"> & {
  pendingLabel?: ReactNode;
};

// Local shared UI for these examples; Form still owns submission and validation.
export function SubmitButton({ children, pendingLabel, disabled, ...props }: SubmitButtonProps) {
  const { isPending } = useFormActionStatus();
  return (
    <button {...props} type="submit" disabled={disabled || isPending}>
      {isPending ? pendingLabel ?? children : children}
    </button>
  );
}
