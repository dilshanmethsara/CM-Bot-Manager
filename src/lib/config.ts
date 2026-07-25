// Client-side runtime config (injected at build time via Vite)
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL || '',
} as const;

// Helper to get base URL with fallback
export function getApiBaseUrl(): string {
  if (config.apiBaseUrl) return config.apiBaseUrl;
  // In dev, Vite proxies /api to localhost:3000
  // In production behind nginx, /api goes to the backend
  return '';
}

export function getWsBaseUrl(): string {
  if (config.wsBaseUrl) return config.wsBaseUrl;
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}
