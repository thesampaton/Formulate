import type { ComponentProps, ReactNode } from "react";
import { useFormActionStatus } from "@/lib/formulate";
import { Button } from "@/components/ui/button";

export type FormSubmitButtonProps = Omit<ComponentProps<typeof Button>, "type"> & { pendingLabel?: ReactNode };

/** Submits the enclosing Form's current action: scoped Continue or final save. */
export function FormSubmitButton({ children, pendingLabel, disabled, ...props }: FormSubmitButtonProps) {
  const { isPending } = useFormActionStatus();
  return <Button {...props} type="submit" disabled={disabled || isPending}>
    {isPending ? pendingLabel ?? children : children}
  </Button>;
}

/** A Continue affordance; Form.navigation supplies validation and destination. */
export function FormContinueButton({ pendingLabel = "Checking…", ...props }: FormSubmitButtonProps) {
  return <FormSubmitButton {...props} pendingLabel={pendingLabel} />;
}

export type FormNavigationButtonProps = Omit<ComponentProps<typeof Button>, "type" | "onClick"> & {
  onClick: NonNullable<ComponentProps<typeof Button>["onClick"]>;
};

/** Back/edit navigation never submits, and is disabled during a form action. */
export function FormNavigationButton({ disabled, variant = "outline", ...props }: FormNavigationButtonProps) {
  const { isPending } = useFormActionStatus();
  return <Button {...props} variant={variant} type="button" disabled={disabled || isPending} />;
}
