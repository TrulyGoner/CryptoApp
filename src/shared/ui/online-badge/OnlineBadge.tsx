import "./OnlineBadge.css";

interface OnlineBadgeProps {
  isOnline: boolean;
}

export function OnlineBadge({ isOnline }: OnlineBadgeProps) {
  return (
    <span className={`online-badge ${isOnline ? "online" : "offline"}`}>
      {isOnline ? "Online" : "Offline"}
    </span>
  );
}
