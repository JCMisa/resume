"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";
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
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";

// 🛠️ Aligned menu items focused purely on the ResuMe Studio feature matrix
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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const currentUser = useUserStore((s) => s.userDetails);
  const userRole = currentUser?.role || "user";

  const items = menuItems[userRole] || [];

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div
          className={`mb-3 ${isCollapsed ? "flex justify-center mt-3" : ""}`}
        >
          {!isCollapsed ? (
            <Link href={"/"} className="flex items-center mt-2 justify-center">
              <p className="font-extrabold tracking-wider text-2xl">ResuMe</p>
              <Image
                src="/logo.svg"
                loading="lazy"
                alt="logo"
                width={30}
                height={30}
              />
            </Link>
          ) : (
            <Link href="/">
              <Image
                src="/logo.svg"
                loading="lazy"
                alt="logo"
                width={20}
                height={20}
              />
            </Link>
          )}
        </div>
      </SidebarHeader>

      <Separator orientation="horizontal" />

      <SidebarContent className="custom-scrollbar mt-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.url ||
                      (item.url !== "/dashboard" &&
                        pathname.startsWith(item.url))
                    }
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <Link
                      href={item.url}
                      className={cn(
                        "flex items-center py-8 relative transition-all duration-300",
                        pathname === item.url ||
                          (item.url !== "/dashboard" &&
                            pathname.startsWith(item.url))
                          ? "bg-primary! text-white! shadow-[0_0_20px_rgba(0,0,0,0.1)] shadow-primary/50"
                          : "text-muted-foreground! hover:bg-muted!",
                      )}
                    >
                      <div className="size-10 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div className="text-lg! tracking-wider font-extrabold!">
                        {!isCollapsed && item.title}
                      </div>
                      {(pathname === item.url ||
                        (item.url !== "/dashboard" &&
                          pathname.startsWith(item.url))) &&
                        !isCollapsed && (
                          <div className="absolute right-4 size-1.5 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                        )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
