import { useQueries } from "@tanstack/react-query";
import { fetchHistory24h } from "@/shared/api";

export function useHistories24h(symbols: string[]) {
  return useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ["history24h", symbol],
      queryFn: () => fetchHistory24h(symbol),
      enabled: !!symbol,
      staleTime: 5 * 60 * 1000,
    })),
  });
}
