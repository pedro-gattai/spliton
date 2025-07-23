import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Filter, Loader2, Calendar, User, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { NewGroupModal } from "@/components/modals/NewGroupModal";
import { SettlementButton } from "@/components/SettlementButton";
import { useGroups } from "@/hooks/useGroups";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useGroupBalances } from "@/hooks/useGroupBalances";
import { formatDateSafely } from "@/lib/utils";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export const Groups = () => {
  const { user, walletAddress } = useWalletConnection();
  const navigate = useNavigate();
  const { groups, loading, error, createGroup } = useGroups(user?.id);
  
  // Get group IDs for balance calculation
  const groupIds = useMemo(() => groups.map(group => group.id), [groups]);
  const { balances, loading: balancesLoading, getBalanceColor } = useGroupBalances(user?.id, groupIds);

  const handleGroupSubmit = async (data: { name: string; description?: string; userIds: string[] }) => {
    try {
      await createGroup(data);
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
    }
  };

  // Calculate stats from balances
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const groupsOwing = Object.values(balances).filter(b => b.status === 'owe').length;
    const groupsReceiving = Object.values(balances).filter(b => b.status === 'receive').length;
    
    return { totalGroups, groupsOwing, groupsReceiving };
  }, [groups.length, balances]);

  const getBorderColor = (groupId: string) => {
    const balance = balances[groupId];
    if (!balance) return 'border-gray-200';
    
    const color = getBalanceColor(balance);
    switch (color) {
      case 'green': return 'border-green-500';
      case 'red': return 'border-red-500';
      case 'gray': return 'border-gray-400';
      default: return 'border-gray-200';
    }
  };

  const getBalanceText = (groupId: string) => {
    const balance = balances[groupId];
    if (!balance) return null;
    
    if (balance.status === 'settled') return 'Balanceado';
    if (balance.status === 'receive') return `Você recebe: ${balance.balance.toFixed(2)} TON`;
    return `Você deve: ${Math.abs(balance.balance).toFixed(2)} TON`;
  };

  const getBalanceBadgeVariant = (groupId: string) => {
    const balance = balances[groupId];
    if (!balance) return 'secondary';
    
    switch (balance.status) {
      case 'receive': return 'default';
      case 'owe': return 'destructive';
      case 'settled': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="mobile-container min-h-screen pb-20">

        {/* Main Content */}
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Grupos</h1>
            
            {/* Modal de Criar Grupo integrado no botão do header */}
            <NewGroupModal onSubmit={handleGroupSubmit} userId={user?.id}>
              <Button className="bg-ton-gradient text-white hover:bg-ton-gradient-dark">
                <Plus className="w-4 h-4 mr-2" />
                Criar
              </Button>
            </NewGroupModal>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
              placeholder="Buscar grupos..."
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalGroups}</div>
              <div className="text-xs text-muted-foreground">Grupos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.groupsReceiving}</div>
              <div className="text-xs text-muted-foreground">Recebendo</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.groupsOwing}</div>
              <div className="text-xs text-muted-foreground">Devendo</div>
            </Card>
          </div>

          {/* Loading State */}
          {(loading || balancesLoading) && (
            <Card className="p-8 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
              <h3 className="font-semibold mb-2">Carregando grupos...</h3>
            </Card>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <Users className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Tentar Novamente
              </Button>
            </Card>
          )}

          {/* Groups List */}
          {!loading && !error && groups.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Seus Grupos</h3>
              {groups.map((group) => (
                <Card 
                  key={group.id} 
                  className={`p-4 hover:shadow-md transition-shadow cursor-pointer border-2 ${getBorderColor(group.id)}`}
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{group.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {group.members.length} membros
                        </Badge>
                      </div>
                      
                      {group.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateSafely(group.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          @{group.creator.username}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <Badge variant="outline" className="text-xs">
                        {group.inviteCode}
                      </Badge>
                      
                      {balances[group.id] && (
                        <div className="space-y-1">
                          <Badge 
                            variant={getBalanceBadgeVariant(group.id) as any}
                            className="text-xs"
                          >
                            {balances[group.id].status === 'settled' ? 'BALANCEADO' : 
                             balances[group.id].status === 'receive' ? 'RECEBENDO' : 'DEVENDO'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {getBalanceText(group.id)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && groups.length === 0 && (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Nenhum grupo ainda</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro grupo para começar a dividir despesas
              </p>
              
              {/* Modal de Criar Grupo integrado no empty state */}
              <NewGroupModal onSubmit={handleGroupSubmit} userId={user?.id}>
                <Button className="bg-ton-gradient text-white hover:bg-ton-gradient-dark">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Grupo
                </Button>
              </NewGroupModal>
            </Card>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};