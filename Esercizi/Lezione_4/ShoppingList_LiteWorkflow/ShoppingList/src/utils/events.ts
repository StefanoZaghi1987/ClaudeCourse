import type { List, Item, Article, Share, SyncStatus } from '@models';

export interface AppEventMap {
  'list:created': { list: List };
  'list:updated': { listId: string; changes: Partial<List> };
  'list:deleted': { listId: string };
  'item:added': { item: Item };
  'item:updated': { itemId: string; changes: Partial<Item> };
  'item:checked': { itemId: string; checked: boolean; userId: string };
  'item:deleted': { itemId: string };
  'article:created': { article: Article };
  'sync:status-changed': { status: SyncStatus };
  'sync:completed': { timestamp: number };
  'sync:error': { error: string };
  'auth:state-changed': { userId?: string };
  'share:created': { share: Share };
  'share:accepted': { shareId: string };
}

type AnyListener = (data: unknown) => void;

export class EventBus {
  private readonly listeners = new Map<keyof AppEventMap, Set<AnyListener>>();

  on<K extends keyof AppEventMap>(event: K, callback: (data: AppEventMap[K]) => void): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(callback as AnyListener);
  }

  off<K extends keyof AppEventMap>(event: K, callback: (data: AppEventMap[K]) => void): void {
    this.listeners.get(event)?.delete(callback as AnyListener);
  }

  emit<K extends keyof AppEventMap>(event: K, data: AppEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of set) cb(data);
  }

  once<K extends keyof AppEventMap>(event: K, callback: (data: AppEventMap[K]) => void): void {
    const wrapper = (data: AppEventMap[K]): void => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }
}

export const eventBus = new EventBus();
