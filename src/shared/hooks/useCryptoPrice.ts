import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { fetchCryptoPrice } from "@/shared/api";

export function useCryptoPrice(symbol: string) {
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cryptoPrice", symbol],
    queryFn: async () => {
      const current = queryClient.getQueryData<number | null>(["cryptoPrice", symbol]);
      if (current != null) {
        setPrevPrice(current);
      }
      return fetchCryptoPrice(symbol);
    },
    enabled: !!symbol,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["cryptoPrice", symbol] });
  }, [queryClient, symbol]);

  return {
    price: query.data ?? null,
    prevPrice,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    invalidate,
  };
}
