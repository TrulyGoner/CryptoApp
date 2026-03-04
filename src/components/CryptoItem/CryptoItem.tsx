import { memo } from "react";
import type { CryptoData } from "@/entities/crypto";
import { Button, Spinner, Sparkline } from "@/shared/ui";
import "./CryptoItem.css";

interface CryptoItemProps {
  coin: CryptoData;
  index: number;
  history: number[];
  change24h: number | null;
  onDelete: (symbol: string) => void;
  onUpdate: (symbol: string) => void;
}

function getTrend(coin: CryptoData): "up" | "down" | "same" | "unknown" {
  if (coin.price === null || coin.prevPrice === null) return "unknown";
  if (coin.price > coin.prevPrice) return "up";
  if (coin.price < coin.prevPrice) return "down";
  return "same";
}

function changeDirection(pct: number | null): "up" | "down" | "same" {
  if (pct === null) return "same";
  if (pct > 0) return "up";
  if (pct < 0) return "down";
  return "same";
}

export const CryptoItem = memo(function CryptoItem({ coin, index, history, change24h, onDelete, onUpdate }: CryptoItemProps) {
  const trend = getTrend(coin);
  const dir = changeDirection(change24h);

  return (
    <tr className={`crypto-row trend-${trend}`}>
      <td className="cell-index">{index}</td>
      <td className="cell-symbol">
        <span className="crypto-symbol">{coin.symbol}</span>
        <span className="crypto-arrow">
          {trend === "up" && <span className="arrow up">▲</span>}
          {trend === "down" && <span className="arrow down">▼</span>}
          {trend === "same" && <span className="arrow same">—</span>}
        </span>
      </td>
      <td className="cell-price">
        {coin.loading ? (
          <Spinner />
        ) : coin.price !== null ? (
          `$${coin.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
        ) : (
          "N/A"
        )}
      </td>
      <td className="cell-change">
        {change24h !== null ? (
          <span className={`change-pct ${dir}`}>
            {change24h > 0 ? "+" : ""}
            {change24h.toFixed(2)}%
          </span>
        ) : (
          <span className="change-pct same">—</span>
        )}
      </td>
      <td className="cell-chart">
        <Sparkline data={history} width={100} height={32} />
      </td>
      <td className="cell-actions">
        <Button
          variant="primary"
          onClick={() => onUpdate(coin.symbol)}
          disabled={coin.loading}
        >
          Update
        </Button>
        <Button variant="danger" onClick={() => onDelete(coin.symbol)}>
          Delete
        </Button>
      </td>
    </tr>
  );
});
