import type { Table, UpdateSpec } from 'dexie';
import type { Share, NewShare, SharePermissions } from '@models';
import { generateUUID } from '@utils/uuid';
import type { ShoppingListDB } from './schema';

export class SharesDB {
  constructor(private readonly table: Table<Share, string>) {}

  async create(data: NewShare): Promise<Share> {
    const now = Date.now();
    const share: Share = {
      id: generateUUID(),
      listId: data.listId,
      userId: data.userId,
      permission: data.permission,
      createdAt: now,
      createdBy: data.createdBy,
      version: 1,
    };
    await this.table.add(share);
    return share;
  }

  async getByListId(listId: string): Promise<Share[]> {
    return this.table.where('listId').equals(listId).toArray();
  }

  async getByUserId(userId: string): Promise<Share[]> {
    return this.table.where('userId').equals(userId).toArray();
  }

  async getByToken(token: string): Promise<Share | undefined> {
    return this.table.filter((s) => s.inviteToken === token).first();
  }

  async update(id: string, changes: Partial<NewShare>): Promise<void> {
    await this.table.update(id, { ...changes } as unknown as UpdateSpec<Share>);
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  async getPermissions(userId: string, listId: string): Promise<SharePermissions> {
    const ownDb = this.table.db as ShoppingListDB;
    const list = await ownDb.lists.get(listId);

    if (list?.ownerId === userId) {
      return {
        listId,
        userId,
        isOwner: true,
        canRead: true,
        canWrite: true,
        canDelete: true,
        canShare: true,
      };
    }

    const share = await this.table
      .where('[listId+userId]')
      .equals([listId, userId])
      .first();

    if (!share) {
      return {
        listId,
        userId,
        isOwner: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        canShare: false,
      };
    }

    return {
      listId,
      userId,
      isOwner: false,
      canRead: true,
      canWrite: share.permission === 'write',
      canDelete: false,
      canShare: false,
    };
  }
}
