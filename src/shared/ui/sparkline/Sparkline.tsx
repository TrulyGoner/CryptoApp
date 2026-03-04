import "./Sparkline.css";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 120, height = 36 }: SparklineProps) {
  if (data.length < 2) {
    return <div className="sparkline-empty" style={{ width, height }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * innerW;
      const y = padding + innerH - ((v - min) / range) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? "#22c55e" : "#ef4444";

  return (
    <svg
      className="sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
