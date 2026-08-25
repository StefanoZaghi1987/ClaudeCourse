import type { ShoppingListDB, ArticlesDB } from '@db';
import { seedDefaultArticles } from '@db';
import type { EventBus } from '@utils/events';
import type {
  Article,
  ArticleAutocompleteResult,
  CategoryType,
  NewArticle,
} from '@models';
import type { SyncLogger } from './sync-logger';
import { ValidationError } from './errors';

export interface ArticleServiceDeps {
  db: ShoppingListDB;
  articles: ArticlesDB;
  events: EventBus;
  logSync: SyncLogger;
}

export class ArticleService {
  constructor(private readonly deps: ArticleServiceDeps) {}

  async search(query: string, limit = 5): Promise<ArticleAutocompleteResult[]> {
    if (query.trim().length < 2) return [];
    return this.deps.articles.search(query, limit);
  }

  async create(data: NewArticle, userId: string): Promise<Article> {
    if (data.name.trim().length === 0) {
      throw new ValidationError('name', 'cannot be empty');
    }

    let created!: Article;
    await this.deps.db.transaction(
      'rw',
      this.deps.db.articles,
      this.deps.db.syncLog,
      async () => {
        created = await this.deps.articles.create(data);
        await this.deps.logSync(
          'article',
          created.id,
          'create',
          { ...created },
          userId,
        );
      },
    );

    this.deps.events.emit('article:created', { article: created });
    return created;
  }

  async incrementUsage(articleId: string): Promise<void> {
    await this.deps.articles.incrementUsage(articleId);
  }

  async getByCategory(category: CategoryType): Promise<Article[]> {
    return this.deps.articles.getByCategory(category);
  }

  async initializeDatabase(userId: string): Promise<void> {
    const count = await this.deps.db.articles.count();
    if (count > 0) return;
    await seedDefaultArticles(this.deps.articles, userId);
  }

  /**
   * Ingests server-authoritative articles. Raw `this.deps.db.articles` writes are deliberate:
   * they preserve server-assigned `id`, `createdAt`, `version`, `usageCount` verbatim —
   * `ArticlesDB.create()` would regenerate them. No `syncLog` entry is written because
   * this data already comes from the server; logging it would re-replicate it back on the
   * next sync cycle. This is the only method in the service that legitimately bypasses the repository.
   */
  async syncFromRemote(remoteArticles: Article[]): Promise<void> {
    for (const remote of remoteArticles) {
      const local = await this.deps.db.articles.get(remote.id);
      if (!local) {
        await this.deps.db.articles.add(remote);
        continue;
      }
      const merged: Article = {
        ...local,
        searchTerms: Array.from(
          new Set([...local.searchTerms, ...remote.searchTerms]),
        ),
        usageCount: Math.max(local.usageCount, remote.usageCount),
        version: Math.max(local.version, remote.version),
      };
      await this.deps.db.articles.put(merged);
    }
  }
}
