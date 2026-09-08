import { Fragment } from "react";
import type { ComponentType, ReactNode } from "react";

/** A stable, module-level component arranging children without owning form state. */
export type FormLayout = ComponentType<{ children?: ReactNode }>;
export type LayoutProps = {
  /** Arranges this container's body. A supplied layout replaces its default; null removes it. */
  layout?: FormLayout | null;
};

export function LayoutBody({ layout, children }: LayoutProps & { children?: ReactNode }) {
  const Layout = layout ?? Fragment;
  return <Layout>{children}</Layout>;
}
