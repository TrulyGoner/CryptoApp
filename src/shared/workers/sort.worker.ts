export interface SortableItem {
  symbol: string;
  price: number | null;
  change24h: number | null;
}

export type SortField = "price" | "change24h" | null;
export type SortDir = "asc" | "desc";

export interface SortRequest {
  items: SortableItem[];
  field: SortField;
  direction: SortDir;
}

export interface SortResponse {
  sorted: string[]; 
}

function compare(a: number | null, b: number | null, dir: SortDir): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return dir === "asc" ? a - b : b - a;
}

self.onmessage = (e: MessageEvent<SortRequest>) => {
  const { items, field, direction } = e.data;

  if (!field) {
    const resp: SortResponse = { sorted: items.map((i) => i.symbol) };
    self.postMessage(resp);
    return;
  }

  const copy = [...items];
  copy.sort((a, b) => compare(a[field], b[field], direction));

  const resp: SortResponse = { sorted: copy.map((i) => i.symbol) };
  self.postMessage(resp);
};
