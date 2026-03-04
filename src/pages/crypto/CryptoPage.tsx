import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchCryptoPrice } from "@/shared/api";
import { useCryptoPrices } from "@/shared/hooks";
import { loadCoins, saveCoins } from "@/shared/lib";
import { Button, Input } from "@/shared/ui";
import type { CryptoData } from "@/entities/crypto";
import { CryptoItem, SearchModal } from "@/components";
import "./CryptoPage.css";

export function CryptoPage() {
  const queryClient = useQueryClient();
  const [symbols, setSymbols] = useState<string[]>(() => {
    const saved = loadCoins();
    return saved.length > 0 ? saved.map((c) => c.symbol) : ["DOGE"];
  });
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const priceQueries = useCryptoPrices(symbols);

  const [priceHistory, setPriceHistory] = useState<
    Record<string, { prev: number | null; current: number | null }>
  >(() => {
    const saved = loadCoins();
    const map: Record<string, { prev: number | null; current: number | null }> = {};
    saved.forEach((c) => {
      map[c.symbol] = { prev: c.prevPrice, current: c.price };
    });
    return map;
  });

  useEffect(() => {
    setPriceHistory((prev) => {
      const next = { ...prev };
      let changed = false;
      symbols.forEach((sym, i) => {
        const newPrice = priceQueries[i]?.data ?? null;
        if (newPrice === null) return;
        const entry = next[sym];
        if (!entry) {
          next[sym] = { prev: newPrice, current: newPrice };
          changed = true;
        } else if (entry.current !== newPrice) {
          next[sym] = { prev: entry.current, current: newPrice };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [priceQueries, symbols]);

  const coins: CryptoData[] = symbols.map((symbol, i) => {
    const query = priceQueries[i];
    const history = priceHistory[symbol];
    return {
      symbol,
      price: query.data ?? null,
      prevPrice: history?.prev ?? null,
      loading: query.isLoading || query.isFetching,
    };
  });

  useEffect(() => {
    saveCoins(
      coins.map((c) => ({
        symbol: c.symbol,
        price: c.price,
        prevPrice: c.prevPrice,
      })),
    );
  }, [coins]);

  const updateCoin = useCallback(
    (symbol: string) => {
      queryClient.invalidateQueries({ queryKey: ["cryptoPrice", symbol] });
    },
    [queryClient],
  );

  const updateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["cryptoPrice"] });
  }, [queryClient]);

  const handleSearch = useCallback(
    async (symbol: string) => {
      setSearchError(null);

      if (symbols.includes(symbol)) {
        setSearchError(`${symbol} is already in your list.`);
        return;
      }

      setSearching(true);
      const price = await fetchCryptoPrice(symbol);
      setSearching(false);

      if (price === null) {
        setSearchError(`Cryptocurrency "${symbol}" not found.`);
        return;
      }

      queryClient.setQueryData(["cryptoPrice", symbol], price);
      setSymbols((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
    },
    [symbols, queryClient],
  );

  const handleDelete = useCallback((symbol: string) => {
    setSymbols((prev) => prev.filter((s) => s !== symbol));
  }, []);

  const handleUpdateAll = useCallback(() => {
    updateAll();
  }, [updateAll]);

  return (
    <>
      <div className="controls">
        <div className="search-trigger" onClick={() => setModalOpen(true)}>
          <img className="search-trigger-icon" src="/search.svg" alt="" />
          <Input
            type="text"
            className="search-trigger-input"
            placeholder="Search cryptocurrency…"
            readOnly
          />
        </div>
        <Button type="button" variant="info" onClick={handleUpdateAll}>
          Update all
        </Button>
      </div>

      <SearchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSearch}
        searching={searching}
      />

      {searchError && <p className="search-error">{searchError}</p>}

      <table className="coin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Price</th>
            <th>24h %</th>
            <th>24h Chart</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {coins
            .filter((coin) => coin.loading || coin.price !== null)
            .map((coin, i) => (
              <CryptoItem
                key={coin.symbol}
                coin={coin}
                index={i + 1}
                onDelete={handleDelete}
                onUpdate={updateCoin}
              />
            ))}
        </tbody>
      </table>
      {coins.length === 0 && (
        <p className="empty">
          No cryptocurrencies tracked. Search to add one!
        </p>
      )}
    </>
  );
}
