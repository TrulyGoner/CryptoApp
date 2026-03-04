import type { CryptoData } from "@/entities/crypto";
import { useHistory24h } from "@/shared/hooks";
import { Button, Spinner, Sparkline } from "@/shared/ui";
import "./CryptoItem.css";

interface CryptoItemProps {
  coin: CryptoData;
  index: number;
  onDelete: (symbol: string) => void;
  onUpdate: (symbol: string) => void;
}

function getTrend(coin: CryptoData): "up" | "down" | "same" | "unknown" {
  if (coin.price === null || coin.prevPrice === null) return "unknown";
  if (coin.price > coin.prevPrice) return "up";
  if (coin.price < coin.prevPrice) return "down";
  return "same";
}

function getChange24h(history: number[]): { pct: number; direction: "up" | "down" | "same" } | null {
  if (history.length < 2) return null;
  const first = history[0];
  const last = history[history.length - 1];
  if (first === 0) return null;
  const pct = ((last - first) / first) * 100;
  return {
    pct,
    direction: pct > 0 ? "up" : pct < 0 ? "down" : "same",
  };
}

export function CryptoItem({ coin, index, onDelete, onUpdate }: CryptoItemProps) {
  const trend = getTrend(coin);
  const { data: history = [] } = useHistory24h(coin.symbol);
  const change = getChange24h(history);

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
        {change ? (
          <span className={`change-pct ${change.direction}`}>
            {change.pct > 0 ? "+" : ""}
            {change.pct.toFixed(2)}%
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
}
