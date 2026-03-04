import { useQuery } from "@tanstack/react-query";
import { fetchHistory24h } from "@/shared/api";

export function useHistory24h(symbol: string, enabled = true) {
  return useQuery({
    queryKey: ["history24h", symbol],
    queryFn: () => fetchHistory24h(symbol),
    enabled: enabled && !!symbol,
    staleTime: 5 * 60 * 1000, 
  });
}
