import type { Table, UpdateSpec } from 'dexie';
import { generateUUID } from '@utils/uuid';

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  version: number;
}

export abstract class BaseRepository<T extends BaseEntity, TNew> {
  constructor(protected readonly table: Table<T, string>) {}

  protected makeMetadata(): Pick<BaseEntity, 'id' | 'createdAt' | 'updatedAt' | 'version'> {
    const now = Date.now();
    return { id: generateUUID(), createdAt: now, updatedAt: now, version: 1 };
  }

  protected touchMetadata(entity: T): UpdateSpec<T> {
    return { updatedAt: Date.now(), version: entity.version + 1 } as unknown as UpdateSpec<T>;
  }

  async getById(id: string): Promise<T | undefined> {
    const entity = await this.table.get(id);
    if (!entity) return undefined;
    if (entity.deletedAt !== undefined) return undefined;
    return entity;
  }

  async softDelete(id: string): Promise<void> {
    await this.table.update(id, { deletedAt: Date.now() } as unknown as UpdateSpec<T>);
  }

  abstract create(data: TNew): Promise<T>;
}
