const STORAGE_KEY = "crypto-tracker-coins";

export interface SavedCoin {
  symbol: string;
  price: number | null;
  prevPrice: number | null;
}

export function loadCoins(): SavedCoin[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data: unknown = JSON.parse(saved);
      if (Array.isArray(data) && data.length > 0) {
        if (typeof data[0] === "string") {
          return (data as string[]).map((s) => ({ symbol: s, price: null, prevPrice: null }));
        }
        return data as SavedCoin[];
      }
    }
  } catch { /* ignore corrupted data */ }
  return [];
}

export function saveCoins(coins: SavedCoin[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coins));
}
