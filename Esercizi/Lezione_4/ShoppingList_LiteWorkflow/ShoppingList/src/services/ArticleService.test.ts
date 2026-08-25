import { describe, it, expect } from 'vitest';
import { ShoppingListDB, ArticlesDB } from '@db';
import { EventBus } from '@utils/events';
import { createSyncLogger } from './sync-logger';
import { ArticleService } from './ArticleService';
import { ValidationError } from './errors';
import type { Article } from '@models';

async function setup() {
  const db = new ShoppingListDB();
  await db.delete();
  await db.open();
  const articles = new ArticlesDB(db.articles);
  const events = new EventBus();
  const logSync = createSyncLogger(db);
  const svc = new ArticleService({ db, articles, events, logSync });
  return { db, svc, events, articles };
}

describe('ArticleService.search', () => {
  it('returns [] for queries shorter than 2 characters', async () => {
    const { svc } = await setup();
    expect(await svc.search('')).toEqual([]);
    expect(await svc.search('a')).toEqual([]);
    expect(await svc.search(' ')).toEqual([]);
  });

  it('delegates to ArticlesDB.search with the given query', async () => {
    const { svc, articles } = await setup();
    await articles.create({ name: 'Latte Intero', createdBy: 'user-1' });
    const results = await svc.search('lat');
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Latte Intero');
  });
});

describe('ArticleService.create', () => {
  it('creates article, writes syncLog, emits article:created after commit', async () => {
    const { svc, db, events } = await setup();
    const recorded: unknown[] = [];
    // Capture DB state at the moment the post-commit event fires. The 3-phase
    // invariant says: by the time `article:created` is emitted, both the article
    // row and its syncLog entry are already durably committed. We prove it by
    // resolving a promise from inside the (sync-invoked) listener that snapshots
    // both counts, and asserting both are > 0 below.
    const snapshotAtEmit = new Promise<{ articles: number; syncLog: number }>(
      (resolve) => {
        events.on('article:created', (d) => {
          recorded.push(d);
          void (async () => {
            const articlesCount = await db.articles.count();
            const syncLogCount = await db.syncLog.count();
            resolve({ articles: articlesCount, syncLog: syncLogCount });
          })();
        });
      },
    );

    const art = await svc.create({ name: 'Pane', createdBy: 'user-1' }, 'user-1');
    const snapshot = await snapshotAtEmit;

    expect(art.name).toBe('Pane');
    expect(art.usageCount).toBe(0);
    expect(art.version).toBe(1);

    const stored = await db.articles.get(art.id);
    expect(stored?.name).toBe('Pane');

    const logs = await db.syncLog.where({ entityId: art.id }).toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      entityType: 'article',
      action: 'create',
      synced: false,
      retryCount: 0,
      userId: 'user-1',
    });

    expect(recorded).toEqual([{ article: art }]);

    // Commit-before-emit: when the listener fired, both writes were already
    // visible in IndexedDB. If `emit` had been inside the transaction, these
    // queries would have deadlocked or seen zero rows.
    expect(snapshot.articles).toBe(1);
    expect(snapshot.syncLog).toBe(1);
  });

  it('throws ValidationError on empty name', async () => {
    const { svc, db } = await setup();
    await expect(
      svc.create({ name: '   ', createdBy: 'user-1' }, 'user-1'),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await db.articles.count()).toBe(0);
    expect(await db.syncLog.count()).toBe(0);
  });
});

describe('ArticleService.incrementUsage', () => {
  it('bumps usageCount without writing to syncLog', async () => {
    const { svc, db, articles } = await setup();
    const art = await articles.create({ name: 'Pane', createdBy: 'user-1' });

    await svc.incrementUsage(art.id);
    await svc.incrementUsage(art.id);

    const updated = await db.articles.get(art.id);
    expect(updated?.usageCount).toBe(2);
    expect(await db.syncLog.count()).toBe(0);
  });
});

describe('ArticleService.getByCategory', () => {
  it('returns articles in the requested category', async () => {
    const { svc, articles } = await setup();
    await articles.create({
      name: 'Mela',
      category: 'frutta-verdura',
      createdBy: 'u',
    });
    await articles.create({
      name: 'Latte',
      category: 'latticini',
      createdBy: 'u',
    });
    const fruit = await svc.getByCategory('frutta-verdura');
    expect(fruit).toHaveLength(1);
    expect(fruit[0]?.name).toBe('Mela');
  });
});

describe('ArticleService.initializeDatabase', () => {
  it('seeds default articles when db is empty', async () => {
    const { svc, db } = await setup();
    expect(await db.articles.count()).toBe(0);
    await svc.initializeDatabase('system');
    expect(await db.articles.count()).toBeGreaterThan(0);
  });

  it('is idempotent (does not duplicate on second call)', async () => {
    const { svc, db } = await setup();
    await svc.initializeDatabase('system');
    const firstCount = await db.articles.count();
    await svc.initializeDatabase('system');
    expect(await db.articles.count()).toBe(firstCount);
  });
});

describe('ArticleService.syncFromRemote', () => {
  it('adds new remote articles', async () => {
    const { svc, db } = await setup();
    const remote: Article[] = [
      {
        id: 'r1',
        name: 'Remote Mela',
        searchTerms: ['remote', 'mela'],
        usageCount: 5,
        createdAt: 1,
        createdBy: 'server',
        isDefault: false,
        version: 1,
      },
    ];
    await svc.syncFromRemote(remote);
    const stored = await db.articles.get('r1');
    expect(stored?.name).toBe('Remote Mela');
  });

  it('merges existing articles: union searchTerms, max usageCount, max version', async () => {
    const { svc, db, articles } = await setup();
    const local = await articles.create({ name: 'Pane', createdBy: 'u' });
    await articles.incrementUsage(local.id);
    await articles.incrementUsage(local.id); // local usage = 2

    const remote: Article[] = [
      {
        ...local,
        searchTerms: [...local.searchTerms, 'panino'],
        usageCount: 10,
        version: local.version + 1,
      },
    ];
    await svc.syncFromRemote(remote);

    const merged = await db.articles.get(local.id);
    expect(merged?.searchTerms).toEqual(expect.arrayContaining(['pane', 'panino']));
    expect(merged?.usageCount).toBe(10);
    expect(merged?.version).toBe(local.version + 1);
  });

  it('never deletes a local article missing from remote', async () => {
    const { svc, db, articles } = await setup();
    await articles.create({ name: 'LocalOnly', createdBy: 'u' });
    await svc.syncFromRemote([]);
    expect(await db.articles.count()).toBe(1);
  });
});
