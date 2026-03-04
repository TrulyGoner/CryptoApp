export interface CryptoData {
  symbol: string;
  price: number | null;
  prevPrice: number | null;
  loading: boolean;
}

export function makeCoin(symbol: string): CryptoData {
  return {
    symbol: symbol.toUpperCase(),
    price: null,
    prevPrice: null,
    loading: true,
  };
}
