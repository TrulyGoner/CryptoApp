import "./EmptyMessage.css";

interface EmptyMessageProps {
  message: string;
}

export function EmptyMessage({ message }: EmptyMessageProps) {
  return <p className="empty-message">{message}</p>;
}
