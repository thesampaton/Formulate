"use client";

import { Activity, useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { LayoutBody } from "./layout.js";
import type { LayoutProps } from "./layout.js";

import { HeadingContext, useHeadingLevel } from "./heading.js";
import type { HeadingProps } from "./heading.js";

export type PageProps = Omit<ComponentPropsWithoutRef<"section">, "title"> & LayoutProps & HeadingProps & {
  /** Logical page marker, rendered as data-page. */
  pageId: string;
  title: ReactNode;
  active?: boolean;
};

/** The host chooses the active page. Activity preserves inactive UI state and pauses its effects; the form survives. */
export function Page({ pageId, title, active = true, children, layout, bodyClassName, headingLevel, classNames, ...props }: PageProps) {
  const headingId = useId();
  const level = useHeadingLevel(headingLevel, 2);
  const Heading = `h${level}` as const;
  return (
    <Activity mode={active ? "visible" : "hidden"}>
      <section {...props} aria-labelledby={headingId} data-formulate="page" data-page={pageId}>
        <Heading id={headingId} data-formulate="heading" className={classNames?.heading}>{title}</Heading>
        <HeadingContext value={level}><LayoutBody layout={layout} bodyClassName={bodyClassName}>{children}</LayoutBody></HeadingContext>
      </section>
    </Activity>
  );
}
