import "./Skeleton.css";

interface SkeletonRowProps {
  count?: number;
}

function SingleRow() {
  return (
    <tr className="skeleton-row">
      <td>
        <div className="skeleton skeleton-index" />
      </td>
      <td>
        <div className="skeleton skeleton-symbol" />
      </td>
      <td>
        <div className="skeleton skeleton-price" />
      </td>
      <td>
        <div className="skeleton skeleton-change" />
      </td>
      <td>
        <div className="skeleton skeleton-chart" />
      </td>
      <td>
        <div className="skeleton-actions">
          <div className="skeleton skeleton-btn" />
          <div className="skeleton skeleton-btn" />
        </div>
      </td>
    </tr>
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
