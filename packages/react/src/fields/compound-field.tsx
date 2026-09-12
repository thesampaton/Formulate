"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useFieldBinding } from "./field-context.js";

/** Portal destinations must live inside the application's theme and modal boundary. */
const PortalContext = createContext<HTMLElement | null | undefined>(undefined);
export function FormulatePortalProvider({ container, children }: { container: HTMLElement | null; children: ReactNode }) {
  return <PortalContext value={container}>{children}</PortalContext>;
}
export function useFormulatePortalContainer() {
  return useContext(PortalContext);
}

/** One structured editing value, one primary focus target, and one logical blur boundary.
 * The installed UI primitive still owns keyboard navigation, focus trapping and restoration.
 */
export function useCompoundFieldBinding<Value>() {
  const field = useFieldBinding<Value>();
  const container = useFormulatePortalContainer();
  const [open, setOpen] = useState(false);
  const isOpen = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const content = useRef<HTMLElement | null>(null);
  const suspendedContent = useRef<{ node: HTMLElement; hidden: boolean; inert: boolean } | null>(null);
  const active = useRef(false);

  useLayoutEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      isOpen.current = false;
      // Activity hides its DOM, but a primitive may retain a portal for exit animation.
      // Remove that surface from focus/accessibility immediately when effects detach.
      if (content.current) {
        if (suspendedContent.current?.node !== content.current) {
          suspendedContent.current = { node: content.current, hidden: content.current.hidden, inert: content.current.inert };
        }
        content.current.hidden = true;
        content.current.inert = true;
      }
      // Activity disconnects effects while preserving state. Reopen with a closed picker.
      setOpen(false);
    };
  }, []);
  useEffect(() => {
    if (field.disabled) {
      isOpen.current = false;
      setOpen(false);
    }
  }, [field.disabled]);

  const triggerRef = useCallback((node: HTMLElement | null) => {
    trigger.current = node;
    field.ref(node);
  }, [field.ref]);
  const contentRef = useCallback((node: HTMLElement | null) => { content.current = node; }, []);

  function onOpenChange(next: boolean) {
    if (next && field.disabled) return;
    // A reused popup stays hidden after Activity returns, until explicitly opened.
    const suspended = suspendedContent.current;
    if (next && suspended) {
      suspended.node.hidden = suspended.hidden;
      suspended.node.inert = suspended.inert;
      suspendedContent.current = null;
    }
    const wasOpen = isOpen.current;
    isOpen.current = next;
    setOpen(next);
    if (wasOpen && !next) field.onBlur();
  }
  function onBlur() {
    // Portal focus moves are outside the wrapper DOM, but remain inside this editor.
    queueMicrotask(() => {
      if (!active.current || isOpen.current) return;
      const focused = trigger.current?.ownerDocument.activeElement;
      if (focused && (trigger.current?.contains(focused) || content.current?.contains(focused))) return;
      field.onBlur();
    });
  }

  return {
    value: field.value,
    onChange: field.onChange,
    disabled: field.disabled,
    open: open && !field.disabled,
    onOpenChange,
    // Each UI binding maps this policy to its own close/final-focus API.
    canRestoreFocus: () => active.current && !field.disabled,
    portalContainer: container,
    triggerProps: {
      id: field.id, name: field.name, ref: triggerRef, disabled: field.disabled,
      onBlur, "aria-invalid": field["aria-invalid"], "aria-describedby": field["aria-describedby"],
      "data-formulate": "control",
    },
    contentProps: {
      ref: contentRef, onBlur,
      "aria-labelledby": `${field.id}-label`,
      "aria-describedby": field["aria-describedby"],
      "data-formulate": "control-content",
    },
  };
}
