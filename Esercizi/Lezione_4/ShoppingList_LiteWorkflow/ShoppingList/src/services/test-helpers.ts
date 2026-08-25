import type { AppEventMap } from '@utils/events';
import { EventBus } from '@utils/events';
import { ShoppingListDB } from '@db';
import { FakeHasher } from './PasswordHasher';
import { createSyncLogger, type SyncLogger } from './sync-logger';
import { buildServices, type Services, type StorageWrapper } from './index';

export class InMemoryStorage implements StorageWrapper {
  private readonly map = new Map<string, string>();

  get<T>(key: string): T | undefined {
    const raw = this.map.get(key);
    return raw === undefined ? undefined : (JSON.parse(raw) as T);
  }

  set<T>(key: string, value: T): void {
    this.map.set(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.map.delete(key);
  }
}

export interface BuiltTestServices {
  db: ShoppingListDB;
  events: EventBus;
  hasher: FakeHasher;
  storage: InMemoryStorage;
  logSync: SyncLogger;
  recordedEvents: Array<{ type: keyof AppEventMap; data: unknown }>;
}

const ALL_EVENT_KEYS = [
  'list:created',
  'list:updated',
  'list:deleted',
  'item:added',
  'item:updated',
  'item:checked',
  'item:deleted',
  'article:created',
  'sync:status-changed',
  'sync:completed',
  'sync:error',
  'auth:state-changed',
  'share:created',
  'share:accepted',
] as const satisfies ReadonlyArray<keyof AppEventMap>;

// Compile-time exhaustiveness guard: if AppEventMap gains a new key, this fails to typecheck
type _MissingEventKeys = Exclude<keyof AppEventMap, (typeof ALL_EVENT_KEYS)[number]>;
const _exhaustivenessCheck: _MissingEventKeys extends never ? true : never = true;
void _exhaustivenessCheck;

export async function buildTestServices(): Promise<BuiltTestServices> {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();

  const events = new EventBus();
  const recordedEvents: BuiltTestServices['recordedEvents'] = [];
  ALL_EVENT_KEYS.forEach((key) => {
    events.on(key, (data) => recordedEvents.push({ type: key, data }));
  });

  const hasher = new FakeHasher();
  const storage = new InMemoryStorage();
  const logSync = createSyncLogger(db);

  return { db, events, hasher, storage, logSync, recordedEvents };
}

export interface TestServices extends BuiltTestServices, Services {}

export async function buildTestServicesWired(): Promise<TestServices> {
  const base = await buildTestServices();
  const services = buildServices(base.db, base.events, base.hasher, base.storage);
  return { ...base, ...services };
}
