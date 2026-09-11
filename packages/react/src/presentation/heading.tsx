"use client";

import { createContext, useContext } from "react";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingProps = {
  /** Defaults to h2 for a page, h3 for a standalone section, then increments within either. */
  headingLevel?: HeadingLevel;
  classNames?: Partial<Record<"heading" | "description", string>>;
};
export const HeadingContext = createContext<HeadingLevel | null>(null);
export function useHeadingLevel(explicit: HeadingLevel | undefined, fallback: HeadingLevel): HeadingLevel {
  const parent = useContext(HeadingContext);
  return explicit ?? (parent === null ? fallback : Math.min(parent + 1, 6) as HeadingLevel);
}
