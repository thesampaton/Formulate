import type { ComponentProps } from "react";
import { cn } from "cn";
import { FieldGroup } from "@/components/ui/field";

/** Shared form/page/section body layout. Owns spacing, never form state. */
export function Stack({ className, ...props }: ComponentProps<typeof FieldGroup>) {
  return <FieldGroup {...props} className={cn("min-w-0 gap-5 [&>button]:self-start", className)} />;
}

/** Fields share available width, wrapping in DOM order when each needs more room. */
export function Row({ className, ...props }: ComponentProps<typeof FieldGroup>) {
  return <FieldGroup {...props} data-formulate-layout="row" className={cn(
    "min-w-0 flex-row flex-wrap items-start gap-5 [&>*]:min-w-0 [&>*]:flex-[1_1_14rem]", className,
  )} />;
}

/** Arrange action controls without choosing what they do. */
export function ActionRow({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("flex flex-wrap items-center gap-2", className)} />;
}
