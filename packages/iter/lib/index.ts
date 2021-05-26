export type MapItem<Type, Result> = (
  item: Type,
  idx: number,
  iter: Iterable<Type>
) => Result;
export type Guard<Type, Result extends Type> = (
  item: Type,
  idx: number,
  iter: Iterable<Type>
) => item is Result;
export type Predicate<T> = MapItem<T, boolean>;

const not =
  <T>(pred: Predicate<T>): Predicate<T> =>
  (...args) =>
    !pred(...args);

export function isIterable<T = unknown>(obj: unknown): obj is Iterable<T> {
  if (typeof obj !== 'object') return false;
  if (obj == null) return false;
  const iter = obj as Iterable<T>;
  return typeof iter[Symbol.iterator] === 'function';
}

export function* withIndex<T>(iter: Iterable<T>): Iterable<[T, number]> {
  let idx = 0;
  for (const item of iter) {
    yield [item, idx];
    idx += 1;
  }
}

export function* map<T, S>(
  iter: Iterable<T>,
  callback: MapItem<T, S>
): Iterable<S> {
  for (const [item, idx] of withIndex(iter)) {
    yield callback(item, idx, iter);
  }
}

export function copy<T>(iter: Iterable<T>): Iterable<T> {
  return map(iter, (v) => v);
}

export function forEach<T>(
  iter: Iterable<T>,
  callback: MapItem<T, void>
): void {
  map(iter, callback);
}

export function filter<T, S extends T>(
  iter: Iterable<T>,
  pred: Guard<T, S>
): Iterable<S>;
export function filter<T>(iter: Iterable<T>, pred: Predicate<T>): Iterable<T>;
export function* filter<T>(iter: Iterable<T>, pred: Predicate<T>): Iterable<T> {
  for (const [item, idx] of withIndex(iter)) {
    if (pred(item, idx, iter)) yield item;
  }
}

export function length<T>(iter: Iterable<T>): number {
  let len = 0;
  for (const _item of iter) len += 1;
  return len;
}

export function* concat<T>(...iters: Array<T | Iterable<T>>): Iterable<T> {
  for (const iter of iters) {
    if (isIterable(iter)) {
      for (const item of iter) {
        yield item;
      }
    } else {
      yield iter;
    }
  }
}

export function* slice<T>(iter: Iterable<T>, start = 0, end = -1): Iterable<T> {
  // if we specify a start or end that's not the last element, we
  // need to know how long the iterator is so we can know when to
  // start or end.
  let newStart = start;
  let newEnd = end;
  if (start < -1 || end < -1) {
    const len = length(iter);
    newStart = start < -1 ? len + start : start;
    newEnd = end < -1 ? end + start : end;
  }

  for (const [item, idx] of withIndex(iter)) {
    if (newEnd < idx) return;
    if (newStart >= idx) yield item;
  }
}

export function find<T, S extends T>(
  iter: Iterable<T>,
  pred: Guard<T, S>
): S | undefined;
export function find<T>(iter: Iterable<T>, pred: Predicate<T>): T | undefined;
export function find<T>(iter: Iterable<T>, pred: Predicate<T>): T | undefined {
  for (const [item, idx] of withIndex(iter)) {
    if (pred(item, idx, iter)) return item;
  }
  return undefined;
}

export function index<T>(iter: Iterable<T>, idx: number): T | undefined {
  return find(iter, (item, itemIndex) => idx === itemIndex);
}

export function findIndex<T>(iter: Iterable<T>, pred: Predicate<T>): number {
  for (const [item, idx] of withIndex(iter)) {
    if (pred(item, idx, iter)) return idx;
  }
  return -1;
}

export function indexOf<T>(iter: Iterable<T>, item: T, fromIndex = 0): number {
  return findIndex(iter, (value, idx) => item === value && idx >= fromIndex);
}

export function every<T, S extends T>(
  iter: Iterable<T>,
  pred: Guard<T, S>
): iter is Iterable<S>;
export function every<T>(iter: Iterable<T>, pred: Predicate<T>): boolean;
export function every<T>(iter: Iterable<T>, pred: Predicate<T>): boolean {
  return !find(iter, not(pred));
}

export function some<T>(iter: Iterable<T>, pred: Predicate<T>): boolean {
  return !!find(iter, pred);
}

type Reducer<T, U = T> = (
  prev: U,
  curr: T,
  idx: number,
  iter: Iterable<T>
) => U;
export function reduce<T>(iter: Iterable<T>, reducer: Reducer<T>): T;
export function reduce<T>(iter: Iterable<T>, reducer: Reducer<T>, init: T): T;
export function reduce<T, U>(
  iter: Iterable<T>,
  reducer: Reducer<T, U>,
  init: U
): U;
export function reduce<T, U = T>(
  iter: Iterable<T>,
  reducer: Reducer<T, U>,
  init?: T | U
): T | U {
  let value: T | U | undefined = init;
  for (const [item, idx] of withIndex(iter)) {
    if (value === undefined) {
      value = item as T | U;
    } else {
      value = reducer(value as U, item, idx, iter);
    }
  }
  if (arguments.length === 2 && value === undefined) {
    throw new TypeError('Reduce of empty iterable with no initial value');
  } else {
    return value as T | U;
  }
}

export function toMap<T, R>(iter: Iterable<T>, mapfn: MapItem<T, R>): Map<R, T>;
export function toMap<T, K extends keyof T>(
  iter: Iterable<T>,
  key: K
): Map<T[K], T>;
export function toMap<T, K extends keyof T, R>(
  iter: Iterable<T>,
  mapOrKey: K | MapItem<T, R>
): Map<T[K] | R, T> {
  const mapfn =
    typeof mapOrKey === 'function' ? mapOrKey : (item: T) => item[mapOrKey];
  const output = new Map<T[K] | R, T>();
  for (const [item, idx] of withIndex(iter)) {
    const key = mapfn(item, idx, iter);
    output.set(key, item);
  }
  return output;
}

export function* of<T>(...items: T[]): Iterable<T> {
  for (const item of items) yield item;
}

export function from<T>(iter: Iterable<T>): Iterable<T>;
export function from<T, U>(
  iter: Iterable<T>,
  mapfn: (value: T, idx: number) => U
): Iterable<U>;
export function from<T, U = T>(
  iter: Iterable<T>,
  mapfn?: (value: T, idx: number) => U
): Iterable<U> {
  if (mapfn) return map(iter, mapfn);
  // If mapfn wasn't provided, U can only be T.
  return copy(iter) as unknown as Iterable<U>;
}
