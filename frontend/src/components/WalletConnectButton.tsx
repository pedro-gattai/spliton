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
    <TonConnectButton 
      className={className}
      style={{
        backgroundColor: variant === 'outline' ? 'transparent' : undefined,
        border: variant === 'outline' ? '1px solid var(--border)' : undefined,
        fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
        padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.75rem 1.5rem' : '0.625rem 1.25rem',
      }}
    />
  );
}; 