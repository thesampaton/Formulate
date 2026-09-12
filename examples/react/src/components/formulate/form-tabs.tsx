import type { ComponentProps, ReactNode } from "react";
import { Activity, createContext, useContext } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "cn";
import { Page, useFormActionStatus } from "@/lib/formulate";
import type { FormLayout, PageProps } from "@/lib/formulate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FormTabStatus = "incomplete" | "complete" | "checking" | "ready" | "pending";
const statusLabels: Record<FormTabStatus, string> = { incomplete: "Incomplete", complete: "Complete", checking: "Checking", ready: "Ready", pending: "Pending" };
export type FormTabItem<Id extends string> = { id: Id; label: string; status: FormTabStatus; disabled?: boolean };
type TabsContextValue = {
  value: string;
  pages: readonly FormTabItem<string>[];
  pageLayout?: FormLayout | null;
  navigate: (page: string) => void;
};
const FormTabsContext = createContext<TabsContextValue | null>(null);
type PageContextValue = Pick<TabsContextValue, "pages" | "navigate"> & {
  current: FormTabItem<string>;
  previous?: FormTabItem<string>;
  next?: FormTabItem<string>;
  actions?: ReactNode;
};
const FormPageContext = createContext<PageContextValue | null>(null);

export function useFormPage() {
  const page = useContext(FormPageContext);
  if (!page) throw new Error("useFormPage needs a parent FormTabPage.");
  return page;
}

export type FormTabsProps<Id extends string> = {
  pages: readonly FormTabItem<Id>[];
  value: NoInfer<Id>;
  onValueChange: (page: Id) => void;
  /** Back/edit links can also focus the destination's first editor. */
  onNavigate?: (page: Id) => void;
  /** Inherited by nested FormTabPage bodies; each page may override it. */
  pageLayout?: FormLayout | null;
  label: string;
  children: ReactNode;
  className?: string;
};

/** Controlled form navigation over shadcn Tabs. The caller owns page state and
 * completion; tab visits do not validate, submit or mark requirements complete. */
export function FormTabs<Id extends string>({ pages, value, onValueChange, onNavigate = onValueChange, pageLayout, label, children, className }: FormTabsProps<Id>) {
  const { isPending } = useFormActionStatus();
  const navigate = (value: string) => {
    const target = pages.find((page) => page.id === value);
    if (!isPending && target && !target.disabled) onNavigate(target.id);
  };
  return <Tabs value={value} onValueChange={(value) => {
    const target = pages.find((page) => page.id === value);
    if (!isPending && target && !target.disabled) onValueChange(target.id);
  }} className={cn("min-w-0 gap-6", className)}>
    <FormTabsContext value={{ value, pages, pageLayout, navigate }}>
      <div className="overflow-x-auto pb-1">
        <TabsList activateOnFocus={false} aria-label={label} className="w-full min-w-max justify-start group-data-[orientation=horizontal]/tabs:h-auto">
          {pages.map(({ id, label, status, disabled }) => {
            const Icon = status === "complete" ? CheckCircle2 : Circle;
            return <TabsTrigger key={id} value={id} disabled={disabled || isPending}
              className="h-auto gap-2 px-3 py-2" aria-label={`${label}: ${statusLabels[status]}`}>
              <Icon aria-hidden="true" className={status === "complete" ? "text-primary" : "text-muted-foreground"} />
              <span className="text-left">{label}<span className="block text-[10px] font-normal">{statusLabels[status]}</span></span>
            </TabsTrigger>;
          })}
        </TabsList>
      </div>
      {children}
    </FormTabsContext>
  </Tabs>;
}

/** Keep shadcn's panel shell/ARIA links; Activity preserves each tab's UI state. */
export function FormTabPanel({ children, ...props }: Omit<ComponentProps<typeof TabsContent>, "keepMounted" | "hidden">) {
  const tabs = useContext(FormTabsContext);
  if (!tabs) throw new Error("FormTabPanel needs a parent FormTabs.");
  const active = tabs.value === props.value;
  return <TabsContent {...props} keepMounted hidden={!active}><Activity mode={active ? "visible" : "hidden"}>{children}</Activity></TabsContent>;
}

/** A semantic page inheriting its body layout and navigation from the parent tabs. */
export function FormTabPage({ value, layout, actions, ...props }: Omit<PageProps, "pageId" | "active"> & {
  value: string;
  actions?: ReactNode;
}) {
  const tabs = useContext(FormTabsContext);
  if (!tabs) throw new Error("FormTabPage needs a parent FormTabs.");
  const current = tabs.pages.find((page) => page.id === value);
  if (!current) throw new Error(`FormTabPage "${value}" is missing from FormTabs.pages.`);
  const available = tabs.pages.filter((page) => !page.disabled || page.id === value);
  const index = available.findIndex((page) => page.id === value);
  return <FormTabPanel value={value}>
    <FormPageContext value={{ current, pages: available, previous: available[index - 1], next: available[index + 1], navigate: tabs.navigate, actions }}>
      <Page {...props} pageId={value} layout={layout === undefined ? tabs.pageLayout : layout} />
    </FormPageContext>
  </FormTabPanel>;
}
