import root from './root';

interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

interface DebounceOptions extends ThrottleOptions {
  maxWait?: number;
}

type AnyFunction = (this: unknown, ...args: unknown[]) => unknown;
type Args<F> = F extends (this: unknown, ...args: infer Arguments) => unknown
  ? Arguments
  : never;
type ReturnType<F> = F extends (
  this: unknown,
  ...args: unknown[]
) => infer Return
  ? Return
  : never;

interface Debounced<Func extends AnyFunction> {
  (...args: Args<Func>): ReturnType<Func> | undefined;
  cancel: () => void;
  flush: () => ReturnType<Func> | undefined;
  pending: () => boolean;
}

export function debounce<Func extends AnyFunction>(
  func: Func,
  wait = 0,
  { leading = false, trailing = false, maxWait }: DebounceOptions
): Debounced<Func> {
  let lastArgs: Args<Func> | undefined;
  let lastThis: unknown | undefined;
  let result: ReturnType<Func> | undefined;
  let timerId: number | NodeJS.Timeout | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  const useRAF =
    !wait &&
    wait !== 0 &&
    typeof (root as typeof globalThis).requestAnimationFrame === 'function';

  function invoke(time: number) {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args as Args<Func>) as ReturnType<Func>;
    return result;
  }

  function startTimer(pendingFunc: () => void, waitTime: number) {
    if (useRAF) {
      if (timerId) {
        (root as typeof globalThis).cancelAnimationFrame(Number(timerId));
      }
      return (root as typeof globalThis).requestAnimationFrame(pendingFunc);
    }
    return setTimeout(pendingFunc, waitTime);
  }

  function cancelTimer(id: number | NodeJS.Timeout) {
    if (useRAF) {
      (root as typeof globalThis).cancelAnimationFrame(Number(id));
    }
    clearTimeout(Number(id));
  }

  function remainingWait(time: number) {
    if (lastCallTime === undefined) return 1;
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait != null
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    if (lastCallTime === undefined) return true;
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    return (
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait != null && timeSinceLastInvoke >= maxWait)
    );
  }

  function trailingEdge(time: number) {
    timerId = undefined;
    if (trailing && lastArgs) {
      return invoke(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      trailingEdge(time);
      return;
    }
    timerId = startTimer(timerExpired, remainingWait(time));
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timerId = startTimer(timerExpired, wait);
    return leading ? invoke(time) : result;
  }

  function cancel() {
    if (timerId !== undefined) {
      cancelTimer(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
    lastThis = undefined;
    timerId = undefined;
  }

  function flush() {
    return timerId !== undefined ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timerId !== undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debounced = function debounced(this: unknown, ...args: Args<Func>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait != null) {
        timerId = startTimer(timerExpired, wait);
        return invoke(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = startTimer(timerExpired, wait);
    }
    return result;
  } as Debounced<Func>;

  debounced.cancel = cancel;
  debounced.pending = pending;
  debounced.flush = flush;
  return debounced;
}

export default function throttle<Func extends AnyFunction>(
  func: Func,
  wait = 0,
  options: ThrottleOptions = {}
): Debounced<Func> {
  return debounce(func, wait, {
    leading: options.leading ?? true,
    trailing: options.trailing ?? true,
    maxWait: wait,
  });
}
