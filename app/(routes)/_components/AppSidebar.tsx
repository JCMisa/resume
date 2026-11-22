"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  FileStack,
  LayoutDashboard,
  LayoutGrid,
  PlusCircle,
  Settings,
  Sparkles,
  Video,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { inSection, isChildActive, parentTone } from "@/lib/nav";

type NavLink = { title: string; url: string; icon: React.ElementType };
type NavItem = NavLink & { children?: NavLink[] };

// One list for everyone; admin-only entries can be appended in navFor().
const NAV: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Resumes",
    url: "/resumes",
    icon: FileStack,
    children: [
      { title: "My resumes", url: "/resumes", icon: LayoutGrid },
      { title: "Create resume", url: "/resumes/create", icon: PlusCircle },
      { title: "Analyze with AI", url: "/resumes/analyze", icon: Sparkles },
    ],
  },
  { title: "Mock Interviews", url: "/interviews", icon: Video },
  { title: "Settings", url: "/settings", icon: Settings },
];

function navFor(role: "admin" | "user" | null | undefined): NavItem[] {
  void role; // no admin-only entries yet
  return NAV;
}

// Strong highlight (current page) vs soft (section of the current page)
const TONE = {
  strong:
    "bg-primary! text-primary-foreground! shadow-lg shadow-primary/30 hover:bg-primary!",
  soft: "bg-primary/10! text-foreground! hover:bg-primary/15!",
  idle: "text-muted-foreground! hover:bg-muted! hover:text-foreground!",
} as const;

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: "admin" | "user" | null;
}

export function AppSidebar({ userRole = "user", ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = !isMobile && state === "collapsed";
  const items = navFor(userRole);

  // Groups start expanded; entering a group's section re-opens it.
  const [closed, setClosed] = React.useState<Set<string>>(() => new Set());
  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) {
    // Adjust state during render (no effect): open the group we navigated into
    setLastPath(pathname);
    const entered = items.find(
      (i) =>
        i.children && inSection(pathname, i.url) && !inSection(lastPath, i.url),
    );
    if (entered && closed.has(entered.url)) {
      const next = new Set(closed);
      next.delete(entered.url);
      setClosed(next);
    }
  }

  const toggle = (url: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });

  // Close the mobile sheet after navigating
  const onNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className={cn("mb-3", isCollapsed && "flex justify-center mt-3")}>
          <Link
            href="/"
            onClick={onNavigate}
            className={cn("flex items-center", !isCollapsed && "ml-3")}
          >
            {!isCollapsed && (
              <p className="font-extrabold tracking-wider text-2xl">ResuM</p>
            )}
            <Image
              src="/logo.svg"
              loading="lazy"
              alt="logo"
              width={25}
              height={25}
            />
          </Link>
        </div>
      </SidebarHeader>

      <Separator orientation="horizontal" />

      <SidebarContent className="custom-scrollbar mt-3">
        <SidebarGroup className={cn(isCollapsed && "px-1")}>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => {
                const Icon = item.icon;
                const sectionActive = inSection(pathname, item.url);
                const exactChild = item.children?.find(
                  (c) => c.url === pathname,
                );
                const expanded =
                  Boolean(item.children) && !closed.has(item.url);
                const childrenVisible = expanded && !isCollapsed;

                // Parent is the strong highlight unless a visible child is the
                // exact page (then the child is strong and the parent soft).
                // Pages with no matching child (e.g. /resumes/[id]) keep the parent strong.
                const tone = parentTone(pathname, item, childrenVisible);
                const showDot =
                  sectionActive && tone === "strong" && !isCollapsed;

                return (
                  <SidebarMenuItem key={item.url}>
                    <div className="relative">
                      <SidebarMenuButton
                        asChild
                        isActive={sectionActive}
                        tooltip={
                          isCollapsed
                            ? item.children
                              ? `${item.title}: ${item.children.map((c) => c.title).join(", ")}`
                              : item.title
                            : undefined
                        }
                      >
                        <Link
                          href={item.url}
                          onClick={onNavigate}
                          aria-current={
                            pathname === item.url && !exactChild
                              ? "page"
                              : undefined
                          }
                          className={cn(
                            "flex items-center relative transition-all duration-300 [&_svg]:size-5!",
                            isCollapsed
                              ? // Icon mode: a centered 40px square (overrides
                                // the library's forced 32px + p-2)
                                "size-10! p-0! mx-auto justify-center rounded-xl"
                              : "py-8 rounded-xl",
                            item.children && !isCollapsed && "pr-12",
                            TONE[tone],
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center justify-center shrink-0",
                              !isCollapsed && "size-10",
                            )}
                          >
                            <Icon />
                          </div>
                          {!isCollapsed && (
                            <div className="text-lg! tracking-wider font-extrabold! truncate">
                              {item.title}
                            </div>
                          )}
                          {showDot && !item.children && (
                            <div className="absolute right-4 size-1.5 rounded-full bg-current opacity-80" />
                          )}
                        </Link>
                      </SidebarMenuButton>

                      {/* Expand/collapse toggle (hidden in icon mode, where the
                        parent link goes straight to the Resumes dashboard) */}
                      {item.children && !isCollapsed && (
                        <button
                          type="button"
                          onClick={() => toggle(item.url)}
                          aria-expanded={expanded}
                          aria-controls={`nav-sub-${item.title}`}
                          aria-label={`${expanded ? "Collapse" : "Expand"} ${item.title}`}
                          className={cn(
                            "absolute right-2 top-1/2 -translate-y-1/2 z-10 size-8 rounded-lg flex items-center justify-center transition-colors",
                            tone === "strong"
                              ? "text-primary-foreground hover:bg-black/10"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform duration-200",
                              expanded ? "rotate-0" : "-rotate-90",
                            )}
                          />
                        </button>
                      )}
                    </div>

                    {item.children && (
                      <div
                        id={`nav-sub-${item.title}`}
                        className={cn(
                          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                          childrenVisible
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0",
                        )}
                        // Collapsed children stay out of the tab order
                        inert={!childrenVisible}
                      >
                        <div className="overflow-hidden">
                          <SidebarMenuSub className="mt-1.5 gap-1 mx-5 py-1">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const active = isChildActive(pathname, child.url);
                              return (
                                <SidebarMenuSubItem key={child.url}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={active}
                                    className={cn(
                                      "h-10 rounded-xl px-3 gap-2.5 font-bold transition-colors",
                                      active
                                        ? "bg-primary! text-primary-foreground! shadow-md shadow-primary/25 [&>svg]:text-primary-foreground!"
                                        : "text-muted-foreground hover:text-foreground [&>svg]:text-muted-foreground",
                                    )}
                                  >
                                    <Link
                                      href={child.url}
                                      onClick={onNavigate}
                                      aria-current={active ? "page" : undefined}
                                    >
                                      <ChildIcon />
                                      <span>{child.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </div>
                      </div>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
