import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert CSS style object (with kebab-case keys) to React style object (with camelCase keys)
 */
export function cssToReactStyle(cssStyles: Record<string, string>): React.CSSProperties {
  const styleObject: React.CSSProperties = {};
  Object.entries(cssStyles).forEach(([key, value]) => {
    // Convert kebab-case to camelCase for React
    const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    (styleObject as any)[camelKey] = value;
  });
  return styleObject;
}

// Rate limiting utilities
export function isRateLimited(): boolean {
  if (typeof window === 'undefined') return false;
  
  const rateLimitInfo = localStorage.getItem('rate_limit_info');
  if (!rateLimitInfo) return false;
  
  try {
    const info = JSON.parse(rateLimitInfo);
    const elapsed = Math.floor((Date.now() - info.timestamp) / 1000);
    return elapsed < info.retryAfter;
  } catch {
    return false;
  }
}

export function getRateLimitTimeRemaining(): number {
  if (typeof window === 'undefined') return 0;
  
  const rateLimitInfo = localStorage.getItem('rate_limit_info');
  if (!rateLimitInfo) return 0;
  
  try {
    const info = JSON.parse(rateLimitInfo);
    const elapsed = Math.floor((Date.now() - info.timestamp) / 1000);
    return Math.max(0, info.retryAfter - elapsed);
  } catch {
    return 0;
  }
}

export function clearRateLimitInfo(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('rate_limit_info');
}
