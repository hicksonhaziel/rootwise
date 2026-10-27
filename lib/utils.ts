import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx — use everywhere instead of raw `clsx` or `cx`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
