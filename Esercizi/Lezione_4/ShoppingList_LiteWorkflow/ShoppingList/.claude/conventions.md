# Conventions - ShoppingList MVP

## TypeScript Best Practices

### 1. Strict Mode (OBBLIGATORIO)

```typescript
// ✅ SEMPRE così
const user: User | undefined = await db.users.get(id);
if (!user) {
  throw new Error('User not found');
}
// Ora TypeScript sa che user è definito
console.log(user.name);

// ❌ MAI così
const user: any = await db.users.get(id);  // NO ANY!
console.log(user.name);  // Potrebbe crashare
```

### 2. Interfaces vs Types

**Usare `interface` per**:
- Modelli dati (List, Item, User, etc.)
- Strutture estendibili
- API contracts

```typescript
// ✅ Corretto
interface List {
  id: string;
  name: string;
  ownerId: string;
}

interface ListWithStats extends List {
  totalItems: number;
  checkedItems: number;
}
```

**Usare `type` per**:
- Union types
- Mapped types
- Utility types

```typescript
// ✅ Corretto
type Permission = 'read' | 'write';
type UnitType = 'pz' | 'kg' | 'l' | 'ml' | 'g' | 'conf' | '';
type Nullable<T> = T | null;
```

### 3. Null vs Undefined

**Convenzione progetto**: usare `undefined` per valori opzionali, `null` raramente.

```typescript
// ✅ Preferito
interface Item {
  notes?: string;        // undefined se non presente
  checkedAt?: number;    // undefined se non ancora spuntato
}

// ❌ Evitare
interface Item {
  notes: string | null;  // NO, usa undefined
}
```

### 4. Async/Await (NO .then/.catch)

```typescript
// ✅ Corretto
async function getList(id: string): Promise<List | undefined> {
  try {
    const list = await db.lists.get(id);
    return list;
  } catch (error) {
    console.error('Error fetching list:', error);
    throw error;
  }
}

// ❌ Evitare
function getList(id: string): Promise<List | undefined> {
  return db.lists.get(id)
    .then(list => list)
    .catch(error => {
      console.error(error);
      throw error;
    });
}
```

---

## Naming Conventions

### Variables e Functions

```typescript
// ✅ camelCase per variabili e funzioni
const currentUser = await getCurrentUser();
const itemsCount = items.length;

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

// Boolean: usa prefissi is/has/can/should
const isOnline = navigator.onLine;
const hasPermission = user.role === 'admin';
const canEdit = permissions.canWrite;
const shouldSync = isOnline && hasPendingChanges;
```

### Classes e Interfaces

```typescript
// ✅ PascalCase per classi e interfaces
class ListService {
  async createList(name: string): Promise<List> { }
}

interface ListWithStats extends List {
  totalItems: number;
}

// ✅ Prefisso "I" solo se necessario per disambiguare
interface IDatabase {  // Se esiste anche class Database
  connect(): Promise<void>;
}
```

### Constants

```typescript
// ✅ UPPER_SNAKE_CASE per costanti globali
const MAX_RETRY_COUNT = 3;
const DEFAULT_SYNC_INTERVAL = 30000; // 30s
const API_BASE_URL = 'https://api.example.com';

// ✅ camelCase per costanti locali/enums
const appEvents = {
  listCreated: 'list:created',
  itemAdded: 'item:added'
} as const;

enum Permission {
  Read = 'read',
  Write = 'write'
}
```

### Files e Directories

```
✅ Corretto:
src/
├── models/
│   ├── List.ts           # PascalCase per models
│   ├── Item.ts
│   └── index.ts
├── services/
│   ├── ListService.ts    # PascalCase + "Service"
│   └── SyncService.ts
├── components/
│   ├── list/
│   │   └── ListCard.ts   # PascalCase
│   └── item/
│       └── ItemRow.ts
└── utils/
    ├── helpers.ts        # camelCase per utilities
    └── validators.ts

❌ Evitare:
src/
├── list.model.ts         # NO suffissi .model
├── list-service.ts       # NO kebab-case
├── ListService.service.ts # NO doppio suffisso
```

---

## Commenti e Documentazione

### JSDoc per Functions Pubbliche

```typescript
/**
 * Crea una nuova lista della spesa
 * 
 * @param name - Nome della lista (min 1 carattere)
 * @param userId - ID utente proprietario
 * @returns Promise con la lista creata
 * @throws {Error} Se il nome è vuoto
 */
async function createList(name: string, userId: string): Promise<List> {
  if (!name.trim()) {
    throw new Error('Nome lista obbligatorio');
  }
  // ...
}
```

### Inline Comments (solo per logica complessa)

```typescript
// ✅ Commento utile
// Calcola match score con peso diverso per match esatto vs prefix
const matchScore = article.name === query ? 100 
  : article.name.startsWith(query) ? 50 
  : 10;

// ❌ Commento inutile (ovvietà)
// Incrementa il contatore di 1
counter++;

// Ottieni l'utente corrente dal database
const user = await db.users.get(userId);
```

### TODO Comments

```typescript
// TODO(mario): Implementare retry con exponential backoff
// FIXME: Race condition quando sync e modifica locale concorrenti
// NOTE: Questo workaround è temporaneo, rimuovere dopo fix upstream
// OPTIMIZE: Cacheare risultati autocomplete per 5s
```

---

## Error Handling

### Custom Error Classes

```typescript
// errors.ts
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class SyncError extends Error {
  constructor(
    message: string,
    public readonly retryCount: number
  ) {
    super(message);
    this.name = 'SyncError';
  }
}
```

### Try/Catch Best Practices

```typescript
// ✅ Specific error handling
async function deleteList(listId: string): Promise<void> {
  try {
    await checkPermissions(listId);
    await db.lists.update(listId, { deletedAt: Date.now() });
  } catch (error) {
    if (error instanceof PermissionError) {
      // Mostra messaggio specifico all'utente
      showToast('Non hai i permessi per eliminare questa lista', 'error');
      return;
    }
    
    // Log errori inaspettati
    console.error('Unexpected error deleting list:', error);
    throw error;
  }
}

// ❌ Generic catch-all
try {
  await deleteList(id);
} catch (error) {
  console.log('Error:', error);  // Troppo generico
}
```

---

## Code Organization

### Service Pattern

```typescript
// services/ListService.ts

export class ListService {
  constructor(
    private db: ShoppingListDB,
    private syncService: SyncService,
    private authService: AuthService
  ) {}
  
  async getAll(userId: string): Promise<ListWithStats[]> {
    // Implementazione
  }
  
  async getById(id: string): Promise<List | undefined> {
    // Implementazione
  }
  
  async create(data: NewList): Promise<List> {
    // Implementazione
  }
  
  async update(id: string, changes: Partial<List>): Promise<void> {
    // Implementazione
  }
  
  async delete(id: string): Promise<void> {
    // Implementazione
  }
  
  // Private helpers
  private async validatePermissions(listId: string, userId: string): Promise<void> {
    // Implementazione
  }
}
```

### Component Pattern (Vanilla TS)

```typescript
// components/list/ListCard.ts

export interface ListCardProps {
  list: ListWithStats;
  onClick: (listId: string) => void;
  onMenuClick: (listId: string) => void;
}

export class ListCard {
  private element: HTMLElement;
  
  constructor(private props: ListCardProps) {
    this.element = this.render();
    this.attachEventListeners();
  }
  
  render(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'list-card';
    card.innerHTML = `
      <div class="list-card-header">
        <h3>${this.props.list.name}</h3>
        <button class="menu-btn">⋯</button>
      </div>
      <div class="list-card-stats">
        ${this.props.list.totalItems} articoli · 
        ${this.props.list.checkedItems} completati
      </div>
    `;
    return card;
  }
  
  private attachEventListeners(): void {
    this.element.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).classList.contains('menu-btn')) {
        this.props.onClick(this.props.list.id);
      }
    });
    
    const menuBtn = this.element.querySelector('.menu-btn');
    menuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.props.onMenuClick(this.props.list.id);
    });
  }
  
  getElement(): HTMLElement {
    return this.element;
  }
  
  destroy(): void {
    // Cleanup event listeners se necessario
    this.element.remove();
  }
}
```

---

## Testing Conventions

### File Naming

```
src/
├── services/
│   ├── ListService.ts
│   └── ListService.test.ts       # Co-located con source
└── utils/
    ├── validators.ts
    └── validators.test.ts
```

### Test Structure

```typescript
// ListService.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ListService } from './ListService';

describe('ListService', () => {
  let service: ListService;
  let mockDb: MockDB;
  
  beforeEach(() => {
    mockDb = new MockDB();
    service = new ListService(mockDb, mockSyncService, mockAuthService);
  });
  
  afterEach(() => {
    mockDb.clear();
  });
  
  describe('create', () => {
    it('should create a new list with valid name', async () => {
      const list = await service.create({
        name: 'Test List',
        ownerId: 'user-123'
      });
      
      expect(list.name).toBe('Test List');
      expect(list.ownerId).toBe('user-123');
      expect(list.id).toBeDefined();
    });
    
    it('should throw error if name is empty', async () => {
      await expect(
        service.create({ name: '', ownerId: 'user-123' })
      ).rejects.toThrow('Nome lista obbligatorio');
    });
  });
  
  describe('delete', () => {
    it('should soft delete list', async () => {
      // Arrange
      const list = await service.create({
        name: 'Test',
        ownerId: 'user-123'
      });
      
      // Act
      await service.delete(list.id);
      
      // Assert
      const deleted = await mockDb.lists.get(list.id);
      expect(deleted?.deletedAt).toBeDefined();
    });
    
    it('should throw error if user is not owner', async () => {
      // Test implementation
    });
  });
});
```

---

## Performance Best Practices

### 1. Debouncing/Throttling

```typescript
// utils/debounce.ts

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Usage
const debouncedSearch = debounce(async (query: string) => {
  const results = await articleService.search(query);
  displayResults(results);
}, 300);
```

### 2. Lazy Loading

```typescript
// ✅ Lazy load componenti pesanti
async function loadHeavyComponent(): Promise<typeof HeavyComponent> {
  const module = await import('./components/HeavyComponent');
  return module.HeavyComponent;
}

// Usage
button.addEventListener('click', async () => {
  const Component = await loadHeavyComponent();
  const instance = new Component(props);
  container.appendChild(instance.getElement());
});
```

### 3. Memoization

```typescript
// utils/memoize.ts

export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

// Usage
const expensiveCalculation = memoize((a: number, b: number) => {
  // Heavy computation
  return a * b * Math.random();
});
```

---

## CSS/Tailwind Conventions

### Class Ordering

```html
<!-- ✅ Ordine consigliato -->
<div class="
  flex items-center justify-between     <!-- Layout -->
  w-full h-12 p-4                       <!-- Sizing/Spacing -->
  bg-white border border-gray-200       <!-- Background/Border -->
  text-gray-900 font-medium             <!-- Typography -->
  rounded-lg shadow-sm                  <!-- Effects -->
  hover:bg-gray-50 focus:ring-2         <!-- States -->
">
  Content
</div>
```

### Custom CSS (quando Tailwind non basta)

```css
/* styles/components.css */

/* ✅ BEM-style naming */
.list-card {
  @apply bg-white rounded-lg shadow-sm p-4;
}

.list-card__header {
  @apply flex items-center justify-between mb-2;
}

.list-card__title {
  @apply text-lg font-semibold text-gray-900;
}

.list-card--selected {
  @apply ring-2 ring-primary-500;
}
```

---

## Git Commit Messages

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: Nuova feature
- `fix`: Bug fix
- `refactor`: Refactoring (no feature/fix)
- `style`: Formattazione, missing semicolons, etc.
- `docs`: Documentazione
- `test`: Aggiunta test
- `chore`: Build, dependencies, etc.

### Examples

```bash
# ✅ Good commits
git commit -m "feat(list): add autocomplete for articles"
git commit -m "fix(sync): resolve race condition in conflict resolution"
git commit -m "refactor(db): extract repository pattern from services"
git commit -m "docs(sync): update sync strategy documentation"

# ❌ Bad commits
git commit -m "fixed bug"
git commit -m "WIP"
git commit -m "asdfasdf"
```

---

## Security Best Practices

### 1. Input Validation

```typescript
// ✅ Valida SEMPRE input utente
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function sanitizeHTML(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;  // Auto-escape HTML
  return div.innerHTML;
}
```

### 2. XSS Prevention

```typescript
// ✅ Usa textContent, non innerHTML per user input
element.textContent = userInput;

// ❌ MAI fare questo con user input
element.innerHTML = userInput;  // XSS vulnerability!

// ✅ Se DEVI usare innerHTML, sanitizza
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

### 3. Password Hashing

```typescript
// ✅ Usa librerie consolidate
import bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ❌ MAI implementare crypto custom
function badHash(password: string): string {
  return btoa(password);  // NO! Reversibile!
}
```

---

## Accessibility (A11y)

### Semantic HTML

```html
<!-- ✅ Usa elementi semantici -->
<button type="button" aria-label="Elimina lista">
  <svg>...</svg>
</button>

<!-- ❌ Evita div/span cliccabili -->
<div onclick="deleteList()">Elimina</div>
```

### Keyboard Navigation

```typescript
// ✅ Supporta keyboard
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleSubmit();
  } else if (e.key === 'Escape') {
    handleCancel();
  }
});

// ✅ Focus management
function openModal(modal: HTMLElement): void {
  modal.style.display = 'block';
  
  // Trap focus dentro modal
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length > 0) {
    (focusableElements[0] as HTMLElement).focus();
  }
}
```

---

**Riepilogo**: Segui queste convenzioni per mantenere codebase pulita, type-safe e manutenibile.
