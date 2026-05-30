import { SidebarProvider } from "@/components/ui/sidebar";

export async function SidebarStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      defaultOpen={false}
      open={false} // 🚀 FIXED: Locks desktop context state securely to collapsed mode
      style={
        {
          // 🚀 FIXED: Enforces matching thin-column architectures for all screen targets
          "--sidebar-width": "4.5rem",
          "--sidebar-width-mobile": "4.5rem",
        } as Record<string, string>
      }
    >
      {children}
    </SidebarProvider>
  );
}
