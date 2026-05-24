import './styles/main.css';
import { ShoppingListDB } from '@db';
import { eventBus } from '@utils/events';
import * as storage from '@utils/storage';
import { BcryptHasher, buildServices } from '@services';

async function bootstrap(): Promise<void> {
  const db = new ShoppingListDB();
  await db.open();

  const hasher = new BcryptHasher(10);
  const services = buildServices(db, eventBus, hasher, storage);

  await services.articles.initializeDatabase('system');

  let current = await services.auth.getCurrentUser();
  if (!current) {
    current = await services.auth.createGuestUser();
  }

  console.info('[ShoppingList] DB ready, seed applied');

  const app = document.querySelector<HTMLDivElement>('#app');
  if (app) {
    app.textContent = `ShoppingList — Fase 2 OK (user: ${current.name})`;
  }
}

bootstrap().catch((err: unknown) => {
  console.error('[ShoppingList] Bootstrap failed', err);
});
