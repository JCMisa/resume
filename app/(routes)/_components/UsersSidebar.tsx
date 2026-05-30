"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UserButton } from "@clerk/nextjs";
import { User } from "@/config/schema";
import { getAllUsersAction } from "@/lib/actions/user";
import Image from "next/image";
import { useUserStore } from "@/store/userStore";

interface UsersSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: "admin" | "user";
}

export function UsersSidebar({ ...props }: UsersSidebarProps) {
  const userDetails = useUserStore((s) => s.userDetails);

  const [users, setUsers] = React.useState<User[] | null>([]);

  React.useEffect(() => {
    const fetchUsers = async () => {
      const res = await getAllUsersAction();
      if (res.success) setUsers(res.data);
    };

    fetchUsers();
  }, []);

  const otherUsers = users?.filter((user) => user.id !== userDetails?.id);

  return (
    /* 🚀 FIXED: Forwarding ...props allows side="right" to hook into the CSS flexbox engine correctly */
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex justify-center my-4 items-center">
          <UserButton />
        </div>
      </SidebarHeader>

      <Separator orientation="horizontal" className="opacity-40" />

      <SidebarContent className="custom-scrollbar py-4 ">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-4">
              {otherUsers?.map((user, i) => {
                const initial = user.name?.charAt(0) || "U";

                return (
                  <SidebarMenuItem key={i}>
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={user.name || "avatar"}
                        width={32}
                        height={32}
                        className="hover:scale-105 transition-transform duration-300 rounded-full"
                      />
                    ) : (
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono text-xs shrink-0 border border-primary/20 shadow-sm">
                        {initial}
                      </div>
                    )}
                    {/* <div className="flex items-center gap-3 rounded-lg hover:bg-muted/50 transition-colors w-full cursor-pointer group">
                     
                    </div> */}
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
