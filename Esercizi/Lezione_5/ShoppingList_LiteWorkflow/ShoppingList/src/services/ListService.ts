import type { ShoppingListDB, ListsDB, ItemsDB, SharesDB } from '@db';
import type { EventBus } from '@utils/events';
import type { List, ListWithStats } from '@models';
import { isValidListName } from '@utils/validators';
import type { SyncLogger } from './sync-logger';
import { checkPermissions } from './permissions';
import { ValidationError, ForbiddenError, NotFoundError } from './errors';

export interface ListServiceDeps {
  db: ShoppingListDB;
  lists: ListsDB;
  items: ItemsDB;
  shares: SharesDB;
  events: EventBus;
  logSync: SyncLogger;
}

export class ListService {
  constructor(private readonly deps: ListServiceDeps) {}

  /**
   * Returns owned + accepted-shared lists with stats.
   *
   * Bypasses `ListsDB.getWithStats()` because that helper imports the `db`
   * singleton, which would break test isolation when this service runs against
   * a fresh `ShoppingListDB`. We query `this.deps.db.lists/items/shares`
   * directly (see plan §6 "Deviations").
   */
  async getAllLists(userId: string): Promise<ListWithStats[]> {
    const ownedRaw = await this.deps.db.lists
      .where('ownerId')
      .equals(userId)
      .toArray();
    const owned = ownedRaw.filter((l) => l.deletedAt === undefined);

    const myShares = await this.deps.db.shares
      .where('userId')
      .equals(userId)
      .toArray();
    const acceptedShares = myShares.filter((s) => s.acceptedAt !== undefined);
    const sharedListIds = acceptedShares.map((s) => s.listId);
    const sharedRaw = sharedListIds.length
      ? await this.deps.db.lists.bulkGet(sharedListIds)
      : [];
    const shared = sharedRaw.filter(
      (l): l is List => l !== undefined && l.deletedAt === undefined,
    );

    const all = [...owned, ...shared];
    const enriched = await Promise.all(
      all.map(async (list) => this.enrich(list)),
    );
    enriched.sort((a, b) => b.updatedAt - a.updatedAt);
    return enriched;
  }

  async searchLists(query: string, userId: string): Promise<ListWithStats[]> {
    const all = await this.getAllLists(userId);
    const q = query.toLowerCase();
    return all.filter((l) => l.name.toLowerCase().includes(q));
  }

  async getListById(listId: string): Promise<List | undefined> {
    return this.deps.lists.getById(listId);
  }

  async createList(
    name: string,
    userId: string,
    color?: string,
  ): Promise<List> {
    if (!isValidListName(name)) {
      throw new ValidationError('name', 'must be 1–100 chars');
    }

    let created!: List;
    await this.deps.db.transaction(
      'rw',
      this.deps.db.lists,
      this.deps.db.syncLog,
      async () => {
        created = await this.deps.lists.create({
          name,
          ownerId: userId,
          ...(color !== undefined ? { color } : {}),
        });
        await this.deps.logSync(
          'list',
          created.id,
          'create',
          { ...created },
          userId,
        );
      },
    );

    this.deps.events.emit('list:created', { list: created });
    return created;
  }

  /**
   * Updates a list. The repository only accepts `{name, color}`; broader
   * `Partial<List>` inputs (e.g. ownerId, version) are silently stripped here
   * so callers cannot escalate privileges or corrupt sync metadata. See plan
   * §5 "Deviations".
   */
  async updateList(
    listId: string,
    changes: Partial<List>,
    userId: string,
  ): Promise<void> {
    const list = await this.deps.lists.getById(listId);
    if (!list) throw new NotFoundError('list');
    const shares = await this.deps.shares.getByListId(listId);
    const perms = checkPermissions(list, shares, userId);
    if (!perms.canWrite) throw new ForbiddenError('no write access');

    if (changes.name !== undefined && !isValidListName(changes.name)) {
      throw new ValidationError('name', 'must be 1–100 chars');
    }

    const repoChanges: Partial<{ name: string; color: string }> = {};
    if (changes.name !== undefined) repoChanges.name = changes.name;
    if (changes.color !== undefined) repoChanges.color = changes.color;

    await this.deps.db.transaction(
      'rw',
      this.deps.db.lists,
      this.deps.db.syncLog,
      async () => {
        await this.deps.lists.update(listId, repoChanges);
        await this.deps.logSync(
          'list',
          listId,
          'update',
          { ...repoChanges },
          userId,
        );
      },
    );

    this.deps.events.emit('list:updated', { listId, changes: repoChanges });
  }

  async deleteList(listId: string, userId: string): Promise<void> {
    const list = await this.deps.lists.getById(listId);
    if (!list) throw new NotFoundError('list');
    const shares = await this.deps.shares.getByListId(listId);
    const perms = checkPermissions(list, shares, userId);
    if (!perms.isOwner) throw new ForbiddenError('only owner can delete');

    await this.deps.db.transaction(
      'rw',
      this.deps.db.lists,
      this.deps.db.syncLog,
      async () => {
        await this.deps.lists.softDelete(listId);
        await this.deps.logSync(
          'list',
          listId,
          'delete',
          { ...list },
          userId,
        );
      },
    );

    this.deps.events.emit('list:deleted', { listId });
  }

  /**
   * Duplicates a list and its non-checked items into a new list owned by
   * `userId`. Reads source items via `this.deps.db.items` directly (raw-table
   * bypass) because `ItemsDB.getByListId` already filters out soft-deleted
   * items but we additionally need to filter on `checked`, and we want one
   * query rather than two. Skips checked items, skips shares. Emits exactly
   * ONE `list:created` event (views reload items on that signal) but writes
   * N+1 syncLog entries (1 list-create + N item-creates).
   */
  async duplicateList(listId: string, userId: string): Promise<List> {
    const src = await this.deps.lists.getById(listId);
    if (!src) throw new NotFoundError('list');
    const shares = await this.deps.shares.getByListId(listId);
    const perms = checkPermissions(src, shares, userId);
    if (!perms.canRead) throw new ForbiddenError('no read access');

    const srcItems = (
      await this.deps.db.items.where('listId').equals(listId).toArray()
    ).filter((i) => i.deletedAt === undefined && !i.checked);

    let newList!: List;
    await this.deps.db.transaction(
      'rw',
      this.deps.db.lists,
      this.deps.db.items,
      this.deps.db.syncLog,
      async () => {
        newList = await this.deps.lists.create({
          name: `Copia di ${src.name}`,
          ownerId: userId,
          ...(src.color !== undefined ? { color: src.color } : {}),
        });
        await this.deps.logSync(
          'list',
          newList.id,
          'create',
          { ...newList },
          userId,
        );

        for (const it of srcItems) {
          const copy = await this.deps.items.create({
            listId: newList.id,
            quantity: it.quantity,
            createdBy: userId,
            ...(it.articleId !== undefined ? { articleId: it.articleId } : {}),
            ...(it.customName !== undefined
              ? { customName: it.customName }
              : {}),
            ...(it.unit !== undefined ? { unit: it.unit } : {}),
            ...(it.notes !== undefined ? { notes: it.notes } : {}),
          });
          await this.deps.logSync(
            'item',
            copy.id,
            'create',
            { ...copy },
            userId,
          );
        }
      },
    );

    this.deps.events.emit('list:created', { list: newList });
    return newList;
  }

  /**
   * Raw-table bypass: queries `this.deps.db.items/shares` directly instead of
   * using `ItemsDB`/`SharesDB` so that all reads target the same db instance
   * passed via deps (preserving test isolation).
   */
  private async enrich(list: List): Promise<ListWithStats> {
    const items = (
      await this.deps.db.items.where('listId').equals(list.id).toArray()
    ).filter((i) => i.deletedAt === undefined);
    const sharedWith = await this.deps.db.shares
      .where('listId')
      .equals(list.id)
      .count();
    return {
      ...list,
      totalItems: items.length,
      checkedItems: items.filter((i) => i.checked).length,
      sharedWith,
    };
  }
}
