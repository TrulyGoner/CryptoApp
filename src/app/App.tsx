import { useOnlineStatus } from "@/shared/hooks";
import { OnlineBadge } from "@/shared/ui";
import { CryptoPage } from "@/pages";
import "./styles/App.css";

export function App() {
  const isOnline = useOnlineStatus();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🪙 Crypto Tracker</h1>
        <OnlineBadge isOnline={isOnline} />
      </header>

      <CryptoPage />
    </div>
  );
}
