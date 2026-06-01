"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar"; // 🚀 Re-activated shadcn sidebar context hook
import {
  LayoutDashboard,
  PlusCircle,
  Video,
  Sparkles,
  Settings,
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

const menuItems = {
  admin: [
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
  userRole?: "admin" | "user" | null;
}

export function AppSidebar({ userRole = "user", ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const isCollapsed = !isMobile && state === "collapsed";

  const items = menuItems[userRole || "user"] || [];

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div
          className={`mb-3 ${isCollapsed ? "flex justify-center mt-3" : ""}`}
        >
          {!isCollapsed ? (
            <Link href={"/"} className="flex items-center ml-3">
              <p className="font-extrabold tracking-wider text-2xl">ResuM</p>
              <Image
                src="/logo.svg"
                loading="lazy"
                alt="logo"
                width={25}
                height={25}
              />
            </Link>
          ) : (
            <Link href="/">
              <Image
                src="/logo.svg"
                loading="lazy"
                alt="logo"
                width={25}
                height={25}
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
                    isActive={pathname.startsWith(item.url)}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <Link
                      href={item.url}
                      className={cn(
                        "flex items-center py-8 relative transition-all duration-300",
                        pathname.startsWith(item.url)
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
                      {pathname.startsWith(item.url) && !isCollapsed && (
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
    </Sidebar>
  );
}
