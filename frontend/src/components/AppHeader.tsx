import { DarkModeToggle } from "./DarkModeToggle";
import { WalletConnectButton } from "./WalletConnectButton";

export const AppHeader = () => {
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 w-full min-w-full">
      <div className="flex items-center">
        <img 
          src="/spliton-logo.png" 
          alt="SplitOn Logo" 
          className="w-8 h-8 mr-2"
        />
        <span className="font-semibold text-primary">SplitOn</span>
      </div>
      <div className="flex items-center gap-2">
        <WalletConnectButton size="sm" variant="outline" />
        <DarkModeToggle />
      </div>
    </header>
  );
};