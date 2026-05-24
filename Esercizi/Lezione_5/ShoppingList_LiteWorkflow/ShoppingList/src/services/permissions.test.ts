import { describe, it, expect } from 'vitest';
import type { List, Share } from '@models';
import { checkPermissions, NO_ACCESS } from './permissions';

const BASE_LIST: List = {
  id: 'L1',
  name: 'Spesa',
  ownerId: 'owner',
  createdAt: 0,
  updatedAt: 0,
  version: 1,
};

type ShareOverrides = {
  [K in keyof Share]?: Share[K] | undefined;
};

function share(overrides: ShareOverrides = {}): Share {
  const base: Share = {
    id: 'S1',
    listId: 'L1',
    userId: 'other',
    permission: 'read',
    createdAt: 0,
    createdBy: 'owner',
    version: 1,
    acceptedAt: 1,
  };
  const result = { ...base, ...overrides } as Share & { acceptedAt?: number };
  if (overrides.acceptedAt === undefined && 'acceptedAt' in overrides) {
    delete result.acceptedAt;
  }
  return result;
}

describe('checkPermissions', () => {
  it('returns NO_ACCESS when list is undefined', () => {
    expect(checkPermissions(undefined, [], 'owner')).toEqual(NO_ACCESS);
  });

  it('returns NO_ACCESS when list is soft-deleted (even for owner)', () => {
    expect(
      checkPermissions({ ...BASE_LIST, deletedAt: 1 }, [], 'owner'),
    ).toEqual(NO_ACCESS);
  });

  it('owner gets full permissions', () => {
    expect(checkPermissions(BASE_LIST, [], 'owner')).toEqual({
      isOwner: true,
      canRead: true,
      canWrite: true,
      canDelete: true,
      canShare: true,
    });
  });

  it('accepted writer gets read+write only', () => {
    const shares = [share({ userId: 'alice', permission: 'write' })];
    expect(checkPermissions(BASE_LIST, shares, 'alice')).toEqual({
      isOwner: false,
      canRead: true,
      canWrite: true,
      canDelete: false,
      canShare: false,
    });
  });

  it('accepted reader gets read only', () => {
    const shares = [share({ userId: 'bob', permission: 'read' })];
    expect(checkPermissions(BASE_LIST, shares, 'bob')).toEqual({
      isOwner: false,
      canRead: true,
      canWrite: false,
      canDelete: false,
      canShare: false,
    });
  });

  it('pending share (no acceptedAt) grants NO_ACCESS', () => {
    const shares = [share({ userId: 'carol', permission: 'write', acceptedAt: undefined })];
    expect(checkPermissions(BASE_LIST, shares, 'carol')).toEqual(NO_ACCESS);
  });

  it('share targeting another list grants NO_ACCESS', () => {
    const shares = [share({ userId: 'dave', listId: 'OTHER', permission: 'write' })];
    expect(checkPermissions(BASE_LIST, shares, 'dave')).toEqual(NO_ACCESS);
  });

  it('share targeting another user grants NO_ACCESS', () => {
    const shares = [share({ userId: 'eve', permission: 'write' })];
    expect(checkPermissions(BASE_LIST, shares, 'frank')).toEqual(NO_ACCESS);
  });

  it('empty shares array grants NO_ACCESS to non-owner', () => {
    expect(checkPermissions(BASE_LIST, [], 'stranger')).toEqual(NO_ACCESS);
  });

  it('multiple shares: only the accepted one for the user counts', () => {
    const shares = [
      share({ id: 'S1', userId: 'alice', permission: 'read', acceptedAt: undefined }),
      share({ id: 'S2', userId: 'alice', permission: 'write', acceptedAt: 5 }),
    ];
    expect(checkPermissions(BASE_LIST, shares, 'alice').canWrite).toBe(true);
  });

  it('NO_ACCESS is frozen', () => {
    expect(Object.isFrozen(NO_ACCESS)).toBe(true);
  });
});
