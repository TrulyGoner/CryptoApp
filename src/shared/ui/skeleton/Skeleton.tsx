import "./Skeleton.css";

interface SkeletonRowProps {
  count?: number;
}

function SingleRow() {
  return (
    <div className="skeleton-row coin-grid">
      <div><div className="skeleton skeleton-index" /></div>
      <div><div className="skeleton skeleton-symbol" /></div>
      <div><div className="skeleton skeleton-price" /></div>
      <div><div className="skeleton skeleton-change" /></div>
      <div><div className="skeleton skeleton-chart" /></div>
      <div className="skeleton-actions">
        <div className="skeleton skeleton-btn" />
        <div className="skeleton skeleton-btn" />
      </div>
    </div>
  );
}

export function SkeletonRow({ count = 5 }: SkeletonRowProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SingleRow key={`skeleton-${i}`} />
      ))}
    </>
  );
}
