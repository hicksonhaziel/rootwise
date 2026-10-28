"use client";

import { useTheme, type Theme } from "./theme-provider";
import { motion } from "framer-motion";
import { Sun, Moon, Desktop } from "@phosphor-icons/react";

interface Props {
  className?: string;
}

export function ThemeToggle({ className = "" }: Props) {
  const { theme, setTheme } = useTheme();

  const options: { id: Theme; label: string; icon: React.ElementType }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "system", label: "System", icon: Desktop },
    { id: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <div
      className={`inline-flex items-center bg-bg-elevated border border-bg-border rounded-lg p-0.5 ${className}`}
      role="group"
      aria-label="Theme selector"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.id;

        return (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            title={`${opt.label} theme`}
            className={`
              relative p-1.5 rounded-md text-xs font-medium transition-colors
              ${
                isActive
                  ? "text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="activeThemePill"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="absolute inset-0 bg-bg-surface border border-bg-border rounded-md shadow-sm"
              />
            )}
            <Icon size={14} weight={isActive ? "fill" : "regular"} className="relative z-10" />
          </button>
        );
      })}
    </div>
  );
}
