export function isSuperset<T>(parent: Set<T>, child: Set<T>): boolean {
  for (const elem of child) {
    if (!parent.has(elem)) {
      return false;
    }
  }
  return true;
}

export function union<T>(a: Set<T>, b: Set<T>): Set<T> {
  const unionSet = new Set<T>(a);
  for (const elem of b) {
    unionSet.add(elem);
  }
  return unionSet;
}

export function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  const intersectionSet = new Set<T>();
  for (const elem of b) {
    if (a.has(elem)) {
      intersectionSet.add(elem);
    }
  }
  return intersectionSet;
}

export function symmetricDifference<T>(a: Set<T>, b: Set<T>): Set<T> {
  const diff = new Set<T>(a);
  for (const elem of b) {
    if (a.has(elem)) {
      diff.delete(elem);
    } else {
      diff.add(elem);
    }
  }
  return diff;
}

export function difference<T>(a: Set<T>, b: Set<T>): Set<T> {
  const diff = new Set<T>(a);
  for (const elem of b) {
    diff.delete(elem);
  }
  return diff;
}
