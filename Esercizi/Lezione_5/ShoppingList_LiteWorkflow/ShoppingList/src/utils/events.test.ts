import { describe, it, expect, vi } from 'vitest';
import { eventBus } from './events';
import type { List } from '@models';

const makeList = (): List => ({
  id: '1',
  name: 'Spesa',
  ownerId: 'u1',
  createdAt: 1,
  updatedAt: 1,
  version: 1,
});

describe('EventBus', () => {
  it('delivers emitted payload to listeners', () => {
    const spy = vi.fn();
    eventBus.on('list:created', spy);
    const list = makeList();

    eventBus.emit('list:created', { list });

    expect(spy).toHaveBeenCalledWith({ list });
    eventBus.off('list:created', spy);
  });

  it('off() removes listener', () => {
    const spy = vi.fn();
    eventBus.on('list:deleted', spy);
    eventBus.off('list:deleted', spy);

    eventBus.emit('list:deleted', { listId: '1' });

    expect(spy).not.toHaveBeenCalled();
  });

  it('once() fires only once then auto-removes', () => {
    const spy = vi.fn();
    eventBus.once('item:deleted', spy);

    eventBus.emit('item:deleted', { itemId: '1' });
    eventBus.emit('item:deleted', { itemId: '2' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ itemId: '1' });
  });

  it('emit with no listeners does not throw', () => {
    expect(() => eventBus.emit('sync:completed', { timestamp: 1 })).not.toThrow();
  });

  it('multiple listeners all receive the event', () => {
    const a = vi.fn();
    const b = vi.fn();
    eventBus.on('sync:error', a);
    eventBus.on('sync:error', b);

    eventBus.emit('sync:error', { error: 'oops' });

    expect(a).toHaveBeenCalledWith({ error: 'oops' });
    expect(b).toHaveBeenCalledWith({ error: 'oops' });
    eventBus.off('sync:error', a);
    eventBus.off('sync:error', b);
  });
});
