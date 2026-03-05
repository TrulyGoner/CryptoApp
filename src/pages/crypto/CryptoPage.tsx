import { useReducer, useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { List, type RowComponentProps } from "react-window";
import { fetchCryptoPrice } from "@/shared/api";
import { useSortWorker, useCryptoPrices, useHistories24h, useDebouncedValue } from "@/shared/hooks";
import { loadCoins, saveCoins } from "@/shared/lib";
import { Button, Input, SkeletonRow } from "@/shared/ui";
import { CryptoItem, SearchModal } from "@/components";
import type { SortableItem } from "@/shared/workers/sort.worker";
import "./CryptoPage.css";

interface State {
  symbols: string[];
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
  | { type: "REMOVE_SYMBOL"; symbol: string };

function initState(): State {
  const saved = loadCoins();
  const symbols = saved.length > 0 ? saved.map((c) => c.symbol) : ["DOGE"];
  return { symbols, searchError: null, searching: false, modalOpen: false };
}

const ROW_HEIGHT = 58;
const MAX_LIST_HEIGHT = 600;

interface RowData {
  symbols: string[];
  onDelete: (symbol: string) => void;
}

function VirtualRow({ index, style, symbols, onDelete }: RowComponentProps<RowData>) {
  return (
    <CryptoItem
      symbol={symbols[index]}
      index={index + 1}
      onDelete={onDelete}
      style={style}
    />
  );
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
    default:
      return state;
  }
}

export function CryptoPage() {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const { symbols, searchError, searching, modalOpen } = state;

  const priceQueries = useCryptoPrices(symbols);
  const historyQueries = useHistories24h(symbols);

  const priceValuesKey = useMemo(
    () => priceQueries.map((q) => q.data ?? null).join(","),
    [priceQueries],
  );

  const historyDataKey = useMemo(
    () =>
      historyQueries
        .map((q) => {
          const d = q.data;
          if (!d || d.length === 0) return "";
          return `${d[0]}:${d[d.length - 1]}`;
        })
        .join("|"),
    [historyQueries],
  );

  const sortableItems: SortableItem[] = useMemo(() => {
    return symbols.map((sym, i) => {
      const price = priceQueries[i]?.data ?? null;
      const h = historyQueries[i]?.data;
      let change24h: number | null = null;
      if (h && h.length >= 2 && h[0] !== 0) {
        change24h = ((h[h.length - 1] - h[0]) / h[0]) * 100;
      }
      return { symbol: sym, price, change24h };
    });
  }, [symbols, priceValuesKey, historyDataKey]);

  const isInitialLoading = priceQueries.every((q) => q.isLoading);

  const debouncedSortableItems = useDebouncedValue(sortableItems, 150);
  const { sortedSymbols, sortField, sortDir, toggleSort } = useSortWorker(debouncedSortableItems);

  const displaySymbols = useMemo(() => {
    if (sortedSymbols.length === 0) return symbols;
    const order = new Map(sortedSymbols.map((s, i) => [s, i]));
    return [...symbols].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  }, [symbols, sortedSymbols]);

  useEffect(() => {
    const data = symbols.map((sym) => {
      const cached = queryClient.getQueryData<number | null>(["cryptoPrice", sym]);
      return { symbol: sym, price: cached ?? null, prevPrice: null };
    });
    saveCoins(data);
  }, [symbols, queryClient]);

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

  const openModal = useCallback(() => {
    dispatch({ type: "OPEN_MODAL" });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: "CLOSE_MODAL" });
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

  const toggleSortPrice = useCallback(() => toggleSort("price"), [toggleSort]);
  const toggleSortChange = useCallback(() => toggleSort("change24h"), [toggleSort]);

  const itemData: RowData = useMemo(() => ({
    symbols: displaySymbols,
    onDelete: handleDelete,
  }), [displaySymbols, handleDelete]);

  const listHeight = Math.min(displaySymbols.length * ROW_HEIGHT, MAX_LIST_HEIGHT);

  return (
    <>
      <div className="controls">
        <div
          className="search-trigger"
          role="button"
          tabIndex={0}
          onClick={openModal}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openModal();
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
        onClose={closeModal}
        onSelect={handleSearch}
        searching={searching}
      />

      {searchError && <p className="search-error">{searchError}</p>}

      <div className="coin-table" role="table">
        <div className="coin-header coin-grid" role="row">
          <div role="columnheader">#</div>
          <div role="columnheader">Name</div>
          <div
            role="columnheader"
            className={`sortable ${sortField === "price" ? "active" : ""}`}
            tabIndex={0}
            aria-sort={sortField === "price" ? (sortDir === "desc" ? "descending" : "ascending") : "none"}
            onClick={toggleSortPrice}
            onKeyDown={handleSortKeyDown("price")}
          >
            Price {sortField === "price" && (sortDir === "desc" ? "▼" : "▲")}
          </div>
          <div
            role="columnheader"
            className={`sortable ${sortField === "change24h" ? "active" : ""}`}
            tabIndex={0}
            aria-sort={sortField === "change24h" ? (sortDir === "desc" ? "descending" : "ascending") : "none"}
            onClick={toggleSortChange}
            onKeyDown={handleSortKeyDown("change24h")}
          >
            24h % {sortField === "change24h" && (sortDir === "desc" ? "▼" : "▲")}
          </div>
          <div role="columnheader">24h Chart</div>
          <div role="columnheader"></div>
        </div>
        <div className="coin-body">
          {isInitialLoading ? (
            <SkeletonRow count={symbols.length || 5} />
          ) : displaySymbols.length > 0 ? (
            <List<RowData>
              rowComponent={VirtualRow}
              rowCount={displaySymbols.length}
              rowHeight={ROW_HEIGHT}
              rowProps={itemData}
              style={{ height: listHeight }}
            />
          ) : null}
        </div>
      </div>
      {symbols.length === 0 && (
        <p className="empty">
          No cryptocurrencies tracked. Search to add one!
        </p>
      )}
    </>
  );
}
