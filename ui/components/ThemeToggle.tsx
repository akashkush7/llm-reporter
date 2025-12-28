"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <div className="w-32 h-10" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setTheme("light")}
        className={`
          p-2 rounded-md transition-all relative
          ${
            theme === "light"
              ? "bg-white dark:bg-gray-700 text-amber-500 shadow-md scale-110"
              : "text-gray-400 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }
        `}
        title="Light mode"
        aria-label="Light mode"
      >
        <Sun className="w-4 h-4" />
        {theme === "light" && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
        )}
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`
          p-2 rounded-md transition-all relative
          ${
            theme === "system"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md scale-110"
              : "text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }
        `}
        title={`System preference (currently ${isDark ? "dark" : "light"})`}
        aria-label="System preference"
      >
        <Monitor className="w-4 h-4" />
        {theme === "system" && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
        )}
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`
          p-2 rounded-md transition-all relative
          ${
            theme === "dark"
              ? "bg-white dark:bg-gray-700 text-indigo-500 dark:text-indigo-400 shadow-md scale-110"
              : "text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }
        `}
        title="Dark mode"
        aria-label="Dark mode"
      >
        <Moon className="w-4 h-4" />
        {theme === "dark" && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
        )}
      </button>
    </div>
  );
}
