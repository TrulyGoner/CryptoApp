import { useEffect, useRef, useCallback, useMemo, useReducer, memo } from "react";
import { Input } from "@/shared/ui";
import { useCoinList, useCryptoPrices } from "@/shared/hooks";
import type { CoinInfo } from "@/shared/api";
import "./SearchBar.css";

interface SearchBarProps {
  onSearch: (symbol: string) => void;
  searching?: boolean;
  autoFocus?: boolean;
}

const MAX_SUGGESTIONS = 8;
const PRICE_DEBOUNCE_MS = 300;

interface SearchState {
  value: string;
  suggestions: CoinInfo[];
  debouncedSymbols: string[];
  showDropdown: boolean;
  activeIdx: number;
}

type SearchAction =
  | { type: "SET_VALUE"; value: string }
  | { type: "SET_SUGGESTIONS"; suggestions: CoinInfo[]; showDropdown: boolean }
  | { type: "SET_DEBOUNCED_SYMBOLS"; symbols: string[] }
  | { type: "SET_SHOW_DROPDOWN"; show: boolean }
  | { type: "SET_ACTIVE_IDX"; idx: number }
  | { type: "NAVIGATE_DOWN"; listLength: number }
  | { type: "NAVIGATE_UP"; listLength: number }
  | { type: "RESET" };

const initialState: SearchState = {
  value: "",
  suggestions: [],
  debouncedSymbols: [],
  showDropdown: false,
  activeIdx: -1,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "SET_VALUE":
      return { ...state, value: action.value, activeIdx: -1 };
    case "SET_SUGGESTIONS":
      return { ...state, suggestions: action.suggestions, showDropdown: action.showDropdown };
    case "SET_DEBOUNCED_SYMBOLS":
      return { ...state, debouncedSymbols: action.symbols };
    case "SET_SHOW_DROPDOWN":
      return { ...state, showDropdown: action.show };
    case "SET_ACTIVE_IDX":
      return { ...state, activeIdx: action.idx };
    case "NAVIGATE_DOWN":
      return { ...state, activeIdx: (state.activeIdx + 1) % action.listLength };
    case "NAVIGATE_UP":
      return {
        ...state,
        activeIdx: state.activeIdx <= 0 ? action.listLength - 1 : state.activeIdx - 1,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export const SearchBar = memo(function SearchBar({ onSearch, autoFocus }: SearchBarProps) {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const { value, suggestions, debouncedSymbols, showDropdown, activeIdx } = state;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: coins = [] } = useCoinList();
  const suggestionSymbols = useMemo(() => suggestions.map((c) => c.Symbol), [suggestions]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (suggestionSymbols.length === 0) {
      dispatch({ type: "SET_DEBOUNCED_SYMBOLS", symbols: [] });
      return;
    }
    debounceRef.current = setTimeout(() => {
      dispatch({ type: "SET_DEBOUNCED_SYMBOLS", symbols: suggestionSymbols });
    }, PRICE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [suggestionSymbols.join(",")]);

  const priceQueries = useCryptoPrices(debouncedSymbols, { lazy: true });

  const priceDataKey = useMemo(
    () => priceQueries.map((q) => q.data ?? null).join(","),
    [priceQueries],
  );

  const prices: Record<string, number | null> = useMemo(() => {
    const map: Record<string, number | null> = {};
    debouncedSymbols.forEach((sym, i) => {
      map[sym] = priceQueries[i]?.data ?? null;
    });
    return map;

  }, [priceDataKey, debouncedSymbols.join(",")]);

  const priceLoadingSet = useMemo(() => {
    const set = new Set<string>();
    debouncedSymbols.forEach((sym, i) => {
      if (priceQueries[i]?.isLoading) set.add(sym);
    });
    return set;
  }, [priceDataKey, debouncedSymbols.join(",")]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        dispatch({ type: "SET_SHOW_DROPDOWN", show: false });
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      dispatch({ type: "SET_VALUE", value: v });

      const query = v.trim().toUpperCase();
      if (!query) {
        dispatch({ type: "SET_SUGGESTIONS", suggestions: [], showDropdown: false });
        return;
      }

      const filtered = coins
        .filter(
          (c) =>
            c.Symbol.toUpperCase().startsWith(query) ||
            c.FullName.toUpperCase().includes(query),
        )
        .slice(0, MAX_SUGGESTIONS);

      dispatch({ type: "SET_SUGGESTIONS", suggestions: filtered, showDropdown: filtered.length > 0 });
    },
    [coins],
  );

  const selectCoin = useCallback(
    (symbol: string) => {
      dispatch({ type: "RESET" });
      onSearch(symbol);
    },
    [onSearch],
  );

  const validSuggestions = useMemo(
    () =>
      suggestions.filter((coin) => {
        const price = prices[coin.Symbol];
        const loading = priceLoadingSet.has(coin.Symbol);
        if (!loading && price === null && debouncedSymbols.includes(coin.Symbol)) return false;
        return true;
      }),
    [suggestions, prices, priceLoadingSet, debouncedSymbols],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || validSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      dispatch({ type: "NAVIGATE_DOWN", listLength: validSuggestions.length });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      dispatch({ type: "NAVIGATE_UP", listLength: validSuggestions.length });
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectCoin(validSuggestions[activeIdx].Symbol);
    } else if (e.key === "Escape") {
      dispatch({ type: "SET_SHOW_DROPDOWN", show: false });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    selectCoin(trimmed.toUpperCase());
  };

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <form className="search-bar" onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <img className="search-icon" src="/search.svg" alt="" />
          <Input
            type="text"
            className="search-input-with-icon"
            placeholder="Enter crypto name or symbol (e.g. BTC)"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) dispatch({ type: "SET_SHOW_DROPDOWN", show: true });
            }}
            autoComplete="off"
            autoFocus={autoFocus}
          />
        </div>
      </form>

      {showDropdown && validSuggestions.length > 0 && (
        <ul className="suggestions">
          {validSuggestions
            .map((coin, i) => (
            <li
              key={coin.Symbol}
              className={`suggestion-item ${i === activeIdx ? "active" : ""}`}
              onMouseDown={() => selectCoin(coin.Symbol)}
              onMouseEnter={() => dispatch({ type: "SET_ACTIVE_IDX", idx: i })}
            >
              <span className="suggestion-symbol">{coin.Symbol}</span>
              <span className="suggestion-name">{coin.FullName}</span>
              <span className="suggestion-price">
                {prices[coin.Symbol] != null
                  ? `$${prices[coin.Symbol]!.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                  : "…"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
