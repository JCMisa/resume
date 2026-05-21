import { cookies } from "next/headers";
import { SidebarProvider } from "@/components/ui/sidebar";

export async function SidebarStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-mobile": "20rem",
        } as Record<string, string>
      }
    >
      {children}
    </SidebarProvider>
  );
}
