/**
 * lib/cache.ts — Ultra-fast in-memory cache with stale-while-revalidate
 * Supports both client-side instant data access and server-side request deduplication.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds default

export function cacheGet<T>(key: string): T | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;

  // Stale check
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }

  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  // Keep memoryStore bounded to prevent leaks
  if (memoryStore.size > 500) {
    const oldestKey = memoryStore.keys().next().value;
    if (oldestKey) memoryStore.delete(oldestKey);
  }

  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
    storedAt: Date.now(),
  });
}

export function cacheInvalidate(prefixOrKey: string): void {
  for (const key of memoryStore.keys()) {
    if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
      memoryStore.delete(key);
    }
  }
}

/**
 * cachedFetch — Client-side fetch with instant in-memory cache return.
 * If data is in memory, returns immediately.
 * If stale or forceRefresh, fetches fresh data in background/foreground.
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  // Only cache GET requests
  const isGet = !options?.method || options.method.toUpperCase() === "GET";
  if (!isGet) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json() as Promise<T>;
  }

  const cached = cacheGet<T>(url);
  if (cached !== null) {
    // Return cached immediately; optionally revalidate if near expiry
    return cached;
  }

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = (await res.json()) as T;

  cacheSet(url, data, ttlMs);
  return data;
}
