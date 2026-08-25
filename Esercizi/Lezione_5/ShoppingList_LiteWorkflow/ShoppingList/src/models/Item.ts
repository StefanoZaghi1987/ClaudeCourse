import type { Article } from './Article';

export type UnitType = 'pz' | 'kg' | 'g' | 'l' | 'ml' | 'conf' | '';

export interface Item {
  id: string;
  listId: string;
  articleId?: string;
  customName?: string;
  quantity: number;
  unit?: UnitType;
  notes?: string;
  checked: boolean;
  checkedAt?: number;
  checkedBy?: string;
  order: number;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  deletedAt?: number;
  version: number;
  lastSyncedAt?: number;
}

export interface NewItem {
  listId: string;
  articleId?: string;
  customName?: string;
  quantity: number;
  unit?: UnitType;
  notes?: string;
  createdBy: string;
}

export interface ItemWithArticle extends Item {
  article?: Article;
}
