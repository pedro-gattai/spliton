import { ReactNode } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { WalletConnectButton } from './WalletConnectButton';

interface WalletProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const WalletProtectedRoute = ({ 
  children, 
  fallback 
}: WalletProtectedRouteProps) => {
  const wallet = useTonWallet();
  const isConnected = !!wallet;

  if (!isConnected) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <img 
              src="/spliton-logo.png" 
              alt="SplitOn Logo" 
              className="w-16 h-16 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold mb-2">SplitOn</h1>
            <p className="text-muted-foreground">
              Conecte sua carteira TON para continuar
            </p>
          </div>

          <div className="space-y-4">
            <WalletConnectButton 
              className="w-full bg-ton-gradient text-white hover:bg-ton-gradient-dark"
            />
            
            <p className="text-sm text-muted-foreground">
              Você precisa conectar sua carteira TON para acessar esta página
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}; 