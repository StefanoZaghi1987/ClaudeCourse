import type { Table, UpdateSpec } from 'dexie';
import type { User, NewUser } from '@models';
import { generateUUID } from '@utils/uuid';

export class UsersDB {
  constructor(private readonly table: Table<User, string>) {}

  async create(data: NewUser): Promise<User> {
    const now = Date.now();
    const user: User = {
      id: generateUUID(),
      name: data.name,
      ...(data.email !== undefined ? { email: data.email } : {}),
      isGuest: data.isGuest,
      createdAt: now,
      lastLoginAt: now,
      preferences: {},
    };
    await this.table.add(user);
    return user;
  }

  async getById(id: string): Promise<User | undefined> {
    return this.table.get(id);
  }

  async getByEmail(email: string): Promise<User | undefined> {
    return this.table.where('email').equals(email).first();
  }

  async update(id: string, changes: Partial<User>): Promise<void> {
    await this.table.update(id, changes as unknown as UpdateSpec<User>);
  }
}
