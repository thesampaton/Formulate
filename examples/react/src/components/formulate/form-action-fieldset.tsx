import type { ComponentProps } from "react";
import { cn } from "cn";
import { useFormActionStatus } from "@/lib/formulate";

/** Keep editors stable while a form action validates or saves. */
export function FormActionFieldset({ disabled, className, ...props }: ComponentProps<"fieldset">) {
  const { isPending } = useFormActionStatus();
  return <fieldset {...props} disabled={disabled || isPending} className={cn("min-w-0 border-0 p-0", className)} />;
}
