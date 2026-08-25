export * from './errors';
export * from './permissions';
export * from './PasswordHasher';
export * from './sync-logger';

export interface StorageWrapper {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

import type { ShoppingListDB } from '@db';
import { ListsDB, ItemsDB, ArticlesDB, UsersDB, SharesDB } from '@db';
import type { EventBus } from '@utils/events';
import { ArticleService } from './ArticleService';
import { ShareService } from './ShareService';
import { ListService } from './ListService';
import { ItemService } from './ItemService';
import { AuthService } from './AuthService';
import { createSyncLogger } from './sync-logger';
import type { PasswordHasher } from './PasswordHasher';

export { ArticleService, ShareService, ListService, ItemService, AuthService };

export interface Services {
  lists: ListService;
  items: ItemService;
  articles: ArticleService;
  auth: AuthService;
  share: ShareService;
}

export function buildServices(
  db: ShoppingListDB,
  events: EventBus,
  hasher: PasswordHasher,
  storage: StorageWrapper,
): Services {
  const listsDB = new ListsDB(db.lists);
  const itemsDB = new ItemsDB(db.items);
  const articlesDB = new ArticlesDB(db.articles);
  const usersDB = new UsersDB(db.users);
  const sharesDB = new SharesDB(db.shares);

  const logSync = createSyncLogger(db);

  const articles = new ArticleService({
    db,
    events,
    articles: articlesDB,
    logSync,
  });
  const share = new ShareService({
    db,
    events,
    shares: sharesDB,
    lists: listsDB,
    users: usersDB,
    logSync,
  });
  const lists = new ListService({
    db,
    events,
    lists: listsDB,
    items: itemsDB,
    shares: sharesDB,
    logSync,
  });
  const items = new ItemService({
    db,
    events,
    items: itemsDB,
    lists: listsDB,
    articles: articlesDB,
    shares: sharesDB,
    logSync,
  });
  const auth = new AuthService({
    db,
    events,
    users: usersDB,
    storage,
    hasher,
  });

  return { lists, items, articles, auth, share };
}
