"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />;

  const options: { value: string; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "system", label: "Auto", icon: "💻" },
    { value: "dark", label: "Dark", icon: "🌙" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all
            ${theme === opt.value
              ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
        >
          <span>{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
