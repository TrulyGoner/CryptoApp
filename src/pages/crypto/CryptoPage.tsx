import { useState, useCallback, useEffect } from "react";
import { fetchCryptoPrice } from "@/shared/api";
import { useInterval } from "@/shared/hooks";
import { POLL_INTERVAL_MS } from "@/shared/config";
import { loadCoins, saveCoins } from "@/shared/lib";
import { Button } from "@/shared/ui";
import { makeCoin } from "@/entities/crypto";
import type { CryptoData } from "@/entities/crypto";
import { CryptoItem, SearchBar } from "@/components";
import "./CryptoPage.css";

function loadSavedCoins(): CryptoData[] {
  const saved = loadCoins();
  if (saved.length > 0) {
    return saved.map((c) => ({
      symbol: c.symbol,
      price: c.price,
      prevPrice: c.prevPrice,
      loading: c.price === null,
    }));
  }
  return [makeCoin("DOGE")];
}

export function CryptoPage() {
  const [coins, setCoins] = useState<CryptoData[]>(loadSavedCoins);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    saveCoins(
      coins.map((c) => ({
        symbol: c.symbol,
        price: c.price,
        prevPrice: c.prevPrice,
      })),
    );
  }, [coins]);

  const updateCoin = useCallback(async (symbol: string) => {
    setCoins((prev) =>
      prev.map((c) => (c.symbol === symbol ? { ...c, loading: true } : c)),
    );
    const price = await fetchCryptoPrice(symbol);
    setCoins((prev) =>
      prev.map((c) => {
        if (c.symbol !== symbol) return c;
        const newPrice = price ?? c.price;
        const prevPrice =
          newPrice !== c.price ? c.price : (c.prevPrice ?? newPrice);
        return { ...c, prevPrice, price: newPrice, loading: false };
      }),
    );
  }, []);

  const updateAll = useCallback(async () => {
    setCoins((prev) => prev.map((c) => ({ ...c, loading: true })));

    setCoins((prev) => {
      prev.forEach((coin) => {
        fetchCryptoPrice(coin.symbol).then((price) => {
          setCoins((curr) =>
            curr.map((c) => {
              if (c.symbol !== coin.symbol) return c;
              const newPrice = price ?? c.price;
              const prevPrice =
                newPrice !== c.price ? c.price : (c.prevPrice ?? newPrice);
              return { ...c, prevPrice, price: newPrice, loading: false };
            }),
          );
        });
      });
      return prev;
    });
  }, []);

  const { restart } = useInterval(updateAll, POLL_INTERVAL_MS);

  const handleSearch = useCallback(async (symbol: string) => {
    setSearchError(null);

    let duplicate = false;
    setCoins((prev) => {
      duplicate = prev.some((c) => c.symbol === symbol);
      return prev;
    });

    if (duplicate) {
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

    setCoins((prev) => {
      if (prev.some((c) => c.symbol === symbol)) return prev;
      return [...prev, { symbol, price, prevPrice: null, loading: false }];
    });
  }, []);

  const handleDelete = useCallback((symbol: string) => {
    setCoins((prev) => prev.filter((c) => c.symbol !== symbol));
  }, []);

  const handleUpdateAll = useCallback(() => {
    updateAll();
    restart();
  }, [updateAll, restart]);

  return (
    <>
      <div className="controls">
        <SearchBar onSearch={handleSearch} searching={searching} />
        <Button type="button" variant="info" onClick={handleUpdateAll}>
          Update all
        </Button>
      </div>

      {searchError && <p className="search-error">{searchError}</p>}

      <ul className="coin-list">
        {coins
          .filter((coin) => coin.loading || coin.price !== null)
          .map((coin) => (
            <CryptoItem
              key={coin.symbol}
              coin={coin}
              onDelete={handleDelete}
              onUpdate={updateCoin}
            />
          ))}
        {coins.length === 0 && (
          <p className="empty">
            No cryptocurrencies tracked. Search to add one!
          </p>
        )}
      </ul>
    </>
  );
}
