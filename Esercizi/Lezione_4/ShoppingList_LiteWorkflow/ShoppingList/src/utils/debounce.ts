/**
 * Creates a debounced version of `func` that delays its invocation until
 * `wait` milliseconds have elapsed since the last time it was called.
 *
 * The returned function exposes a `cancel()` method that clears any pending
 * invocation. Calling `cancel()` after the function has already fired is a
 * no-op.
 *
 * The generic constraint `(...args: never[]) => void` is the standard
 * contravariant trick that allows the returned function to be assignable to
 * any call signature matching `T`, without resorting to `any`.
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number,
): T & { cancel(): void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: Parameters<T>): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      func(...args);
    }, wait);
  }) as T & { cancel(): void };

  debounced.cancel = (): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced;
}
