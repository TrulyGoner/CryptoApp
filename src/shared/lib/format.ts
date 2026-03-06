export function formatPrice(price: number, fractionDigits: { min?: number; max?: number } = {}): string {
  const { min = 2, max = 6 } = fractionDigits;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: min, maximumFractionDigits: max })}`;
}

export function calcChange(history: number[] | undefined): number | null {
  if (!history || history.length < 2 || history[0] === 0) return null;
  return ((history[history.length - 1] - history[0]) / history[0]) * 100;
}
