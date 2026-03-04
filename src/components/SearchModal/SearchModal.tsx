import { useEffect, useCallback, useMemo } from "react";
import { useCoinList, useCryptoPrices } from "@/shared/hooks";
import { SearchBar } from "@/components/SearchBar/SearchBar";
import "./SearchModal.css";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  searching: boolean;
}

const TOP_SYMBOLS = ["BTC", "ETH", "BNB", "SOL", "XRP"];

export function SearchModal({ open, onClose, onSelect, searching }: SearchModalProps) {
  const { data: coinList = [] } = useCoinList();
  const priceQueries = useCryptoPrices(open ? TOP_SYMBOLS : []);

  const topCoins = useMemo(() => {
    const results: { symbol: string; fullName: string; price: number }[] = [];
    TOP_SYMBOLS.forEach((sym, i) => {
      const price = priceQueries[i]?.data;
      if (price != null) {
        const info = coinList.find((c) => c.Symbol === sym);
        results.push({ symbol: sym, fullName: info?.FullName ?? sym, price });
      }
    });
    return results.sort((a, b) => b.price - a.price).slice(0, 3);
  }, [priceQueries, coinList]);

  const topLoading = open && priceQueries.some((q) => q.isLoading);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Search Cryptocurrency</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="top-section">
          <h3>Top 3 by Price</h3>
          {topLoading ? (
            <p className="top-loading">Loading…</p>
          ) : (
            <div className="top-list">
              {topCoins.map((coin, i) => (
                <div
                  key={coin.symbol}
                  className="top-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelect(coin.symbol);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(coin.symbol);
                      onClose();
                    }
                  }}
                >
                  <span className="top-rank">#{i + 1}</span>
                  <span className="top-symbol">{coin.symbol}</span>
                  <span className="top-name">{coin.fullName}</span>
                  <span className="top-price">
                    ${coin.price.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="modal-divider" />

        <div className="modal-search-area">
          <SearchBar onSearch={(sym) => { onSelect(sym); onClose(); }} searching={searching} autoFocus />
        </div>
      </div>
    </div>
  );
}
