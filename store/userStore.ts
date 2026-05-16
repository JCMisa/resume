import { User } from "@/config/schema";
import { create } from "zustand";

interface UserState {
  userDetails: User | null;
  isLoading: boolean;
  setUserDetails: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userDetails: null,
  isLoading: true,
  setUserDetails: (user) => set({ userDetails: user }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
