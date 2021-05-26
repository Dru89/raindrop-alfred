export interface Group {
  computedId: string;
  name: string;
  count: number;
  collections: number[];
}

export interface Collection {
  id: number;
  name: string;
  count: number;
  children: number[];
  parent?: number;
  icon: string;
}
