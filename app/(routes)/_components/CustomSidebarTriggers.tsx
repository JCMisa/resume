"use client";

import React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, Users } from "lucide-react";

// ⬅️ LEFT SIDEBAR CONTROLLER: Controls only the AppSidebar sheet
export function LeftSidebarTrigger() {
  const { openMobile, setOpenMobile, isMobile } = useSidebar();

  // Show only on mobile devices (matching your 1024px break threshold)
  if (!isMobile) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden flex size-8"
      onClick={() => setOpenMobile(!openMobile)} // Directly updates left modal layout states
    >
      <Menu className="size-5" />
      <span className="sr-only">Toggle Navigation Menu</span>
    </Button>
  );
}

// ➡️ RIGHT SIDEBAR CONTROLLER: Controls only the UsersSidebar sheet
export function RightSidebarTrigger() {
  // Access the context state parameters safely
  const { isMobile } = useSidebar();

  // Create a local bridge handler to coordinate right portaling sheets
  const [rightOpen, setRightOpen] = React.useState(false);

  React.useEffect(() => {
    // Synchronize custom state updates with global sheet triggers
    const handleRightToggle = (e: CustomEvent<{ open: boolean }>) => {
      setRightOpen(e.detail.open);
    };

    window.addEventListener(
      "toggle-right-sidebar",
      handleRightToggle as EventListener,
    );
    return () =>
      window.removeEventListener(
        "toggle-right-sidebar",
        handleRightToggle as EventListener,
      );
  }, []);

  if (!isMobile) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden flex  size-8 border bg-stone-100 dark:bg-stone-900"
      onClick={() => {
        const nextState = !rightOpen;
        setRightOpen(nextState);
        // Fire event handler down to UsersSidebar
        window.dispatchEvent(
          new CustomEvent("trigger-right-sheet", {
            detail: { open: nextState },
          }),
        );
      }}
    >
      <Users className="size-[13px]" />
      <span className="sr-only">Toggle Profiles Menu</span>
    </Button>
  );
}
