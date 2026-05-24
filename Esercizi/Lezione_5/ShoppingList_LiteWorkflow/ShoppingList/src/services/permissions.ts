import type { List, Share } from '@models';

export interface ListPermissions {
  isOwner: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export const NO_ACCESS: ListPermissions = Object.freeze({
  isOwner: false,
  canRead: false,
  canWrite: false,
  canDelete: false,
  canShare: false,
});

export function checkPermissions(
  list: List | undefined,
  shares: Share[],
  userId: string,
): ListPermissions {
  if (!list || list.deletedAt !== undefined) return NO_ACCESS;

  if (list.ownerId === userId) {
    return {
      isOwner: true,
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true,
    };
  }

  const share = shares.find(
    (s) =>
      s.listId === list.id &&
      s.userId === userId &&
      s.acceptedAt !== undefined,
  );
  if (!share) return NO_ACCESS;

  return {
    isOwner: false,
    canRead: true,
    canWrite: share.permission === 'write',
    canDelete: false,
    canShare: false,
  };
}
