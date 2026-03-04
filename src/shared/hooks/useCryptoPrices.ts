import { useQueries } from "@tanstack/react-query";
import { fetchCryptoPrice } from "@/shared/api";

export function useCryptoPrices(symbols: string[]) {
  return useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ["cryptoPrice", symbol],
      queryFn: () => fetchCryptoPrice(symbol),
      enabled: !!symbol,
      staleTime: 10_000,
      refetchInterval: 10_000,
    })),
  });
}
