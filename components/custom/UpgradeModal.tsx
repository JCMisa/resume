"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import ProCheckoutButton from "@/components/custom/ProCheckoutButton";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

// Resolves once Radix has finished closing every dialog (exit animation done,
// body pointer-events lock released), so Clerk's checkout drawer is clickable.
function waitForDialogsClosed(timeoutMs = 600) {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const check = () => {
      const open = document.querySelector('[data-slot="dialog-content"]');
      const locked = document.body.style.pointerEvents === "none";
      if ((!open && !locked) || performance.now() - start > timeoutMs) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title,
  description,
}: UpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border border-stone-200 dark:border-stone-800">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-brand/10 text-brand-strong dark:text-brand rounded-full border border-brand/20 animate-pulse">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <DialogTitle className="text-xl font-black tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0 pt-4 border-t mt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-lg font-bold !py-5"
          >
            Back to Workspace
          </Button>
          {/* Opens Clerk's checkout in place; the modal closes first */}
          <ProCheckoutButton
            proLabel="View my plan"
            onBeforeCheckout={async () => {
              onClose();
              await waitForDialogsClosed();
            }}
            className={cn(
              buttonVariants(),
              "rounded-xl font-black text-xs !py-5 bg-primary text-primary-foreground shadow-lg shadow-primary/20 gap-1.5",
            )}
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            Upgrade to Pro
          </ProCheckoutButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
