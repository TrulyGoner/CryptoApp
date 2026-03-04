import { CRYPTOCOMPARE_API_KEY, CRYPTOCOMPARE_BASE_URL } from "@/shared/config";

export interface PriceResponse {
  USD?: number;
  Response?: string;
  Message?: string;
}

export interface CoinInfo {
  Symbol: string;
  FullName: string;
}

let coinListCache: CoinInfo[] | null = null;

export async function fetchCoinList(): Promise<CoinInfo[]> {
  if (coinListCache) return coinListCache;

  try {
    const url = `${CRYPTOCOMPARE_BASE_URL}/all/coinlist?summary=true&api_key=${CRYPTOCOMPARE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.Data) {
      coinListCache = Object.values(data.Data as Record<string, { Symbol: string; FullName: string }>).map(
        (c) => ({ Symbol: c.Symbol, FullName: c.FullName }),
      );
      return coinListCache;
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchCryptoPrice(
  symbol: string,
): Promise<number | null> {
  try {
    const url = `${CRYPTOCOMPARE_BASE_URL}/price?fsym=${encodeURIComponent(symbol)}&tsyms=USD&api_key=${CRYPTOCOMPARE_API_KEY}`;
    const res = await fetch(url);
    const data: PriceResponse = await res.json();

    if (data.USD !== undefined) {
      return data.USD;
    }
    return null;
  } catch {
    return null;
  }
}
