import { describe, it, expect, beforeEach } from 'vitest';
import { ShoppingListDB } from './schema';
import { ArticlesDB } from './ArticlesDB';
import type { Article } from '@models';

let db: ShoppingListDB;
let repo: ArticlesDB;

beforeEach(async () => {
  db = new ShoppingListDB();
  await db.delete();
  await db.open();
  repo = new ArticlesDB(db.articles);
});

describe('ArticlesDB', () => {
  it('creates an article with searchTerms derived from name', async () => {
    const art = await repo.create({ name: 'Latte Intero', createdBy: 'u' });
    expect(art.searchTerms).toContain('latte');
    expect(art.searchTerms).toContain('intero');
    expect(art.usageCount).toBe(0);
    expect(art.isDefault).toBe(false);
    expect(art.version).toBe(1);
  });

  it('search finds articles by partial name match', async () => {
    await repo.create({ name: 'Latte Intero', createdBy: 'u' });
    await repo.create({ name: 'Latte Scremato', createdBy: 'u' });
    await repo.create({ name: 'Pane', createdBy: 'u' });

    const results = await repo.search('lat');
    expect(results.length).toBe(2);
    expect(results.every((r) => r.name.toLowerCase().includes('lat'))).toBe(true);
  });

  it('search orders results by matchScore desc then usageCount desc', async () => {
    const exact = await repo.create({ name: 'Latte', createdBy: 'u' });
    const prefix = await repo.create({ name: 'Latteria', createdBy: 'u' });
    await repo.incrementUsage(prefix.id);
    await repo.incrementUsage(prefix.id);

    const results = await repo.search('latte');
    expect(results[0]?.id).toBe(exact.id);
    expect(results[1]?.id).toBe(prefix.id);
  });

  it('incrementUsage bumps the counter', async () => {
    const art = await repo.create({ name: 'Pane', createdBy: 'u' });
    await repo.incrementUsage(art.id);
    await repo.incrementUsage(art.id);
    const updated = await db.articles.get(art.id);
    expect(updated?.usageCount).toBe(2);
  });

  it('search returns empty array for queries shorter than 2 chars', async () => {
    await repo.create({ name: 'Pane', createdBy: 'u' });
    expect(await repo.search('p')).toEqual([]);
  });

  it('getAll returns every article in the table', async () => {
    await repo.create({ name: 'Pane', createdBy: 'u' });
    await repo.create({ name: 'Latte', createdBy: 'u' });
    const all = await repo.getAll();
    expect(all.length).toBe(2);
  });

  it('bulkAdd is idempotent when articles with same id already exist', async () => {
    const seed: Article[] = [
      {
        id: 'seed-1',
        name: 'Mela',
        category: 'frutta-verdura',
        searchTerms: ['mela'],
        usageCount: 0,
        createdAt: 1,
        createdBy: 'system',
        isDefault: true,
        version: 1,
      },
      {
        id: 'seed-2',
        name: 'Pera',
        category: 'frutta-verdura',
        searchTerms: ['pera'],
        usageCount: 0,
        createdAt: 1,
        createdBy: 'system',
        isDefault: true,
        version: 1,
      },
    ];

    await repo.bulkAdd(seed);
    // Second call with same ids must not throw and must not duplicate
    await expect(repo.bulkAdd(seed)).resolves.toBeUndefined();

    const all = await repo.getAll();
    expect(all.length).toBe(2);
  });

  it('getByCategory filters articles by the given category', async () => {
    const latte = await repo.create({
      name: 'Latte',
      category: 'latticini',
      createdBy: 'u',
    });
    const yogurt = await repo.create({
      name: 'Yogurt',
      category: 'latticini',
      createdBy: 'u',
    });
    await repo.create({ name: 'Pane', category: 'pane-pasta', createdBy: 'u' });

    const latticini = await repo.getByCategory('latticini');
    const ids = latticini.map((a) => a.id).sort();
    expect(ids).toEqual([latte.id, yogurt.id].sort());
  });

  it('search respects the limit argument', async () => {
    await repo.create({ name: 'Latte Intero', createdBy: 'u' });
    await repo.create({ name: 'Latte Scremato', createdBy: 'u' });
    await repo.create({ name: 'Latte di Soia', createdBy: 'u' });
    await repo.create({ name: 'Latte di Riso', createdBy: 'u' });

    const results = await repo.search('latte', 2);
    expect(results.length).toBe(2);
  });
});
