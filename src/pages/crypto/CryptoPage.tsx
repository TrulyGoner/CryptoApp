import { useReducer, useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchCryptoPrice } from "@/shared/api";
import { useCryptoPrices, useHistories24h, useSortWorker } from "@/shared/hooks";
import { loadCoins, saveCoins } from "@/shared/lib";
import { Button, Input } from "@/shared/ui";
import type { CryptoData } from "@/entities/crypto";
import { CryptoItem, SearchModal } from "@/components";
import type { SortableItem } from "@/shared/workers/sort.worker";
import "./CryptoPage.css";

type PriceEntry = { prev: number | null; current: number | null };

interface State {
  symbols: string[];
  priceHistory: Record<string, PriceEntry>;
  searchError: string | null;
  searching: boolean;
  modalOpen: boolean;
}

type Action =
  | { type: "OPEN_MODAL" }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_SEARCH_ERROR"; error: string | null }
  | { type: "SET_SEARCHING"; value: boolean }
  | { type: "ADD_SYMBOL"; symbol: string }
  | { type: "REMOVE_SYMBOL"; symbol: string }
  | { type: "UPDATE_PRICES"; entries: { symbol: string; price: number }[] };

function initState(): State {
  const saved = loadCoins();
  const symbols = saved.length > 0 ? saved.map((c) => c.symbol) : ["DOGE"];
  const priceHistory: Record<string, PriceEntry> = {};
  saved.forEach((c) => {
    priceHistory[c.symbol] = { prev: c.prevPrice, current: c.price };
  });
  return { symbols, priceHistory, searchError: null, searching: false, modalOpen: false };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPEN_MODAL":
      return { ...state, modalOpen: true };
    case "CLOSE_MODAL":
      return { ...state, modalOpen: false };
    case "SET_SEARCH_ERROR":
      return { ...state, searchError: action.error };
    case "SET_SEARCHING":
      return { ...state, searching: action.value };
    case "ADD_SYMBOL":
      return state.symbols.includes(action.symbol)
        ? state
        : { ...state, symbols: [...state.symbols, action.symbol] };
    case "REMOVE_SYMBOL":
      return { ...state, symbols: state.symbols.filter((s) => s !== action.symbol) };
    case "UPDATE_PRICES": {
      let changed = false;
      const next = { ...state.priceHistory };
      for (const { symbol, price } of action.entries) {
        const entry = next[symbol];
        if (!entry) {
          next[symbol] = { prev: price, current: price };
          changed = true;
        } else if (entry.current !== price) {
          next[symbol] = { prev: entry.current, current: price };
          changed = true;
        }
      }
      return changed ? { ...state, priceHistory: next } : state;
    }
    default:
      return state;
  }
}

export function CryptoPage() {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const { symbols, priceHistory, searchError, searching, modalOpen } = state;

  const priceQueries = useCryptoPrices(symbols);

  useEffect(() => {
    const entries: { symbol: string; price: number }[] = [];
    symbols.forEach((sym, i) => {
      const p = priceQueries[i]?.data ?? null;
      if (p !== null) entries.push({ symbol: sym, price: p });
    });
    if (entries.length > 0) dispatch({ type: "UPDATE_PRICES", entries });
  }, [priceQueries, symbols]);

  const coins: CryptoData[] = useMemo(
    () =>
      symbols.map((symbol, i) => {
        const query = priceQueries[i];
        const history = priceHistory[symbol];
        return {
          symbol,
          price: query.data ?? null,
          prevPrice: history?.prev ?? null,
          loading: query.isLoading || query.isFetching,
        };
      }),
    [symbols, priceQueries, priceHistory],
  );

  const historyQueries = useHistories24h(symbols);

  const historyMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    symbols.forEach((sym, i) => {
      map[sym] = historyQueries[i]?.data ?? [];
    });
    return map;
  }, [historyQueries, symbols]);

  const change24hMap = useMemo(() => {
    const map: Record<string, number | null> = {};
    symbols.forEach((sym) => {
      const h = historyMap[sym];
      if (!h || h.length < 2 || h[0] === 0) {
        map[sym] = null;
      } else {
        map[sym] = ((h[h.length - 1] - h[0]) / h[0]) * 100;
      }
    });
    return map;
  }, [historyMap, symbols]);

  const sortableItems: SortableItem[] = useMemo(
    () =>
      coins.map((c) => ({
        symbol: c.symbol,
        price: c.price,
        change24h: change24hMap[c.symbol] ?? null,
      })),
    [coins, change24hMap],
  );

  const { sortedSymbols, sortField, sortDir, toggleSort } = useSortWorker(sortableItems);

  const displayCoins = useMemo(() => {
    if (sortedSymbols.length === 0) return coins.filter((c) => c.loading || c.price !== null);
    const order = new Map(sortedSymbols.map((s, i) => [s, i]));
    return [...coins]
      .filter((c) => c.loading || c.price !== null)
      .sort((a, b) => (order.get(a.symbol) ?? 0) - (order.get(b.symbol) ?? 0));
  }, [coins, sortedSymbols]);

  useEffect(() => {
    const data = symbols.map((sym) => ({
      symbol: sym,
      price: priceHistory[sym]?.current ?? null,
      prevPrice: priceHistory[sym]?.prev ?? null,
    }));
    saveCoins(data);
  }, [symbols, priceHistory]);

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
      dispatch({ type: "SET_SEARCH_ERROR", error: null });

      if (symbols.includes(symbol)) {
        dispatch({ type: "SET_SEARCH_ERROR", error: `${symbol} is already in your list.` });
        return;
      }

      dispatch({ type: "SET_SEARCHING", value: true });
      const price = await fetchCryptoPrice(symbol);
      dispatch({ type: "SET_SEARCHING", value: false });

      if (price === null) {
        dispatch({ type: "SET_SEARCH_ERROR", error: `Cryptocurrency "${symbol}" not found.` });
        return;
      }

      queryClient.setQueryData(["cryptoPrice", symbol], price);
      dispatch({ type: "ADD_SYMBOL", symbol });
    },
    [symbols, queryClient],
  );

  const handleDelete = useCallback((symbol: string) => {
    dispatch({ type: "REMOVE_SYMBOL", symbol });
  }, []);

  const handleSortKeyDown = useCallback(
    (field: "price" | "change24h") => (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSort(field);
      }
    },
    [toggleSort],
  );

  return (
    <>
      <div className="controls">
        <div
          className="search-trigger"
          role="button"
          tabIndex={0}
          onClick={() => dispatch({ type: "OPEN_MODAL" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              dispatch({ type: "OPEN_MODAL" });
            }
          }}
        >
          <img className="search-trigger-icon" src="/search.svg" alt="" />
          <Input
            type="text"
            className="search-trigger-input"
            placeholder="Search cryptocurrency…"
            readOnly
            tabIndex={-1}
          />
        </div>
        <Button type="button" variant="info" onClick={updateAll}>
          Update all
        </Button>
      </div>

      <SearchModal
        open={modalOpen}
        onClose={() => dispatch({ type: "CLOSE_MODAL" })}
        onSelect={handleSearch}
        searching={searching}
      />

      {searchError && <p className="search-error">{searchError}</p>}

      <table className="coin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th
              className={`sortable ${sortField === "price" ? "active" : ""}`}
              tabIndex={0}
              aria-sort={sortField === "price" ? (sortDir === "desc" ? "descending" : "ascending") : "none"}
              onClick={() => toggleSort("price")}
              onKeyDown={handleSortKeyDown("price")}
            >
              Price {sortField === "price" && (sortDir === "desc" ? "▼" : "▲")}
            </th>
            <th
              className={`sortable ${sortField === "change24h" ? "active" : ""}`}
              tabIndex={0}
              aria-sort={sortField === "change24h" ? (sortDir === "desc" ? "descending" : "ascending") : "none"}
              onClick={() => toggleSort("change24h")}
              onKeyDown={handleSortKeyDown("change24h")}
            >
              24h % {sortField === "change24h" && (sortDir === "desc" ? "▼" : "▲")}
            </th>
            <th>24h Chart</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {displayCoins.map((coin, i) => (
              <CryptoItem
                key={coin.symbol}
                coin={coin}
                index={i + 1}
                history={historyMap[coin.symbol] ?? []}
                change24h={change24hMap[coin.symbol] ?? null}
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
