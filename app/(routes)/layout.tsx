import { Suspense } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarStateProvider } from "./_providers/SidebarStateProvider";
import { AppSidebar } from "./_components/AppSidebar";
import Greeting from "./_components/Greeting";
import { ThemeToggler } from "@/components/custom/ThemeToggler";
import { NotificationBell } from "@/components/custom/notifications/NotificationBell";
import { AppSearch } from "@/components/custom/search/AppSearch";
import { getCurrentUser } from "@/lib/actions/user";
import { SidebarFallback } from "./_components/SidebarFallback";
import UserButtonClient from "./_components/UserButtonClient";

const RoutesLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const user = await getCurrentUser();

  if (!user || !user.data || !user.success) {
    return <SidebarFallback />;
  }

  return (
    <Suspense fallback={<SidebarFallback />}>
      <SidebarStateProvider>
        {/* Left Side App Navigation Channel */}
        <AppSidebar
          variant="floating"
          collapsible="icon"
          id="left-sidebar"
          userRole={user.data.role}
        />

        <SidebarInset className="h-svh flex flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between bg-background">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger />
              <Greeting />
            </div>

            <div className="flex items-center gap-3 sm:gap-6 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Search (Ctrl/⌘ K): resumes, interviews and pages */}
                <AppSearch isAdmin={user.data.role === "admin"} />
                <NotificationBell />
                <ThemeToggler />
                {/* Profile, billing shortcut and sign out */}
                <UserButtonClient />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
            <div className="flex h-full w-full flex-1 custom-scrollbar overflow-y-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarStateProvider>
    </Suspense>
  );
};

export default RoutesLayout;
