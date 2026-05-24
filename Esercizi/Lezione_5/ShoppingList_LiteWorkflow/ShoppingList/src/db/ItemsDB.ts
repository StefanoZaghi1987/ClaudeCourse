import type { Table, UpdateSpec } from 'dexie';
import type { Item, NewItem, ItemWithArticle, Article } from '@models';
import { BaseRepository } from './BaseRepository';
import type { ShoppingListDB } from './schema';

export class ItemsDB extends BaseRepository<Item, NewItem> {
  constructor(table: Table<Item, string>) {
    super(table);
  }

  async create(data: NewItem): Promise<Item> {
    const order = await this.getNextOrder(data.listId);
    const meta = this.makeMetadata();
    const item: Item = {
      ...meta,
      listId: data.listId,
      quantity: data.quantity,
      checked: false,
      order,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
      ...(data.articleId !== undefined ? { articleId: data.articleId } : {}),
      ...(data.customName !== undefined ? { customName: data.customName } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    };
    await this.table.add(item);
    return item;
  }

  async update(id: string, changes: Partial<NewItem>, userId: string): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    const touch = this.touchMetadata(current) as unknown as Record<string, unknown>;
    const patch = {
      ...changes,
      updatedBy: userId,
      ...touch,
    };
    await this.table.update(id, patch as unknown as UpdateSpec<Item>);
  }

  async getByListId(listId: string): Promise<Item[]> {
    const items = await this.table.where('listId').equals(listId).toArray();
    return items
      .filter((i) => i.deletedAt === undefined)
      .sort((a, b) => a.order - b.order);
  }

  async getWithArticles(listId: string): Promise<ItemWithArticle[]> {
    const items = await this.getByListId(listId);
    const articleIds = items
      .map((i) => i.articleId)
      .filter((id): id is string => id !== undefined);

    const parentDb = this.table.db as ShoppingListDB;
    const articles =
      articleIds.length > 0
        ? await parentDb.articles.where('id').anyOf(articleIds).toArray()
        : [];
    const articleMap = new Map<string, Article>(articles.map((a) => [a.id, a]));

    return items.map((item) => {
      const article = item.articleId !== undefined ? articleMap.get(item.articleId) : undefined;
      const enriched: ItemWithArticle =
        article !== undefined ? { ...item, article } : { ...item };
      return enriched;
    });
  }

  async getNextOrder(listId: string): Promise<number> {
    const items = await this.table.where('listId').equals(listId).toArray();
    if (items.length === 0) return 1;
    return Math.max(...items.map((i) => i.order)) + 1;
  }

  async toggleChecked(id: string, userId: string): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    const next = !current.checked;
    const touch = this.touchMetadata(current) as unknown as Record<string, unknown>;
    const patch = next
      ? {
          checked: true,
          checkedAt: Date.now(),
          checkedBy: userId,
          updatedBy: userId,
          ...touch,
        }
      : {
          checked: false,
          checkedAt: undefined,
          checkedBy: undefined,
          updatedBy: userId,
          ...touch,
        };
    await this.table.update(id, patch as unknown as UpdateSpec<Item>);
  }
}
