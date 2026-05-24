import type { ShoppingListDB, ListsDB, ItemsDB, ArticlesDB, SharesDB } from '@db';
import type { EventBus } from '@utils/events';
import type { Article, Item, ItemWithArticle, List, NewItem } from '@models';
import type { SyncLogger } from './sync-logger';
import { checkPermissions } from './permissions';
import { NotFoundError, ForbiddenError, ValidationError } from './errors';

export interface ItemServiceDeps {
  db: ShoppingListDB;
  items: ItemsDB;
  lists: ListsDB;
  articles: ArticlesDB;
  shares: SharesDB;
  events: EventBus;
  logSync: SyncLogger;
}

export interface AddItemInput extends NewItem {
  saveToDatabase?: boolean;
}

export class ItemService {
  constructor(private readonly deps: ItemServiceDeps) {}

  /**
   * Returns items for a list joined with their Article data, sorted with
   * non-checked items first (by `order` ASC), then checked items at the
   * bottom (also by `order` ASC). Soft-deleted items are excluded by
   * `ItemsDB.getWithArticles()`.
   */
  async getItemsByListId(listId: string): Promise<ItemWithArticle[]> {
    const base = await this.deps.items.getWithArticles(listId);
    return [...base].sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return a.order - b.order;
    });
  }

  /**
   * Adds a new item to a list. Three branches:
   *
   *   - Ramo A: `articleId` provided. Increments the article's `usageCount`
   *     in the same transaction. `incrementUsage` does NOT write a syncLog
   *     entry (Fase 2 spec §3.4 hot-path stat exception).
   *   - Ramo B: no `articleId`, `customName` set, `saveToDatabase: true`.
   *     Creates a new Article (with its own `article:created` syncLog and
   *     event), then attaches the item to that article via `articleId`.
   *   - Ramo C: no `articleId`, `customName` set, `saveToDatabase` falsy.
   *     Stores the item with `customName` only, no Article created.
   *
   * Always writes ONE `item` `create` syncLog and emits `item:added`.
   * For Ramo B the order is `article:created` first, then `item:added`.
   */
  async addItem(input: AddItemInput, userId: string): Promise<Item> {
    const list = await this.deps.lists.getById(input.listId);
    if (!list) throw new NotFoundError('list');
    const shares = await this.deps.shares.getByListId(input.listId);
    const perms = checkPermissions(list, shares, userId);
    if (!perms.canWrite) throw new ForbiddenError('no write access');

    if (input.articleId === undefined && (input.customName ?? '').trim() === '') {
      throw new ValidationError('name', 'articleId or customName required');
    }

    let createdItem!: Item;
    let createdArticle: Article | undefined;
    await this.deps.db.transaction(
      'rw',
      this.deps.db.items,
      this.deps.db.articles,
      this.deps.db.syncLog,
      async () => {
        let articleId = input.articleId;
        if (articleId !== undefined) {
          await this.deps.articles.incrementUsage(articleId);
        } else if (input.saveToDatabase === true && input.customName !== undefined) {
          createdArticle = await this.deps.articles.create({
            name: input.customName,
            createdBy: userId,
          });
          articleId = createdArticle.id;
          await this.deps.logSync(
            'article',
            createdArticle.id,
            'create',
            { ...createdArticle },
            userId,
          );
        }

        createdItem = await this.deps.items.create({
          listId: input.listId,
          quantity: input.quantity,
          createdBy: userId,
          ...(articleId !== undefined ? { articleId } : {}),
          ...(input.customName !== undefined && articleId === undefined
            ? { customName: input.customName }
            : {}),
          ...(input.unit !== undefined ? { unit: input.unit } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        });
        await this.deps.logSync(
          'item',
          createdItem.id,
          'create',
          { ...createdItem },
          userId,
        );
      },
    );

    if (createdArticle !== undefined) {
      this.deps.events.emit('article:created', { article: createdArticle });
    }
    this.deps.events.emit('item:added', { item: createdItem });
    return createdItem;
  }

  async updateItem(
    itemId: string,
    changes: Partial<Item>,
    userId: string,
  ): Promise<void> {
    const item = await this.deps.items.getById(itemId);
    if (!item) throw new NotFoundError('item');
    const list = await this.deps.lists.getById(item.listId);
    if (!list) throw new NotFoundError('list');
    const shares = await this.deps.shares.getByListId(item.listId);
    const perms = checkPermissions(list, shares, userId);
    if (!perms.canWrite) throw new ForbiddenError('no write access');

    const repoChanges: Partial<NewItem> = {};
    if (changes.quantity !== undefined) repoChanges.quantity = changes.quantity;
    if (changes.unit !== undefined) repoChanges.unit = changes.unit;
    if (changes.notes !== undefined) repoChanges.notes = changes.notes;
    if (changes.customName !== undefined) repoChanges.customName = changes.customName;

    await this.deps.db.transaction(
      'rw',
      this.deps.db.items,
      this.deps.db.syncLog,
      async () => {
        await this.deps.items.update(itemId, repoChanges, userId);
        await this.deps.logSync(
          'item',
          itemId,
          'update',
          { ...repoChanges },
          userId,
        );
      },
    );

    this.deps.events.emit('item:updated', { itemId, changes: repoChanges });
  }

  /**
   * Toggles the `checked` flag on an item. On check, sets `checkedAt`/
   * `checkedBy`; on uncheck the underlying `ItemsDB.toggleChecked` clears
   * both back to `undefined` (handled via the `UpdateSpec` cast pattern in
   * the repo). Always writes one `item` `update` syncLog and emits
   * `item:checked` post-commit.
   */
  async toggleChecked(itemId: string, userId: string): Promise<void> {
    const item = await this.deps.items.getById(itemId);
    if (!item) throw new NotFoundError('item');
    const list = await this.deps.lists.getById(item.listId);
    if (!list) throw new NotFoundError('list');
    const shares = await this.deps.shares.getByListId(item.listId);
    const perms = checkPermissions(list, shares, userId);
    if (!perms.canWrite) throw new ForbiddenError('no write access');

    const newChecked = !item.checked;

    await this.deps.db.transaction(
      'rw',
      this.deps.db.items,
      this.deps.db.syncLog,
      async () => {
        await this.deps.items.toggleChecked(itemId, userId);
        await this.deps.logSync(
          'item',
          itemId,
          'update',
          { checked: newChecked },
          userId,
        );
      },
    );

    this.deps.events.emit('item:checked', {
      itemId,
      checked: newChecked,
      userId,
    });
  }

  async deleteItem(itemId: string, userId: string): Promise<void> {
    const item = await this.deps.items.getById(itemId);
    if (!item) throw new NotFoundError('item');
    const list = await this.deps.lists.getById(item.listId);
    if (!list) throw new NotFoundError('list');
    const shares = await this.deps.shares.getByListId(item.listId);
    const perms = checkPermissions(list, shares, userId);
    if (!perms.canWrite) throw new ForbiddenError('no write access');

    await this.deps.db.transaction(
      'rw',
      this.deps.db.items,
      this.deps.db.syncLog,
      async () => {
        await this.deps.items.softDelete(itemId);
        await this.deps.logSync('item', itemId, 'delete', { ...item }, userId);
      },
    );

    this.deps.events.emit('item:deleted', { itemId });
  }

  /**
   * Reorders the non-deleted items of a list to match `orderedIds`.
   *
   * Validates that `orderedIds` is exactly the set of currently non-deleted
   * item ids belonging to the list (length + set equality). Mismatch raises
   * `ValidationError` BEFORE the transaction.
   *
   * Writes ONE aggregated `list` `update` syncLog with payload
   * `{ itemOrder: [...] }` (NOT N per-item logs — Fase 2 spec §3.4 reorder
   * exception) and emits a SINGLE `list:updated` event with the same
   * payload. The raw `this.deps.db.items.update` call is intentional: we
   * rewrite only the `order` field without bumping `updatedAt`/`version`,
   * so we sidestep `ItemsDB.update`'s metadata touch.
   */
  async reorderItems(
    listId: string,
    orderedIds: string[],
    userId: string,
  ): Promise<void> {
    const list = await this.deps.lists.getById(listId);
    if (!list) throw new NotFoundError('list');
    const shares = await this.deps.shares.getByListId(listId);
    const perms = checkPermissions(list, shares, userId);
    if (!perms.canWrite) throw new ForbiddenError('no write access');

    const currentItems = await this.deps.items.getByListId(listId);
    const currentIds = currentItems.map((i) => i.id);
    if (orderedIds.length !== currentIds.length) {
      throw new ValidationError('orderedIds', 'must cover all list items');
    }
    const currentSet = new Set(currentIds);
    for (const id of orderedIds) {
      if (!currentSet.has(id)) {
        throw new ValidationError('orderedIds', `unknown item ${id}`);
      }
    }

    await this.deps.db.transaction(
      'rw',
      this.deps.db.items,
      this.deps.db.syncLog,
      async () => {
        for (let i = 0; i < orderedIds.length; i++) {
          const id = orderedIds[i];
          if (id === undefined) continue;
          await this.deps.db.items.update(id, { order: i + 1 });
        }
        await this.deps.logSync(
          'list',
          listId,
          'update',
          { itemOrder: orderedIds },
          userId,
        );
      },
    );

    this.deps.events.emit('list:updated', {
      listId,
      changes: { itemOrder: orderedIds } as unknown as Partial<List>,
    });
  }
}
