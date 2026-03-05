import { useQueries } from "@tanstack/react-query";
import { fetchCryptoPrice } from "@/shared/api";

interface UseCryptoPricesOptions {
  lazy?: boolean;
}

export function useCryptoPrices(symbols: string[], options?: UseCryptoPricesOptions) {
  const lazy = options?.lazy ?? false;

  return useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: ["cryptoPrice", symbol],
      queryFn: () => fetchCryptoPrice(symbol),
      enabled: !!symbol,
      staleTime: lazy ? 5 * 60_000 : 30_000,
      ...(lazy
        ? { refetchInterval: false as const, refetchOnWindowFocus: false, refetchOnMount: false }
        : { refetchInterval: 30_000 }),
    })),
  });
}
