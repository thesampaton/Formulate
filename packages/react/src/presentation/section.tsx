"use client";

import { useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { LayoutBody } from "./layout.js";
import type { LayoutProps } from "./layout.js";

import { HeadingContext, useHeadingLevel } from "./heading.js";
import type { HeadingProps } from "./heading.js";

export type SectionProps = Omit<ComponentPropsWithoutRef<"section">, "title"> & LayoutProps & HeadingProps & {
  title: ReactNode;
  description?: ReactNode;
};

/** A named presentation group. It does not introduce a value binding. */
export function Section({ title, description, children, layout, bodyClassName, headingLevel, classNames, ...props }: SectionProps) {
  const headingId = useId();
  const level = useHeadingLevel(headingLevel, 3);
  const Heading = `h${level}` as const;
  return (
    <section {...props} aria-labelledby={headingId} data-formulate="section">
      <Heading id={headingId} data-formulate="heading" className={classNames?.heading}>{title}</Heading>
      {description != null ? <p data-formulate="section-description" className={classNames?.description}>{description}</p> : null}
      <HeadingContext value={level}><LayoutBody layout={layout} bodyClassName={bodyClassName}>{children}</LayoutBody></HeadingContext>
    </section>
  );
}
