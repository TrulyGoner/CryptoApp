import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { fetchCryptoPrice } from "@/shared/api";

export function useCryptoPrice(symbol: string) {
  const prevPriceRef = useRef<number | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cryptoPrice", symbol],
    queryFn: async () => {
      const current = queryClient.getQueryData<number | null>(["cryptoPrice", symbol]);
      if (current != null) {
        prevPriceRef.current = current;
      }
      return fetchCryptoPrice(symbol);
    },
    enabled: !!symbol,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  if (query.data != null && prevPriceRef.current === null) {
    prevPriceRef.current = query.data;
  }

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["cryptoPrice", symbol] });
  }, [queryClient, symbol]);

  return {
    price: query.data ?? null,
    prevPrice: prevPriceRef.current,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    invalidate,
  };
}
