import { Activity, useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { LayoutBody } from "./layout.js";
import type { LayoutProps } from "./layout.js";

export type PageProps = Omit<ComponentPropsWithoutRef<"section">, "title"> & LayoutProps & {
  /** Logical page marker, rendered as data-page. */
  pageId: string;
  title: ReactNode;
  active?: boolean;
};

/** The host chooses the active page. Activity preserves inactive UI state and pauses its effects; the form survives. */
export function Page({ pageId, title, active = true, children, layout, ...props }: PageProps) {
  const headingId = useId();
  return (
    <Activity mode={active ? "visible" : "hidden"}>
      <section {...props} aria-labelledby={headingId} data-formulate="page" data-page={pageId}>
        <h2 id={headingId}>{title}</h2>
        <LayoutBody layout={layout}>{children}</LayoutBody>
      </section>
    </Activity>
  );
}
