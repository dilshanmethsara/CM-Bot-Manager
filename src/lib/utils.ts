import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Copy text with execCommand fallback for HTTP (navigator.clipboard undefined). */
export function copyToClipboard(text: string): void {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
    return;
  }
  // Fallback for HTTP
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* noop */ }
  document.body.removeChild(ta);
}
