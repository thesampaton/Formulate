import type { ComponentProps } from "react";
import { cn } from "cn";
import { defineFieldControl, useComposedFieldBinding, type ResolvedValueSegment } from "@/lib/formulate";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { blurOutside } from "./control-utils";

// Fragment inputs are text editors. Validation (including patterns, email and
// URL rules) belongs to the schema of the final string, not these fragments.
export type ComposedInputControlProps = Pick<ComponentProps<typeof InputGroupInput>,
  "autoComplete" | "autoCapitalize" | "autoCorrect" | "inputMode" | "spellCheck" | "readOnly"
> & {
  className?: string;
  inputClassName?: string;
  segmentClassName?: string;
};

function FixedSegment({ segment, className }: { segment: ResolvedValueSegment; className?: string }) {
  return <InputGroupText data-formulate-segment={segment.kind} className={cn(
    "inline whitespace-pre",
    segment.kind !== "literal" && "rounded bg-muted px-1 font-mono text-xs",
    className,
  )}>{segment.value}</InputGroupText>;
}

/** Several visible pieces edit one canonical string owned by the field binding. */
export const ComposedInputControl = defineFieldControl<string>()(function ComposedInputControl({
  className, inputClassName, segmentClassName, ...inputProps
}: ComposedInputControlProps) {
  const field = useComposedFieldBinding();
  const firstInput = field.segments.findIndex((segment) => segment.kind === "input");
  const inputCount = field.segments.filter((segment) => segment.kind === "input").length;
  const multiple = inputCount > 1;
  const labelId = `${field.id}-label`;

  function input(segment: ResolvedValueSegment, index: number) {
    if (segment.kind !== "input") return null;
    const segmentLabelId = `${field.id}-segment-${index}-label`;
    return <InputGroupInput {...inputProps} key={index} type="text"
      id={index === firstInput ? field.id : `${field.id}-segment-${index}`}
      ref={index === firstInput ? field.ref : undefined}
      value={segment.value} disabled={field.disabled} placeholder={segment.placeholder}
      aria-labelledby={multiple ? `${labelId} ${segmentLabelId}` : labelId}
      aria-describedby={field["aria-describedby"]} aria-invalid={field["aria-invalid"]}
      className={cn(multiple && "w-0 min-w-12 basis-16 px-1.5", inputClassName)}
      onChange={(event) => field.onInputChange(index, event.target.value)} />;
  }

  return <>
    <InputGroup className={cn(
      multiple && "h-auto min-h-8 flex-wrap gap-1 px-2",
      firstInput < 0 && "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[disabled=true]:bg-input/50 data-[disabled=true]:opacity-50",
      className,
    )}
      id={firstInput < 0 ? field.id : undefined} ref={firstInput < 0 ? field.ref : undefined}
      role={firstInput < 0 ? "textbox" : "group"} aria-readonly={firstInput < 0 ? true : undefined}
      tabIndex={firstInput < 0 && !field.disabled ? 0 : undefined} aria-disabled={field.disabled || undefined}
      aria-labelledby={labelId} aria-describedby={field["aria-describedby"]}
      aria-invalid={field["aria-invalid"]} data-disabled={field.disabled || undefined}
      onBlur={(event) => blurOutside(event, field.onBlur)}>
      {multiple ? field.segments.map((segment, index) => segment.kind === "input"
        ? input(segment, index)
        : <FixedSegment key={index} segment={segment} className={segmentClassName} />)
        : <>
          {/* shadcn places the input first in DOM; addon alignment supplies visual order. */}
          {firstInput >= 0 ? input(field.segments[firstInput]!, firstInput) : null}
          {firstInput !== 0 ? <InputGroupAddon align="inline-start" className="gap-0">
            {field.segments.slice(0, firstInput < 0 ? undefined : firstInput).map((segment, index) =>
              <FixedSegment key={index} segment={segment} className={segmentClassName} />)}
          </InputGroupAddon> : null}
          {firstInput >= 0 && firstInput < field.segments.length - 1 ? <InputGroupAddon align="inline-end" className="gap-0">
            {field.segments.slice(firstInput + 1).map((segment, index) =>
              <FixedSegment key={index} segment={segment} className={segmentClassName} />)}
          </InputGroupAddon> : null}
        </>}
    </InputGroup>
    {multiple ? field.segments.map((segment, index) => segment.kind === "input"
      ? <span key={index} id={`${field.id}-segment-${index}-label`} className="sr-only">
        {segment.label ?? `Part ${field.segments.slice(0, index + 1).filter((part) => part.kind === "input").length}`}
      </span> : null) : null}
    {/* Only the complete scalar participates in native FormData. */}
    <input type="hidden" name={field.name} value={field.value} disabled={field.disabled} />
  </>;
});
