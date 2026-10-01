import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const NOW = Date.parse("2026-10-01T10:30:00");

export const timeAgo = (iso: string) => {
  const d = Math.round((NOW - Date.parse(iso)) / 86_400_000);
  return d <= 0 ? "today" : `${d}d ago`;
};

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
