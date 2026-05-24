import { describe, it, expect, beforeEach } from 'vitest';
import Dexie, { type Table } from 'dexie';
import { BaseRepository, type BaseEntity } from './BaseRepository';

interface Thing extends BaseEntity {
  label: string;
}

interface NewThing {
  label: string;
}

class TestDB extends Dexie {
  things!: Table<Thing, string>;
  constructor() {
    super('TestBaseRepoDB');
    this.version(1).stores({
      things: 'id, label, createdAt, updatedAt, deletedAt',
    });
  }
}

class ThingRepo extends BaseRepository<Thing, NewThing> {
  async create(data: NewThing): Promise<Thing> {
    const entity: Thing = { ...this.makeMetadata(), label: data.label };
    await this.table.add(entity);
    return entity;
  }
  async touch(id: string): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    await this.table.update(id, this.touchMetadata(current));
  }
}

let db: TestDB;
let repo: ThingRepo;

beforeEach(async () => {
  db = new TestDB();
  await db.delete();
  await db.open();
  repo = new ThingRepo(db.things);
});

describe('BaseRepository', () => {
  it('makeMetadata generates id, timestamps, and version=1', async () => {
    const thing = await repo.create({ label: 'hello' });
    expect(thing.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(thing.createdAt).toBeGreaterThan(0);
    expect(thing.updatedAt).toBe(thing.createdAt);
    expect(thing.version).toBe(1);
  });

  it('getById returns the entity', async () => {
    const thing = await repo.create({ label: 'hi' });
    const found = await repo.getById(thing.id);
    expect(found?.label).toBe('hi');
  });

  it('softDelete sets deletedAt and hides from getById', async () => {
    const thing = await repo.create({ label: 'bye' });
    await repo.softDelete(thing.id);

    expect(await repo.getById(thing.id)).toBeUndefined();

    const raw = await db.things.get(thing.id);
    expect(raw?.deletedAt).toBeGreaterThan(0);
  });

  it('touchMetadata bumps version and updatedAt', async () => {
    const thing = await repo.create({ label: 'v1' });
    const originalUpdated = thing.updatedAt;

    await new Promise((r) => setTimeout(r, 2));
    await repo.touch(thing.id);

    const updated = await db.things.get(thing.id);
    expect(updated?.version).toBe(2);
    expect(updated?.updatedAt).toBeGreaterThan(originalUpdated);
  });
});
