import type { Table, UpdateSpec } from 'dexie';
import type { List, NewList, ListWithStats } from '@models';
import { BaseRepository } from './BaseRepository';
import { db } from './schema';

export class ListsDB extends BaseRepository<List, NewList> {
  constructor(table: Table<List, string>) {
    super(table);
  }

  async create(data: NewList): Promise<List> {
    const list: List = {
      ...this.makeMetadata(),
      name: data.name,
      ownerId: data.ownerId,
      ...(data.color !== undefined ? { color: data.color } : {}),
      sortBy: 'manual',
    };
    await this.table.add(list);
    return list;
  }

  async update(id: string, changes: Partial<NewList>): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    const touched = this.touchMetadata(current);
    const patch = { ...changes, ...touched } as unknown as UpdateSpec<List>;
    await this.table.update(id, patch);
  }

  async getAll(userId: string): Promise<List[]> {
    const all = await this.table.where('ownerId').equals(userId).toArray();
    return all.filter((l) => l.deletedAt === undefined);
  }

  async getWithStats(userId: string): Promise<ListWithStats[]> {
    const lists = await this.getAll(userId);
    return Promise.all(
      lists.map(async (list) => {
        const items = await db.items.where('listId').equals(list.id).toArray();
        const active = items.filter((i) => i.deletedAt === undefined);
        const sharedWith = await db.shares.where('listId').equals(list.id).count();
        return {
          ...list,
          totalItems: active.length,
          checkedItems: active.filter((i) => i.checked).length,
          sharedWith,
        };
      }),
    );
  }
}
