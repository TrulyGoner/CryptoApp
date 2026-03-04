import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { Input } from "@/shared/ui";
import { useCoinList, useLazyCryptoPrices } from "@/shared/hooks";
import type { CoinInfo } from "@/shared/api";
import "./SearchBar.css";

interface SearchBarProps {
  onSearch: (symbol: string) => void;
  searching?: boolean;
  autoFocus?: boolean;
}

const MAX_SUGGESTIONS = 8;
const PRICE_DEBOUNCE_MS = 300;

export const SearchBar = memo(function SearchBar({ onSearch, autoFocus }: SearchBarProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<CoinInfo[]>([]);
  const [debouncedSymbols, setDebouncedSymbols] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: coins = [] } = useCoinList();

  const suggestionSymbols = useMemo(() => suggestions.map((c) => c.Symbol), [suggestions]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (suggestionSymbols.length === 0) {
      setDebouncedSymbols([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSymbols(suggestionSymbols);
    }, PRICE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [suggestionSymbols.join(",")]);

  const priceQueries = useLazyCryptoPrices(debouncedSymbols);

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
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValue(v);
      setActiveIdx(-1);

      const query = v.trim().toUpperCase();
      if (!query) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      const filtered = coins
        .filter(
          (c) =>
            c.Symbol.toUpperCase().startsWith(query) ||
            c.FullName.toUpperCase().includes(query),
        )
        .slice(0, MAX_SUGGESTIONS);

      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
    },
    [coins],
  );

  const selectCoin = useCallback(
    (symbol: string) => {
      setValue("");
      setShowDropdown(false);
      setSuggestions([]);
      setDebouncedSymbols([]);
      setActiveIdx(-1);
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
      setActiveIdx((prev) => (prev + 1) % validSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => (prev <= 0 ? validSuggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectCoin(validSuggestions[activeIdx].Symbol);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
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
              if (suggestions.length > 0) setShowDropdown(true);
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
              onMouseEnter={() => setActiveIdx(i)}
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
