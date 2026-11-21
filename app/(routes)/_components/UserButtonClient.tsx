"use client";

import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { CreditCard } from "lucide-react";

// Avatar menu in the app header. Clerk's default items ("Manage account" opens
// the profile modal, "Sign out") are kept; we add shortcuts to our own pages.
const UserButtonClient = () => {
  return (
    <div className="flex-none flex items-center">
      <ClerkLoading>
        <div className="size-8 rounded-full bg-neutral-200 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 animate-pulse" />
      </ClerkLoading>
      <ClerkLoaded>
        <UserButton
          afterSwitchSessionUrl="/"
          appearance={{
            elements: {
              userButtonAvatarBox: "size-8",
            },
          }}
        >
          <UserButton.MenuItems>
            <UserButton.Link
              label="Billing & usage"
              labelIcon={<CreditCard className="size-4" />}
              href="/settings?tab=billing"
            />
            <UserButton.Action label="signOut" />
          </UserButton.MenuItems>
        </UserButton>
      </ClerkLoaded>
    </div>
  );
};

export default UserButtonClient;
