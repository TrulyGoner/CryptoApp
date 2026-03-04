import { useQuery } from "@tanstack/react-query";
import { fetchCryptoPrice } from "@/shared/api";

export function useCryptoPrice(symbol: string, enabled = true) {
  return useQuery({
    queryKey: ["cryptoPrice", symbol],
    queryFn: () => fetchCryptoPrice(symbol),
    enabled: enabled && !!symbol,
    staleTime: 10_000,
  });
}
