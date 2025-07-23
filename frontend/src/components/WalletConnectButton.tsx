import { TonConnectButton } from '@tonconnect/ui-react';

interface WalletConnectButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export const WalletConnectButton = ({ 
  variant = "default", 
  size = "default",
  className = "" 
}: WalletConnectButtonProps) => {
  return (
    <div className={className}>
      <TonConnectButton 
        className="w-full"
        style={{
          backgroundColor: variant === 'outline' ? 'transparent' : '#0088cc',
          border: '0px solid #0088cc',
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '500',
          color: variant === 'outline' ? '#0088cc' : 'white',
        }}
      />
    </div>
  );
}; 