import type { List } from './List';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  defaultSortBy?: List['sortBy'];
  notifications?: boolean;
}

export interface User {
  id: string;
  email?: string;
  passwordHash?: string;
  name: string;
  avatar?: string;
  isGuest: boolean;
  createdAt: number;
  lastLoginAt: number;
  preferences: UserPreferences;
}

export interface NewUser {
  name: string;
  email?: string;
  isGuest: boolean;
}

export interface GuestUser extends User {
  isGuest: true;
  deviceId: string;
}
