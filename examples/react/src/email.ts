import { z } from "zod";
import type { InputControlProps } from "@formulate/react";

// Shared configuration, with no binding or live state. Each use owns its name.
// Preserve the component literal when extracting a declaration from defineForm.
export const Email = {
  schema: z.email("Enter a valid email address."),
  defaultValue: "",
  label: "Email",
  component: "input" as const,
  componentProps: { type: "email", autoComplete: "email", placeholder: "you@example.com" } satisfies InputControlProps,
};
