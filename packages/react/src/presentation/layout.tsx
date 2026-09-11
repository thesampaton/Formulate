import { Fragment } from "react";
import type { ComponentType, ReactNode } from "react";

/** A stable, module-level component arranging children without owning form state. */
export type FormLayout = ComponentType<{ children?: ReactNode }>;
export type LayoutProps = {
  /** Arranges this container's body. A supplied layout replaces its default; null removes it. */
  layout?: FormLayout | null;
  /** Optional body slot; wraps the layout when supplied. */
  bodyClassName?: string;
};

export function LayoutBody({ layout, bodyClassName, children }: LayoutProps & { children?: ReactNode }) {
  const Layout = layout ?? Fragment;
  return bodyClassName === undefined ? <Layout>{children}</Layout> : <div data-formulate="body" className={bodyClassName}><Layout>{children}</Layout></div>;
}
