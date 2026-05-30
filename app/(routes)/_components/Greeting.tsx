"use client";

import { useUserStore } from "@/store/userStore";
import { useEffect, useState } from "react";

const Greeting = () => {
  const user = useUserStore((s) => s.userDetails);

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const currentHour = new Date().getHours();

      if (currentHour < 12) {
        setGreeting("Good morning");
      } else if (currentHour < 18) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }
    };

    // Initialize instantly on client mount
    updateGreeting();

    // Optional: Update the check every minute if a user keeps the tab open over a time boundary
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Return an empty block or skeleton layout during server pre-rendering to prevent layout shifting
  if (!greeting)
    return <div className="w-24 h-5 animate-pulse bg-muted rounded" />;

  return (
    <span className="text-md font-extrabold tracking-wide text-foreground animate-fade-in">
      <span className="text-primary">{greeting},</span> {user?.name}
    </span>
  );
};

export default Greeting;
