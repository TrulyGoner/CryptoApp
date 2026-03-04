import { useEffect, useRef, useCallback } from "react";

export function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef(callback);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
    }
    savedCallback.current();
    intervalId.current = setInterval(() => savedCallback.current(), delay);
  }, [delay]);

  const restart = useCallback(() => {
    start();
  }, [start]);

  useEffect(() => {
    start();
    return () => {
      if (intervalId.current !== null) clearInterval(intervalId.current);
    };
  }, [start]);

  return { restart };
}
