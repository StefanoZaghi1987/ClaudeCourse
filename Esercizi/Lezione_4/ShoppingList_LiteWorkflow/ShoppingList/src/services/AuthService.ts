import type { UpdateSpec } from 'dexie';
import type { ShoppingListDB, UsersDB } from '@db';
import type { EventBus } from '@utils/events';
import type { GuestUser, User, UserPreferences } from '@models';
import { generateUUID } from '@utils/uuid';
import { isValidEmail, isValidPassword } from '@utils/validators';
import type { StorageWrapper } from './index';
import type { PasswordHasher } from './PasswordHasher';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from './errors';

// Note: AuthService does NOT take a SyncLogger — see plan Deviation 2 (EntityType
// has no 'user' variant, and user records are device-local in the MVP). It still
// emits auth:state-changed via the shared EventBus.
export interface AuthServiceDeps {
  db: ShoppingListDB;
  users: UsersDB;
  events: EventBus;
  storage: StorageWrapper;
  hasher: PasswordHasher;
}

const CURRENT_USER_KEY = 'currentUserId';
const DEVICE_ID_KEY = 'deviceId';

export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  async getCurrentUser(): Promise<User | undefined> {
    const id = this.deps.storage.get<string>(CURRENT_USER_KEY);
    if (!id) return undefined;
    return this.deps.db.users.get(id);
  }

  async createGuestUser(): Promise<GuestUser> {
    let deviceId = this.deps.storage.get<string>(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateUUID();
      this.deps.storage.set(DEVICE_ID_KEY, deviceId);
    }
    const now = Date.now();
    const guest: GuestUser = {
      id: generateUUID(),
      name: 'Ospite',
      isGuest: true,
      deviceId,
      createdAt: now,
      lastLoginAt: now,
      preferences: {},
    };

    // AuthService bypasses UsersDB.create() because NewUser does not carry
    // deviceId. Writes the full user record directly via the Dexie table.
    await this.deps.db.users.add(guest);
    this.deps.storage.set(CURRENT_USER_KEY, guest.id);
    this.deps.events.emit('auth:state-changed', { userId: guest.id });
    return guest;
  }

  async register(name: string, email: string, password: string): Promise<User> {
    if (name.trim().length === 0) {
      throw new ValidationError('name', 'cannot be empty');
    }
    if (!isValidEmail(email)) {
      throw new ValidationError('email', 'invalid format');
    }
    if (!isValidPassword(password)) {
      throw new ValidationError('password', 'min 8 chars');
    }

    const existing = await this.deps.users.getByEmail(email);
    if (existing) {
      throw new ConflictError('email', 'already registered');
    }

    const passwordHash = await this.deps.hasher.hash(password);
    const now = Date.now();
    const current = await this.getCurrentUser();

    if (current && !current.isGuest) {
      throw new ConflictError('session', 'already registered');
    }

    let user: User;
    if (current && current.isGuest) {
      // Guest → registered migration: preserve the SAME user id so every
      // list/item/share owned by the guest remains accessible.
      const patch: Partial<User> = {
        name,
        email,
        passwordHash,
        isGuest: false,
        lastLoginAt: now,
      };
      // Bypass UsersDB.update() wrapper for consistency with the fresh branch
      // (which uses db.users.add) and createGuestUser (db.users.add).
      await this.deps.db.users.update(
        current.id,
        patch as unknown as UpdateSpec<User>,
      );
      user = { ...current, ...patch };
    } else {
      user = {
        id: generateUUID(),
        name,
        email,
        passwordHash,
        isGuest: false,
        createdAt: now,
        lastLoginAt: now,
        preferences: {},
      };
      await this.deps.db.users.add(user);
    }

    this.deps.storage.set(CURRENT_USER_KEY, user.id);
    this.deps.events.emit('auth:state-changed', { userId: user.id });
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const user = await this.deps.users.getByEmail(email);
    // SECURITY NOTE: returning NotFoundError on missing email leaks user existence
    // (email enumeration). Acceptable for MVP single-device; Phase 5 (auth backend)
    // should return a uniform ForbiddenError('invalid credentials') for both
    // "unknown email" and "wrong password" to prevent enumeration attacks.
    if (!user) throw new NotFoundError('user');
    const hash = user.passwordHash;
    if (!hash) throw new ForbiddenError('no password set on user');
    const match = await this.deps.hasher.compare(password, hash);
    if (!match) throw new ForbiddenError('invalid credentials');

    const now = Date.now();
    // NOTE: no logSync here — lastLoginAt is session metadata, not domain
    // state (see spec §3.4 and plan Deviation 2).
    await this.deps.db.users.update(user.id, { lastLoginAt: now } as unknown as UpdateSpec<User>);
    this.deps.storage.set(CURRENT_USER_KEY, user.id);
    this.deps.events.emit('auth:state-changed', { userId: user.id });
    return { ...user, lastLoginAt: now };
  }

  async logout(): Promise<void> {
    // Leaves the previous user's record untouched. A fresh guest takes over
    // the session and inherits the persisted deviceId. createGuestUser()
    // overwrites currentUserId, so we intentionally do NOT clear it first —
    // that would wedge the session if createGuestUser threw.
    await this.createGuestUser();
  }

  async updateProfile(
    userId: string,
    changes: { name?: string; preferences?: UserPreferences },
  ): Promise<void> {
    if (changes.name !== undefined && changes.name.trim().length === 0) {
      throw new ValidationError('name', 'cannot be empty');
    }
    await this.deps.db.users.update(userId, changes as unknown as UpdateSpec<User>);
    this.deps.events.emit('auth:state-changed', { userId });
  }

  async isAuthenticated(): Promise<boolean> {
    const current = await this.getCurrentUser();
    return !!current && !current.isGuest;
  }
}
