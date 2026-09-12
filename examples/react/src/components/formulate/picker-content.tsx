import type { ComponentProps } from "react";
import { cn } from "cn";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { PopoverContent } from "@/components/ui/popover";

// The installed PopoverContent owns its default Portal. This adapter adds a
// scoped destination without requiring changes to the consumer's shadcn source.
export function PickerContent({ container, ...props }: ComponentProps<typeof PopoverContent> & { container?: HTMLElement | null }) {
  if (container === undefined) return <PopoverContent {...props} />;
  if (container === null) return null;
  const { align = "center", alignOffset, side = "bottom", sideOffset = 4, ...popup } = props;
  return <PopoverPrimitive.Portal container={container}>
    <PopoverPrimitive.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="isolate z-50">
      <PopoverPrimitive.Popup {...popup} data-slot="popover-content"
        className={cn("z-50 flex w-72 flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden", popup.className)} />
    </PopoverPrimitive.Positioner>
  </PopoverPrimitive.Portal>;
}
