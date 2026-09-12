import { BookOpen, ChevronRight, Layers2, X } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { exampleGroups, getPage, type SitePage } from "./example-navigation";
import { Overview } from "./overview";

const ExamplePage = lazy(() => import("./example-page"));

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function getLocation() {
  return window.location.hash;
}

function AppSidebar({ page }: { page: SitePage }) {
  const { isMobile, state, setOpenMobile } = useSidebar();
  const closeMobile = () => setOpenMobile(false);

  return (
    <Sidebar className="border-sidebar-border" inert={!isMobile && state === "collapsed" ? true : undefined}>
      <SidebarHeader className="px-5 pb-6 pt-7">
        <div className="flex items-center justify-between">
          <a href="#/overview" className="wordmark flex items-center gap-2.5" onClick={closeMobile} aria-label="Formulate overview">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Layers2 className="size-4" /></span>
            formulate<span className="font-normal text-muted-foreground">/</span>
          </a>
          {isMobile ? <Button variant="ghost" size="icon-sm" aria-label="Close navigation" onClick={closeMobile}><X /></Button> : null}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">A guide to forms that grow.</p>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Documentation" className="px-3">
          <SidebarGroup>
            <SidebarGroupLabel>Start here</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<a href="#/overview" />} isActive={page.id === "overview"} aria-current={page.id === "overview" ? "page" : undefined} className="site-nav-link" onClick={closeMobile}>
                    <BookOpen /><span>Overview</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {exampleGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.examples.map((example) => (
                    <SidebarMenuItem key={example.id}>
                      <SidebarMenuButton render={<a href={`#/examples/${example.id}`} />} isActive={page.id === example.id} aria-current={page.id === example.id ? "page" : undefined} className="site-nav-link" onClick={closeMobile}>
                        <span className="w-5 shrink-0 font-mono text-[11px] text-muted-foreground">{example.number}</span>{" "}
                        <span>{example.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter className="gap-2 border-t px-6 py-5">
        <p className="flex items-center gap-2 text-xs font-medium"><span className="size-1.5 rounded-full bg-primary" />An evolving prototype</p>
        <p className="text-xs leading-relaxed text-muted-foreground">Examples use local demo handlers. Switching examples starts a fresh form.</p>
      </SidebarFooter>
    </Sidebar>
  );
}

export function App() {
  const hash = useSyncExternalStore(subscribeToLocation, getLocation);
  const page = getPage(hash);
  const mainRef = useRef<HTMLElement>(null);
  const previousPage = useRef(page.id);

  useEffect(() => {
    document.title = `${page.title} · Formulate`;
    if (previousPage.current !== page.id) {
      mainRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
      previousPage.current = page.id;
    }
  }, [page.id, page.title]);

  return (
    <TooltipProvider>
      <SidebarProvider style={{ "--sidebar-width": "17rem" } as CSSProperties}>
        <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
        <AppSidebar page={page} />
        <SidebarInset ref={mainRef} id="main-content" tabIndex={-1} className="min-w-0 outline-none">
          <header className="site-header">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <nav aria-label="Breadcrumb" className="min-w-0">
                <ol className="flex items-center gap-2 text-sm">
                  <li className="hidden text-muted-foreground sm:block">{page.id === "overview" ? "Guide" : "Examples"}</li>
                  <li aria-hidden="true" className="hidden sm:block"><ChevronRight className="size-3 text-muted-foreground" /></li>
                  <li aria-current="page" className="truncate font-medium">{page.title}</li>
                </ol>
              </nav>
            </div>
            <span className="badge shrink-0">Prototype 01</span>
          </header>
          <div className="site-content">
            {page.id === "overview" ? <Overview /> : (
              <Suspense fallback={<p className="py-12 text-sm text-muted-foreground" role="status">Loading example…</p>}>
                <ExamplePage key={page.id} example={page.id} title={page.title} />
              </Suspense>
            )}
            <footer className="site-footer">Formulate <span>—</span> Composable forms. UI you own.</footer>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
