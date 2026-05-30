"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar"; // 🚀 Re-activated shadcn sidebar context hook
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Video,
  Sparkles,
  Users,
  Settings,
  BarChart3,
  ShieldAlert,
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
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";

const menuItems = {
  admin: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      title: "System Resumes",
      url: "/admin/resumes",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      title: "Platform Users",
      url: "/admin/users",
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: "AI Global Analytics",
      url: "/admin/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      title: "Security & Flags",
      url: "/admin/security",
      icon: <ShieldAlert className="w-5 h-5" />,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ],
  user: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      title: "Create Resume",
      url: "/resumes/create",
      icon: <PlusCircle className="w-5 h-5" />,
    },
    {
      title: "AI Optimization",
      url: "/resumes/analyze",
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      title: "Mock Interviews",
      url: "/interviews",
      icon: <Video className="w-5 h-5" />,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: "admin" | "user";
}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const pathname = usePathname();

  // 🚀 FIXED: Hook into the active sidebar state context loop
  const { state, setOpenMobile } = useSidebar();

  // 🚀 FIXED: Dynamic evaluation. On desktop, state is forced to 'collapsed' by the provider.
  // On mobile, shadcn switches context tracking parameters which we normalize here.
  const isCollapsed = state === "collapsed" || state === "expanded";

  const currentUser = useUserStore((s) => s.userDetails);
  const userRole = currentUser?.role || "user";
  const items = menuItems[userRole] || [];

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex justify-center my-4 items-center">
          <Link href="/">
            <Image
              src="/logo.svg"
              loading="lazy"
              alt="logo"
              width={32}
              height={32}
              className="hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>
      </SidebarHeader>

      <Separator orientation="horizontal" className="opacity-40" />

      <SidebarContent className="custom-scrollbar py-4">
        <SidebarGroup className="px-2">
          <SidebarGroupContent className="">
            <SidebarMenu className="space-y-8">
              {items.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/dashboard" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title} // Tooltips display automatically on icon hover
                    >
                      <Link
                        href={item.url}
                        onClick={() => setOpenMobile(false)} // Dismiss mobile side drawer overlay immediately
                        className={cn(
                          "flex items-center justify-center p-3 relative rounded-lg transition-all duration-300 w-full aspect-square",
                          isActive
                            ? "bg-primary! text-white! shadow-lg shadow-primary/30 scale-105"
                            : "text-muted-foreground! hover:bg-muted! hover:text-foreground!",
                        )}
                      >
                        <div className="size-5 flex items-center justify-center">
                          {item.icon}
                        </div>

                        {/* 🚀 FIXED: isCollapsed rule utilized cleanly. Text titles are skipped entirely */}
                        {!isCollapsed && (
                          <span className="ml-2">{item.title}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
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
