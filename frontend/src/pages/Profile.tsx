import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Wallet, Settings, Shield, Bell, Moon } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { UserRegistrationModal } from "@/components/modals/UserRegistrationModal";

export const Profile = () => {
  // Hook para gerenciar conexão da carteira e usuário
  const { 
    user, 
    isLoading: userLoading, 
    connected, 
    walletAddress, 
    showRegistrationModal, 
    handleUserCreated, 
    handleRegistrationModalClose 
  } = useWalletConnection();
  
  // Hook para buscar o saldo da carteira
  const { 
    data: walletBalance, 
    isLoading: balanceLoading 
  } = useWalletBalance(walletAddress);

  const isLoading = userLoading || balanceLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="mobile-container min-h-screen pb-20">
        <AppHeader />

        {/* Main Content */}
        <div className="py-6 space-y-6">
          <h1 className="text-2xl font-bold">Perfil</h1>

          {/* User Info */}
          <Card className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">
                  {user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Usuário'}
                </h2>
                <p className="text-muted-foreground">
                  {user?.email || user?.username || (walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}` : 'Não conectado')}
                </p>
                <Badge variant="secondary" className="mt-2">
                  <img 
                    src="/lovable-uploads/f9dad574-a42b-462c-8497-92ec966518e5.png" 
                    alt="TON" 
                    className="w-4 h-4 mr-1"
                  />
                  {connected ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {isLoading ? '...' : walletBalance ? walletBalance.balanceInTon.toFixed(6) : '0.00'}
                </div>
                <div className="text-xs text-muted-foreground">TON</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Transações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Grupos</div>
              </div>
            </div>

            {connected ? (
              <WalletConnectButton 
                variant="outline" 
                className="w-full bg-ton-gradient text-white hover:bg-ton-gradient-dark"
              />
            ) : (
              <WalletConnectButton 
                className="w-full bg-ton-gradient text-white hover:bg-ton-gradient-dark"
              />
            )}
          </Card>

          {/* Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5" />
                  <span>Notificações</span>
                </div>
                <div className="w-12 h-6 bg-muted rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Moon className="w-5 h-5" />
                  <span>Modo Escuro</span>
                </div>
                <div className="w-12 h-6 bg-muted rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5" />
                  <span>Privacidade</span>
                </div>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
            </div>
          </Card>

          {/* App Info */}
          <Card className="p-6 text-center">
                          <img 
                src="/spliton-logo.png" 
                alt="SplitOn Logo" 
                className="w-12 h-12 mx-auto mb-4"
              />
            <h3 className="font-semibold mb-2">SplitOn</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Versão 1.0.0
            </p>
            <p className="text-xs text-muted-foreground">
              Desenvolvido com ❤️ para a comunidade TON
            </p>
          </Card>
        </div>
      </div>

      <BottomNavigation />
      
      {/* Modal de Registro de Usuário */}
      {showRegistrationModal && walletAddress && (
        <UserRegistrationModal
          isOpen={showRegistrationModal}
          onClose={handleRegistrationModalClose}
          walletAddress={walletAddress}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
};