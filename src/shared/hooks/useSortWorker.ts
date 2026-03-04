import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type {
  SortableItem,
  SortField,
  SortDir,
  SortRequest,
  SortResponse,
} from "@/shared/workers/sort.worker";

import SortWorker from "@/shared/workers/sort.worker?worker";

export function useSortWorker(items: SortableItem[]) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [sortedSymbols, setSortedSymbols] = useState<string[]>([]);
  const workerRef = useRef<Worker | null>(null);

  const itemsKey = useMemo(
    () => items.map((i) => `${i.symbol}:${i.price}:${i.change24h}`).join("|"),
    [items],
  );

  useEffect(() => {
    workerRef.current = new SortWorker();
    workerRef.current.onmessage = (e: MessageEvent<SortResponse>) => {
      setSortedSymbols(e.data.sorted);
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (!workerRef.current) return;
    if (!sortField) {
      setSortedSymbols(items.map((i) => i.symbol));
      return;
    }
    const msg: SortRequest = {
      items,
      field: sortField,
      direction: sortDir,
    };
    workerRef.current.postMessage(msg);
  }, [itemsKey, sortField, sortDir]);

  const toggleSort = useCallback(
    (field: "price" | "change24h") => {
      if (sortField === field) {
        if (sortDir === "desc") {
          setSortDir("asc");
        } else {
          setSortField(null);
        }
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField, sortDir],
  );

  return { sortedSymbols, sortField, sortDir, toggleSort };
}
