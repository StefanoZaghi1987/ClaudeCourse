import Dexie, { type Table } from 'dexie';
import type { List, Item, Article, User, Share, SyncLog } from '@models';

export class ShoppingListDB extends Dexie {
  lists!: Table<List, string>;
  items!: Table<Item, string>;
  articles!: Table<Article, string>;
  users!: Table<User, string>;
  shares!: Table<Share, string>;
  syncLog!: Table<SyncLog, string>;

  constructor() {
    super('ShoppingListDB');
    this.version(1).stores({
      lists: 'id, name, ownerId, createdAt, updatedAt, deletedAt',
      items: 'id, listId, [listId+checked], articleId, createdAt, updatedAt, deletedAt',
      articles: 'id, name, category, usageCount, createdAt, createdBy',
      users: 'id, email, name, createdAt',
      shares: 'id, listId, [listId+userId], userId, permission, createdAt',
      syncLog: 'id, entityType, entityId, action, timestamp, synced',
    });
  }
}

export const db = new ShoppingListDB();
