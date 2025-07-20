import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  RefreshCw
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { NewExpenseModal } from "@/components/modals/NewExpenseModal";
import { NewGroupModal } from "@/components/modals/NewGroupModal";
import { UserRegistrationModal } from "@/components/modals/UserRegistrationModal";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useGroups } from "@/hooks/useGroups";
import { useExpenses } from "@/hooks/useExpenses";

// Types for form data
type ExpenseFormData = {
  title: string;
  amount: string;
  category: string;
  description?: string;
  groupId: string;
  splitType: "equal" | "custom" | "percentage";
  participants: string[];
};

type GroupFormData = {
  name: string;
  description?: string;
  type: "travel" | "home" | "work" | "friends" | "other";
  currency: string;
  members: Array<{
    name: string;
    email?: string;
    telegramId?: string;
  }>;
};

export const Dashboard = () => {
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
    isLoading: balanceLoading, 
    error, 
    refetch 
  } = useWalletBalance(walletAddress || null);

  // Debug logs
  console.log('Dashboard - Wallet Address:', walletAddress);
  console.log('Dashboard - Wallet Balance:', walletBalance);
  console.log('Dashboard - Error:', error);
  console.log('Dashboard - Show Registration Modal:', showRegistrationModal);

  const isLoading = userLoading || balanceLoading;

  const { groups, createGroup } = useGroups(user?.id);
  const { createExpense } = useExpenses();

  const handleExpenseSubmit = async (data: any) => {
    try {
      await createExpense(data);
    } catch (error) {
      console.error("Erro ao criar despesa:", error);
    }
  };

  const handleGroupSubmit = async (data: { name: string; description?: string; memberEmails: string[] }) => {
    try {
      await createGroup(data);
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mobile-container min-h-screen pb-20">
        <AppHeader />

        {/* Main Content */}
        <div className="py-6 space-y-6">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <img 
              src="/spliton-logo.png" 
              alt="SplitOn Logo" 
              className="w-16 h-16 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold mb-2">SplitOn</h1>
            <p className="text-muted-foreground">Divida despesas na blockchain TON</p>
          </div>

          {/* Resumo de Saldos */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Resumo</h2>
            <Card className="p-4 bg-ton-gradient text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Saldo da Carteira</span>
                </div>
                              <div className="flex items-center gap-2">
                {isLoading && (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {!connected ? 'Desconectado' : error ? 'Erro' : walletBalance ? 'Conectado' : 'Carregando...'}
                </Badge>
              </div>
              </div>
              
              {!connected ? (
                <div className="text-center">
                  <div className="text-lg mb-3">Conecte sua carteira TON</div>
                  <WalletConnectButton 
                    variant="outline" 
                    className="bg-white/20 text-white hover:bg-white/30 border-white/30"
                  />
                </div>
              ) : isLoading ? (
                <div className="text-2xl font-bold">Carregando...</div>
              ) : error ? (
                <div className="text-lg text-red-200">
                  Erro ao carregar saldo
                </div>
              ) : walletBalance ? (
                <div>
                  <div className="text-2xl font-bold">
                    {typeof walletBalance.balanceInTon === 'number' 
                      ? walletBalance.balanceInTon.toFixed(6) 
                      : '0.000000'} TON
                  </div>
                  <div className="text-xs text-white/70 mt-1">
                    {walletBalance.address ? 
                      `${walletBalance.address.slice(0, 8)}...${walletBalance.address.slice(-8)}` : 
                      'Endereço não disponível'
                    }
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Última atualização: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold">0.000000 TON</div>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-4 h-4 mr-2 text-success" />
                  <span className="text-sm text-muted-foreground">Você recebe</span>
                </div>
                <div className="text-lg font-semibold text-success">0.00 TON</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center mb-2">
                  <TrendingDown className="w-4 h-4 mr-2 text-destructive" />
                  <span className="text-sm text-muted-foreground">Você deve</span>
                </div>
                <div className="text-lg font-semibold text-destructive">0.00 TON</div>
              </Card>
            </div>
          </div>

          {/* Grupos */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Seus Grupos</h2>
            
            {groups.length > 0 ? (
              <div className="space-y-3">
                {groups.slice(0, 3).map((group) => (
                  <Card key={group.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{group.name}</h4>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {group.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {group.members.length} membros
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {group.inviteCode}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {groups.length > 3 && (
                  <div className="text-center">
                    <Button variant="outline" size="sm">
                      Ver todos os {groups.length} grupos
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Nenhum grupo ativo</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro grupo para começar a dividir despesas
                </p>
                
                {/* Modal de Criar Grupo integrado */}
                <NewGroupModal onSubmit={handleGroupSubmit} userId={user?.id}>
                  <Button className="bg-ton-gradient text-white hover:bg-ton-gradient-dark">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Grupo
                  </Button>
                </NewGroupModal>
              </Card>
            )}
          </div>

          {/* Ações Rápidas */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Ações Rápidas</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Modal de Nova Despesa integrado */}
              <NewExpenseModal onSubmit={handleExpenseSubmit} userId={user?.id}>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 w-full"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-sm">Nova Despesa</span>
                </Button>
              </NewExpenseModal>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => refetch()}
                disabled={isLoading || !connected}
              >
                <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm">
                  {!connected ? 'Conectar Carteira' : 'Atualizar Saldo'}
                </span>
              </Button>
            </div>
          </div>
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