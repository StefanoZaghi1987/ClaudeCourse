export type Permission = 'read' | 'write';

export interface Share {
  id: string;
  listId: string;
  userId: string;
  permission: Permission;
  createdAt: number;
  createdBy: string;
  inviteToken?: string;
  acceptedAt?: number;
  version: number;
  lastSyncedAt?: number;
}

export interface NewShare {
  listId: string;
  userId: string;
  permission: Permission;
  createdBy: string;
}

export interface SharePermissions {
  listId: string;
  userId: string;
  isOwner: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
}
