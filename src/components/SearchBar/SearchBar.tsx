import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Input } from "@/shared/ui";
import { fetchCoinList, fetchCryptoPrice } from "@/shared/api";
import type { CoinInfo } from "@/shared/api";
import "./SearchBar.css";

interface SearchBarProps {
  onSearch: (symbol: string) => void;
  searching: boolean;
}

const MAX_SUGGESTIONS = 8;

export function SearchBar({ onSearch, searching }: SearchBarProps) {
  const [value, setValue] = useState("");
  const [coins, setCoins] = useState<CoinInfo[]>([]);
  const [suggestions, setSuggestions] = useState<CoinInfo[]>([]);
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    fetchCoinList().then(setCoins);
  }, []);

  useEffect(() => {
    if (suggestions.length === 0) return;

    const id = ++fetchIdRef.current;

    suggestions.forEach((coin) => {
      if (prices[coin.Symbol] !== undefined) return; 
      fetchCryptoPrice(coin.Symbol).then((price) => {
        if (fetchIdRef.current !== id) return; // stale
        setPrices((prev) => ({ ...prev, [coin.Symbol]: price }));
      });
    });
  }, [suggestions]); 

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
      setActiveIdx(-1);
      onSearch(symbol);
    },
    [onSearch],
  );

  const validSuggestions = suggestions.filter(
    (coin) => prices[coin.Symbol] !== null,
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
          />
        </div>
        <Button
          type="submit"
          variant="accent"
          disabled={searching || !value.trim()}
        >
          {searching ? "Searching…" : "Search"}
        </Button>
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
                {prices[coin.Symbol] !== undefined
                  ? `$${prices[coin.Symbol]!.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                  : "…"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
