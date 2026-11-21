"use client";

import { useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { useUserStore } from "@/store/userStore";
import { applyAccent } from "@/components/custom/AccentProvider";
import { DEFAULT_ACCENT, isAccentId } from "@/lib/accents";

const readCurrentAccent = () =>
  document.documentElement.getAttribute("data-accent") ?? DEFAULT_ACCENT;

export const UserStoreWatcher = () => {
  const { user, isLoaded } = useUser();
  const setUserDetails = useUserStore((s) => s.setUserDetails);
  const setIsLoading = useUserStore((s) => s.setIsLoading);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const result = await axios.get("/api/users");
        setUserDetails(result.data);
        // Cross-device sync: the accent saved on the account wins over this
        // device's local choice.
        const saved = result.data?.themeAccent;
        if (isAccentId(saved) && saved !== readCurrentAccent()) {
          applyAccent(saved);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUser();
    } else {
      setIsLoading(false);
      setUserDetails(null);
    }
  }, [user, isLoaded, setUserDetails, setIsLoading]);

  return null; // This component renders nothing, it just manages data
};
