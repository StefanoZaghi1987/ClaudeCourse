import type { UpdateSpec } from 'dexie';
import type { ShoppingListDB, ListsDB, SharesDB, UsersDB } from '@db';
import type { EventBus } from '@utils/events';
import type { List, Permission, Share, User } from '@models';
import { generateUUID, generateSecureToken } from '@utils/uuid';
import type { SyncLogger } from './sync-logger';
import { checkPermissions, type ListPermissions } from './permissions';
import { NotFoundError, ForbiddenError, ConflictError } from './errors';

export interface ShareServiceDeps {
  db: ShoppingListDB;
  shares: SharesDB;
  lists: ListsDB;
  users: UsersDB;
  events: EventBus;
  logSync: SyncLogger;
}

export interface ShareWithUser extends Share {
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export class ShareService {
  constructor(private readonly deps: ShareServiceDeps) {}

  async getUserPermissions(
    userId: string,
    listId: string,
  ): Promise<ListPermissions> {
    const list = await this.deps.lists.getById(listId);
    const shares = await this.deps.shares.getByListId(listId);
    return checkPermissions(list, shares, userId);
  }

  /**
   * Creates a pending share invitation for `listId`.
   * Uses the raw `db.shares.add(share)` instead of `SharesDB.create()` because
   * the repository cannot set `inviteToken` (see plan "Deviations from spec" §3).
   * The `inviteToken` MUST survive to the DB — `acceptInvite` looks the record
   * up by it. `userId=''` is intentional: the invite is pending and the real
   * userId is filled in by `acceptInvite`.
   */
  async createShareLink(
    listId: string,
    permission: Permission,
    userId: string,
  ): Promise<string> {
    const list = await this.deps.lists.getById(listId);
    if (!list) throw new NotFoundError('list');
    const existingShares = await this.deps.shares.getByListId(listId);
    const perms = checkPermissions(list, existingShares, userId);
    if (!perms.isOwner) throw new ForbiddenError('only owner can share');

    const token = generateSecureToken();
    const share: Share = {
      id: generateUUID(),
      listId,
      userId: '',
      permission,
      createdAt: Date.now(),
      createdBy: userId,
      inviteToken: token,
      version: 1,
    };

    await this.deps.db.transaction(
      'rw',
      this.deps.db.shares,
      this.deps.db.syncLog,
      async () => {
        await this.deps.db.shares.add(share);
        await this.deps.logSync(
          'share',
          share.id,
          'create',
          { ...share },
          userId,
        );
      },
    );

    this.deps.events.emit('share:created', { share });
    return `${globalThis.location.origin}/accept-invite/${token}`;
  }

  async acceptInvite(token: string, userId: string): Promise<void> {
    const share = await this.deps.shares.getByToken(token);
    if (!share) throw new NotFoundError('share');
    if (share.acceptedAt !== undefined) {
      throw new ConflictError('invite', 'already accepted');
    }

    const changes = {
      userId,
      acceptedAt: Date.now(),
      inviteToken: undefined,
    };

    await this.deps.db.transaction(
      'rw',
      this.deps.db.shares,
      this.deps.db.syncLog,
      async () => {
        await this.deps.db.shares.update(
          share.id,
          changes as unknown as UpdateSpec<Share>,
        );
        await this.deps.logSync('share', share.id, 'update', changes, userId);
      },
    );

    this.deps.events.emit('share:accepted', { shareId: share.id });
  }

  async getListShares(listId: string): Promise<ShareWithUser[]> {
    const list = await this.deps.shares.getByListId(listId);
    return Promise.all(
      list.map(async (s): Promise<ShareWithUser> => {
        if (!s.userId) return { ...s };
        const user = await this.deps.users.getById(s.userId);
        if (!user) return { ...s };
        return {
          ...s,
          user: {
            id: user.id,
            name: user.name,
            ...(user.email !== undefined ? { email: user.email } : {}),
          },
        };
      }),
    );
  }

  async getSharedListsForUser(userId: string): Promise<List[]> {
    const shares = await this.deps.shares.getByUserId(userId);
    const accepted = shares.filter((s) => s.acceptedAt !== undefined);
    const lists = await Promise.all(
      accepted.map((s) => this.deps.lists.getById(s.listId)),
    );
    return lists.filter((l): l is List => l !== undefined);
  }

  async updatePermission(
    shareId: string,
    permission: Permission,
    userId: string,
  ): Promise<void> {
    const share = await this.deps.db.shares.get(shareId);
    if (!share) throw new NotFoundError('share');
    const list = await this.deps.lists.getById(share.listId);
    const listShares = await this.deps.shares.getByListId(share.listId);
    const perms = checkPermissions(list, listShares, userId);
    if (!perms.isOwner) {
      throw new ForbiddenError('only owner can change permission');
    }

    await this.deps.db.transaction(
      'rw',
      this.deps.db.shares,
      this.deps.db.syncLog,
      async () => {
        await this.deps.db.shares.update(shareId, { permission });
        await this.deps.logSync(
          'share',
          shareId,
          'update',
          { permission },
          userId,
        );
      },
    );
  }

  async revokeAccess(shareId: string, userId: string): Promise<void> {
    const share = await this.deps.db.shares.get(shareId);
    if (!share) throw new NotFoundError('share');
    const list = await this.deps.lists.getById(share.listId);
    const listShares = await this.deps.shares.getByListId(share.listId);
    const perms = checkPermissions(list, listShares, userId);
    if (!perms.isOwner) {
      throw new ForbiddenError('only owner can revoke access');
    }

    await this.deps.db.transaction(
      'rw',
      this.deps.db.shares,
      this.deps.db.syncLog,
      async () => {
        await this.deps.db.shares.delete(shareId);
        await this.deps.logSync(
          'share',
          shareId,
          'delete',
          { ...share },
          userId,
        );
      },
    );
  }
}
