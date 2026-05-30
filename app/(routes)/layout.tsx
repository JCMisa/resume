import { Suspense } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import SidebarFallback from "./_components/SidebarFallback";
import { SidebarStateProvider } from "./_providers/SidebarStateProvider";
import { AppSidebar } from "./_components/AppSidebar";
import Greeting from "./_components/Greeting";
import { ThemeToggler } from "@/components/custom/ThemeToggler";
import { SearchIcon } from "lucide-react";
import { UsersSidebar } from "./_components/UsersSidebar";
import {
  LeftSidebarTrigger,
  RightSidebarTrigger,
} from "./_components/CustomSidebarTriggers"; // 🚀 Custom triggers we will create in Step 2

const RoutesLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <Suspense fallback={<SidebarFallback />}>
      <SidebarStateProvider>
        {/* Left Side App Navigation Channel */}
        <AppSidebar variant="floating" collapsible="icon" id="left-sidebar" />

        <SidebarInset className="h-svh flex flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between bg-background">
            <div className="flex items-center gap-4">
              {/* 🚀 FIXED: Custom Left Navigation Sidebar control hook */}
              <LeftSidebarTrigger />
              <Greeting />
            </div>

            <div className="flex items-center gap-6">
              {/* Search Element Block */}
              <div className="border w-64 h-8 rounded-lg hidden sm:flex items-center justify-start gap-2 relative bg-muted/20">
                <SearchIcon className="size-[13px] absolute top-[9px] left-3 cursor-pointer text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full h-full pl-9 pr-3 focus:outline-none bg-transparent text-[11px] placeholder:text-[11px] text-muted-foreground"
                />
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggler />
                {/* 🚀 FIXED: Custom Right Profiles Sidebar control hook */}
                <RightSidebarTrigger />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar p-5">
            <div className="flex h-full w-full flex-1 custom-scrollbar overflow-y-auto">
              {children}
            </div>
          </main>
        </SidebarInset>

        {/* Right Side Active Profiles Feed Channel */}
        <UsersSidebar
          variant="floating"
          collapsible="icon"
          side="right"
          id="right-sidebar"
        />
      </SidebarStateProvider>
    </Suspense>
  );
};

export default RoutesLayout;
