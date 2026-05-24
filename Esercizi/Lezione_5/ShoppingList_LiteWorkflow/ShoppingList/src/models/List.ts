export interface List {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  version: number;
  lastSyncedAt?: number;
  sortBy?: 'manual' | 'alphabetic' | 'category' | 'status';
  color?: string;
}

export interface NewList {
  name: string;
  ownerId: string;
  color?: string;
}

export interface ListWithStats extends List {
  totalItems: number;
  checkedItems: number;
  sharedWith: number;
}
