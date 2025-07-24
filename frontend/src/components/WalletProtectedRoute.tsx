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

          <div className="space-y-4 flex flex-col items-center">
            <WalletConnectButton />
            <p className="text-sm text-muted-foreground text-center">
              Você precisa conectar sua carteira TON para acessar esta página
            </p>
            <p className="text-xs text-center text-gray-400">
              Não tem carteira? Você pode criar uma carteira TON direto no Telegram usando o&nbsp;
              <a
                href="https://t.me/wallet"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#0088cc] hover:text-[#005fa3] font-medium"
              >
                @wallet
              </a>
              .
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}; 