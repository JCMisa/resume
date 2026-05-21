"use client";

import { getCurrentDateFormatted } from "@/lib/utils";

const CurrentDate = () => {
  return (
    <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
      {getCurrentDateFormatted()}
    </div>
  );
};

export default CurrentDate;
