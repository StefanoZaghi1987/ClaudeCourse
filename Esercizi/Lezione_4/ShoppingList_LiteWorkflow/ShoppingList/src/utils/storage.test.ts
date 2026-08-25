import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get, set, remove } from './storage';

describe('storage', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => {
        store.clear();
      },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    } as Storage;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('round-trips an object via set/get (deep equality)', () => {
    const user = { id: 1, name: 'Stefano' };
    set('user', user);
    expect(get<typeof user>('user')).toEqual(user);
  });

  it('round-trips a primitive value', () => {
    set('count', 42);
    expect(get<number>('count')).toBe(42);
  });

  it('returns undefined for a missing key', () => {
    expect(get<string>('nope')).toBeUndefined();
  });

  it('returns undefined when stored value is corrupted JSON', () => {
    localStorage.setItem('key', 'not-json');
    expect(get<unknown>('key')).toBeUndefined();
  });

  it('remove() deletes a previously set key', () => {
    set('k', 1);
    remove('k');
    expect(get<number>('k')).toBeUndefined();
  });

  it('set() logs warning and does not throw on circular reference', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    type Circular = { self?: Circular; name: string };
    const circular: Circular = { name: 'loop' };
    circular.self = circular;

    expect(() => {
      set('circular', circular);
    }).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });
});
