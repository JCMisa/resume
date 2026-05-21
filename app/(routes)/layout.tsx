import { Suspense } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggler } from "@/components/custom/ThemeToggler";
import SidebarFallback from "./_components/SidebarFallback";
import { SidebarStateProvider } from "./_providers/SidebarStateProvider";
import { AppSidebar } from "./_components/AppSidebar";
import CurrentDate from "./_components/CurrentDate";
import UserInfo from "./_components/UserInfo";

const RoutesLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <Suspense fallback={<SidebarFallback />}>
      <SidebarStateProvider>
        <AppSidebar variant="floating" collapsible="icon" />
        <SidebarInset className="h-svh flex flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1" />
              <ThemeToggler />
              <CurrentDate />
            </div>
            {/* user info */}
            <UserInfo />
          </header>
          <main className="flex-1 overflow-y-auto custom-scrollbar p-5">
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
