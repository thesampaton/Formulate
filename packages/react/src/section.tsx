import { useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type SectionProps = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
};

/** A named presentation group. It does not introduce a value binding. */
export function Section({ title, description, children, ...props }: SectionProps) {
  const headingId = useId();
  return (
    <section {...props} aria-labelledby={headingId} data-formulate="section">
      <h3 id={headingId}>{title}</h3>
      {description != null ? <p>{description}</p> : null}
      {children}
    </section>
  );
}
