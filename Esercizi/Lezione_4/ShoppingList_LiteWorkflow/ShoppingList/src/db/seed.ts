import type { Article, CategoryType } from '@models';
import { generateUUID } from '@utils/uuid';
import type { ArticlesDB } from './ArticlesDB';

type SeedArticle = {
  name: string;
  category: CategoryType;
  searchTerms: string[];
};

export const DEFAULT_ARTICLES: SeedArticle[] = [
  { name: 'Mele', category: 'frutta-verdura', searchTerms: ['mele', 'frutta'] },
  { name: 'Banane', category: 'frutta-verdura', searchTerms: ['banane', 'frutta'] },
  { name: 'Pomodori', category: 'frutta-verdura', searchTerms: ['pomodori', 'verdura'] },
  { name: 'Insalata', category: 'frutta-verdura', searchTerms: ['insalata', 'verdura'] },
  { name: 'Latte Intero', category: 'latticini', searchTerms: ['latte', 'intero'] },
  { name: 'Yogurt Bianco', category: 'latticini', searchTerms: ['yogurt', 'bianco'] },
  { name: 'Parmigiano', category: 'latticini', searchTerms: ['parmigiano', 'formaggio'] },
  { name: 'Petto di Pollo', category: 'carne-pesce', searchTerms: ['pollo', 'petto', 'carne'] },
  { name: 'Salmone', category: 'carne-pesce', searchTerms: ['salmone', 'pesce'] },
  { name: 'Pane', category: 'pane-pasta', searchTerms: ['pane'] },
  { name: 'Pasta', category: 'pane-pasta', searchTerms: ['pasta'] },
  { name: 'Acqua Naturale', category: 'bevande', searchTerms: ['acqua', 'naturale'] },
  { name: "Succo d'Arancia", category: 'bevande', searchTerms: ['succo', 'arancia'] },
  { name: 'Carta Igienica', category: 'igiene', searchTerms: ['carta', 'igienica'] },
  { name: 'Detersivo Piatti', category: 'pulizia', searchTerms: ['detersivo', 'piatti'] },
];

/**
 * Idempotently seeds default catalog articles into the provided `ArticlesDB`.
 *
 * Must be called with an `ArticlesDB` instance bound to the desired Dexie
 * table — the helper does NOT touch the `db` singleton, so it is safe to use
 * from tests and from the service layer with injected dependencies.
 */
export async function seedDefaultArticles(
  articles: ArticlesDB,
  userId = 'system',
): Promise<void> {
  const existing = (await articles.getAll()).filter((a) => a.isDefault === true);
  if (existing.length > 0) return;

  const now = Date.now();
  const seeded: Article[] = DEFAULT_ARTICLES.map((a) => ({
    id: generateUUID(),
    name: a.name,
    category: a.category,
    searchTerms: a.searchTerms,
    usageCount: 0,
    createdAt: now,
    createdBy: userId,
    isDefault: true,
    version: 1,
  }));
  await articles.bulkAdd(seeded);
}
