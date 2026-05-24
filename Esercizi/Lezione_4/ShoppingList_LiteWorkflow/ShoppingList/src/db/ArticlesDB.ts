import type { Table, UpdateSpec } from 'dexie';
import type {
  Article,
  NewArticle,
  ArticleAutocompleteResult,
  CategoryType,
} from '@models';
import { generateUUID } from '@utils/uuid';

/**
 * Repository for the `articles` table.
 *
 * Articles are a denormalized catalog used for autocomplete when adding items
 * to a shopping list. They intentionally do NOT extend `BaseRepository`
 * because the `Article` model has no `updatedAt` / `deletedAt` / soft-delete
 * semantics — entries are either present or physically removed / replaced.
 */
export class ArticlesDB {
  constructor(private readonly table: Table<Article, string>) {}

  /**
   * Creates a new article with derived `searchTerms`, zero usage and
   * `isDefault: false`. Version starts at 1.
   */
  async create(data: NewArticle): Promise<Article> {
    const now = Date.now();
    const article: Article = {
      id: generateUUID(),
      name: data.name,
      ...(data.category !== undefined ? { category: data.category } : {}),
      searchTerms: this.deriveSearchTerms(data.name),
      usageCount: 0,
      createdAt: now,
      createdBy: data.createdBy,
      isDefault: false,
      version: 1,
    };
    await this.table.add(article);
    return article;
  }

  /**
   * Bulk-inserts articles, skipping any whose `id` already exists.
   * Intended for idempotent seeding of the default catalog.
   */
  async bulkAdd(articles: Article[]): Promise<void> {
    if (articles.length === 0) return;
    const ids = articles.map((a) => a.id);
    const existing = await this.table.where('id').anyOf(ids).primaryKeys();
    const existingSet = new Set(existing);
    const fresh = articles.filter((a) => !existingSet.has(a.id));
    if (fresh.length === 0) return;
    await this.table.bulkAdd(fresh);
  }

  async getAll(): Promise<Article[]> {
    return this.table.toArray();
  }

  async getById(id: string): Promise<Article | undefined> {
    return this.table.get(id);
  }

  async getByCategory(category: CategoryType): Promise<Article[]> {
    return this.table.where('category').equals(category).toArray();
  }

  /**
   * Increments `usageCount` by 1 via read-modify-write.
   * Uses the mandatory Dexie 4 `UpdateSpec<T>` double-cast.
   */
  async incrementUsage(id: string): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    const patch = {
      usageCount: current.usageCount + 1,
    } as unknown as UpdateSpec<Article>;
    await this.table.update(id, patch);
  }

  /**
   * Autocomplete search across `name` and `searchTerms`.
   *
   * Scoring (higher is better):
   *   - exact name match (lowercased)   => 100
   *   - name starts with query          =>  50
   *   - any search term starts w/ query =>  25
   *   - name contains query substring   =>  10
   *   - otherwise                       =>   0 (filtered out)
   *
   * Results are sorted by score desc, then by usageCount desc, then
   * truncated to `limit` (default 10). Queries shorter than 2 characters
   * return an empty array to avoid flooding the UI on first keystroke.
   */
  async search(
    query: string,
    limit = 10,
  ): Promise<ArticleAutocompleteResult[]> {
    if (query.length < 2) return [];
    const lower = query.toLowerCase();

    const all = await this.table.toArray();
    const scored = all
      .map((a) => ({ article: a, score: this.matchScore(a, lower) }))
      .filter((s) => s.score > 0)
      .sort((x, y) => {
        if (y.score !== x.score) return y.score - x.score;
        return y.article.usageCount - x.article.usageCount;
      })
      .slice(0, limit);

    return scored.map(({ article, score }) => ({
      id: article.id,
      name: article.name,
      ...(article.category !== undefined ? { category: article.category } : {}),
      usageCount: article.usageCount,
      matchScore: score,
    }));
  }

  private deriveSearchTerms(name: string): string[] {
    return name
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  private matchScore(article: Article, lowerQuery: string): number {
    const name = article.name.toLowerCase();
    if (name === lowerQuery) return 100;
    if (name.startsWith(lowerQuery)) return 50;
    if (article.searchTerms.some((t) => t.startsWith(lowerQuery))) return 25;
    if (name.includes(lowerQuery)) return 10;
    return 0;
  }
}
