import { useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { LayoutBody } from "./layout.js";
import type { LayoutProps } from "./layout.js";

export type SectionProps = Omit<ComponentPropsWithoutRef<"section">, "title"> & LayoutProps & {
  title: ReactNode;
  description?: ReactNode;
};

/** A named presentation group. It does not introduce a value binding. */
export function Section({ title, description, children, layout, ...props }: SectionProps) {
  const headingId = useId();
  return (
    <section {...props} aria-labelledby={headingId} data-formulate="section">
      <h3 id={headingId}>{title}</h3>
      {description != null ? <p>{description}</p> : null}
      <LayoutBody layout={layout}>{children}</LayoutBody>
    </section>
  );
}
