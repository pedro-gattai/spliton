import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Filter, Loader2, Calendar, User } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { NewGroupModal } from "@/components/modals/NewGroupModal";
import { SettlementButton } from "@/components/SettlementButton";
import { useGroups } from "@/hooks/useGroups";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { formatDateSafely } from "@/lib/utils";

export const Groups = () => {
  const { user, walletAddress } = useWalletConnection();
  const { groups, loading, error, createGroup } = useGroups(user?.id);

  const handleGroupSubmit = async (data: { name: string; description?: string; userIds: string[] }) => {
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
              <div className="text-2xl font-bold text-primary">{groups.length}</div>
              <div className="text-xs text-muted-foreground">Grupos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-success">0</div>
              <div className="text-xs text-muted-foreground">Receber</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">0</div>
              <div className="text-xs text-muted-foreground">Devendo</div>
            </Card>
          </div>

          {/* Loading State */}
          {loading && (
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
                <Card key={group.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
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
                          {group.creator.firstName}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {group.inviteCode}
                      </Badge>
                      {/* 🚀 SETTLEMENT BUTTON POR GRUPO */}
                      <div className="mt-2">
                        <SettlementButton 
                          groupId={group.id}
                          groupName={group.name}
                          onSettlementComplete={() => window.location.reload()}
                          className="h-8 px-3 text-xs"
                        />
                      </div>
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