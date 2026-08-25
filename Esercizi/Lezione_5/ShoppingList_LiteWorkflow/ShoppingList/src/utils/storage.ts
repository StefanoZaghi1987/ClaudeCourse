/**
 * Thin, type-safe wrapper around `localStorage` with JSON serialization.
 *
 * - `get` silently returns `undefined` on missing keys or corrupted JSON.
 * - `set` logs a warning via `console.warn` (and does NOT throw) when the
 *   value cannot be serialized (circular refs, quota exceeded, etc.).
 * - `remove` delegates to `localStorage.removeItem`.
 *
 * The generic `<T>` is a caller-side assertion about the value shape;
 * this module does not validate runtime types.
 */

export function get<T>(key: string): T | undefined {
  const raw = globalThis.localStorage.getItem(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function set<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    globalThis.localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn('[storage] failed to serialize', key, err);
  }
}

export function remove(key: string): void {
  globalThis.localStorage.removeItem(key);
}
