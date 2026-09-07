import { useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type PageProps = Omit<ComponentPropsWithoutRef<"section">, "title" | "id"> & {
  id: string;
  title: ReactNode;
  active?: boolean;
};

/** The host chooses the active page. Inactive editors unmount; the form survives. */
export function Page({ id, title, active = true, children, ...props }: PageProps) {
  const headingId = useId();
  if (!active) return null;
  return (
    <section {...props} aria-labelledby={headingId} data-formulate="page" data-page={id}>
      <h2 id={headingId}>{title}</h2>
      {children}
    </section>
  );
}
