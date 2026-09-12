import type { FocusEvent } from "react";

export type BindingProps = "ref" | "id" | "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "disabled" | "aria-invalid" | "aria-describedby";
export type ControlOption = { value: string; label: string; disabled?: boolean };

/** Moving between parts of one editor is not a field blur. */
export function blurOutside(event: FocusEvent<HTMLElement>, onBlur: () => void) {
  if (!event.currentTarget.contains(event.relatedTarget)) onBlur();
}
