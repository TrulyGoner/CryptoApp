import { memo, useMemo, useCallback } from "react";
import { useCryptoPrice, useHistory24h } from "@/shared/hooks";
import { Button, Spinner, Sparkline } from "@/shared/ui";
import "./CryptoItem.css";

interface CryptoItemProps {
  symbol: string;
  index: number;
  onDelete: (symbol: string) => void;
}

function getTrend(
  price: number | null,
  prevPrice: number | null,
): "up" | "down" | "same" | "unknown" {
  if (price === null || prevPrice === null) return "unknown";
  if (price > prevPrice) return "up";
  if (price < prevPrice) return "down";
  return "same";
}

function changeDirection(pct: number | null): "up" | "down" | "same" {
  if (pct === null) return "same";
  if (pct > 0) return "up";
  if (pct < 0) return "down";
  return "same";
}

function calcChange(history: number[] | undefined): number | null {
  if (!history || history.length < 2 || history[0] === 0) return null;
  return ((history[history.length - 1] - history[0]) / history[0]) * 100;
}

export const CryptoItem = memo(function CryptoItem({
  symbol,
  index,
  onDelete,
}: CryptoItemProps) {
  const { price, prevPrice, isLoading, isFetching, invalidate } =
    useCryptoPrice(symbol);
  const { data: history } = useHistory24h(symbol);

  const change24h = useMemo(() => calcChange(history), [history]);
  const trend = getTrend(price, prevPrice);
  const dir = changeDirection(change24h);
  const loading = isLoading || isFetching;

  const handleUpdate = useCallback(() => invalidate(), [invalidate]);
  const handleDelete = useCallback(() => onDelete(symbol), [onDelete, symbol]);

  return (
    <tr className={`crypto-row trend-${trend}`}>
      <td className="cell-index">{index}</td>
      <td className="cell-symbol">
        <span className="crypto-symbol">{symbol}</span>
        <span className="crypto-arrow">
          {trend === "up" && <span className="arrow up">▲</span>}
          {trend === "down" && <span className="arrow down">▼</span>}
          {trend === "same" && <span className="arrow same">—</span>}
        </span>
      </td>
      <td className="cell-price">
        {loading ? (
          <Spinner />
        ) : price !== null ? (
          `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
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
        <Sparkline data={history ?? []} width={100} height={32} />
      </td>
      <td className="cell-actions">
        <Button variant="primary" onClick={handleUpdate} disabled={loading}>
          Update
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      </td>
    </tr>
  );
});
