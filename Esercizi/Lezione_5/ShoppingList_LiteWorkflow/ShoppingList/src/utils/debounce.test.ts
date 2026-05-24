import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invokes the function once after the wait period when called a single time', () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced();

    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('coalesces multiple rapid calls into a single invocation with the latest arguments', () => {
    const spy = vi.fn((_n: number) => undefined);
    const debounced = debounce(spy, 100);

    debounced(1);
    debounced(2);
    debounced(3);
    debounced(4);
    debounced(5);

    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(5);
  });

  it('invokes the function twice when calls are spaced more than wait apart', () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced();
    vi.advanceTimersByTime(101);
    debounced();
    vi.advanceTimersByTime(101);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('cancel() prevents a pending invocation from firing', () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(100);

    expect(spy).not.toHaveBeenCalled();
  });

  it('cancel() after the function has already executed is a no-op', () => {
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(1);

    expect(() => debounced.cancel()).not.toThrow();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
