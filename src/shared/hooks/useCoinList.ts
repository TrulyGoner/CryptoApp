import { useQuery } from "@tanstack/react-query";
import { fetchCoinList } from "@/shared/api";

export function useCoinList() {
  return useQuery({
    queryKey: ["coinList"],
    queryFn: fetchCoinList,
    staleTime: 5 * 60 * 1000, 
  });
}
