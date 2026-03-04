import type { CryptoData } from "@/entities/crypto";
import { Button, Spinner } from "@/shared/ui";
import "./CryptoItem.css";

interface CryptoItemProps {
  coin: CryptoData;
  onDelete: (symbol: string) => void;
  onUpdate: (symbol: string) => void;
}

function getTrend(coin: CryptoData): "up" | "down" | "same" | "unknown" {
  if (coin.price === null || coin.prevPrice === null) return "unknown";
  if (coin.price > coin.prevPrice) return "up";
  if (coin.price < coin.prevPrice) return "down";
  return "same";
}

export function CryptoItem({ coin, onDelete, onUpdate }: CryptoItemProps) {
  const trend = getTrend(coin);

  return (
    <li className={`crypto-item trend-${trend}`}>
      <div className="crypto-info">
        <span className="crypto-symbol">{coin.symbol}</span>
        <span className="crypto-price">
          {coin.loading ? (
            <Spinner />
          ) : coin.price !== null ? (
            `$${coin.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
          ) : (
            "N/A"
          )}
        </span>
        <span className="crypto-arrow">
          {trend === "up" && <span className="arrow up">▲</span>}
          {trend === "down" && <span className="arrow down">▼</span>}
          {trend === "same" && <span className="arrow same">—</span>}
        </span>
      </div>
      <div className="crypto-actions">
        <Button
          variant="primary"
          onClick={() => onUpdate(coin.symbol)}
          disabled={coin.loading}
        >
          Update
        </Button>
        <Button
          variant="danger"
          onClick={() => onDelete(coin.symbol)}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}
