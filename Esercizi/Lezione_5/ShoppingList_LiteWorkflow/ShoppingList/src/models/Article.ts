export type CategoryType =
  | 'frutta-verdura'
  | 'carne-pesce'
  | 'latticini'
  | 'pane-pasta'
  | 'bevande'
  | 'surgelati'
  | 'conserve'
  | 'pulizia'
  | 'igiene'
  | 'altro';

export interface Article {
  id: string;
  name: string;
  category?: CategoryType;
  searchTerms: string[];
  usageCount: number;
  createdAt: number;
  createdBy: string;
  isDefault: boolean;
  version: number;
  lastSyncedAt?: number;
}

export interface NewArticle {
  name: string;
  category?: CategoryType;
  createdBy: string;
}

export interface ArticleAutocompleteResult {
  id: string;
  name: string;
  category?: CategoryType;
  usageCount: number;
  matchScore: number;
}
