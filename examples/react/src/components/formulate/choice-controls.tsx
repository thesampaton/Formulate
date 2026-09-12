import { CheckIcon } from "lucide-react";
import { defineFieldControl, useCompoundFieldBinding, useFieldBinding } from "@/lib/formulate";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { blurOutside } from "./control-utils";
import type { ControlOption } from "./control-utils";

export type CommandControlProps = {
  options: readonly ControlOption[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
};

/** Search/highlight belong to Command; only an explicit selection edits the field. */
export const CommandControl = defineFieldControl<string>()(function CommandControl({
  options, placeholder = "Search options…", emptyMessage = "No options found.", className,
}: CommandControlProps) {
  const { value, onChange, onBlur, name, ...field } = useFieldBinding<string>();
  if (typeof value !== "string") throw new Error(`Field "${name}": CommandControl requires a string editing value.`);
  const selected = options.find((option) => option.value === value)?.label ?? value;
  return <Command className={className} onBlur={(event) => blurOutside(event, onBlur)}>
    <input type="hidden" name={name} value={value} disabled={field.disabled} />
    {/* cmdk supplies its own input IDs. Slot the native input so Formulate's
        label target wins while cmdk still owns search and keyboard events. */}
    <CommandInput asChild>
      <input {...field} placeholder={placeholder} aria-labelledby={`${field.id}-label`}
        aria-describedby={[field["aria-describedby"], `${field.id}-selection`].filter(Boolean).join(" ")} />
    </CommandInput>
    <CommandList aria-labelledby={`${field.id}-label`}>
      <CommandEmpty>{emptyMessage}</CommandEmpty>
      <CommandGroup>
        {options.map((option) => <CommandItem key={option.value} value={option.value} keywords={[option.label]}
          disabled={field.disabled || option.disabled} onSelect={() => { if (!field.disabled && !option.disabled) onChange(option.value); }}>
          <CheckIcon aria-hidden="true" className={value === option.value ? "opacity-100" : "opacity-0"} />{option.label}
        </CommandItem>)}
      </CommandGroup>
    </CommandList>
    <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
      <p id={`${field.id}-selection`} aria-live="polite" className="text-sm text-muted-foreground">{selected ? `Selected: ${selected}` : "No selection"}</p>
      <Button type="button" variant="ghost" size="sm" disabled={field.disabled} onClick={() => onChange("")}>Clear selection</Button>
    </div>
  </Command>;
});

export type ComboboxControlProps = CommandControlProps & { contentClassName?: string; showClear?: boolean };
export const ComboboxControl = defineFieldControl<string>()(function ComboboxControl({
  options, placeholder = "Choose an option", emptyMessage = "No options found.", className, contentClassName, showClear = true,
}: ComboboxControlProps) {
  const field = useCompoundFieldBinding<string>();
  if (typeof field.value !== "string") throw new Error(`Field "${field.triggerProps.name}": ComboboxControl requires a string editing value.`);
  const { name, ...inputProps } = field.triggerProps;
  return <Combobox items={options.map((option) => option.value)} value={field.value || null}
    itemToStringLabel={(value) => options.find((option) => option.value === value)?.label ?? value}
    name={name} disabled={field.disabled} open={field.open} onOpenChange={field.onOpenChange}
    onValueChange={(value) => field.onChange(value ?? "")}>
    <ComboboxInput {...inputProps} placeholder={placeholder} className={className} showClear={showClear} />
    <ComboboxContent {...field.contentProps} className={contentClassName} finalFocus={field.canRestoreFocus}>
      <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
      <ComboboxList>
        {(value: string) => <ComboboxItem key={value} value={value} disabled={options.find((option) => option.value === value)?.disabled}>
          {options.find((option) => option.value === value)?.label ?? value}
        </ComboboxItem>}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>;
});
