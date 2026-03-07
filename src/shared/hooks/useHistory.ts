import { useQuery, useQueries } from "@tanstack/react-query";
import { fetchHistory24h } from "@/shared/api";

const historyQueryOptions = (symbol: string) => ({
  queryKey: ["history24h", symbol] as const,
  queryFn: () => fetchHistory24h(symbol),
  enabled: !!symbol,
  staleTime: 5 * 60_000,
});

export function useHistory24h(symbol: string, enabled = true) {
  return useQuery({
    ...historyQueryOptions(symbol),
    enabled: enabled && !!symbol,
  });
}

export function useHistories24h(symbols: string[]) {
  return useQueries({
    queries: symbols.map(historyQueryOptions),
  });
}
