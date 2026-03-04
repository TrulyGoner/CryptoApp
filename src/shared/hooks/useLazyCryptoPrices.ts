import { useQueries } from "@tanstack/react-query";
import { fetchCryptoPrice } from "@/shared/api";

export function useLazyCryptoPrices(symbols: string[]) {
  return useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ["cryptoPrice", symbol],
      queryFn: () => fetchCryptoPrice(symbol),
      enabled: !!symbol,
      staleTime: 5 * 60_000,
      refetchInterval: false as const,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    })),
  });
}
