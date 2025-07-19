import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Filter } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { NewGroupModal } from "@/components/modals/NewGroupModal";

// Types for form data
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

export const Groups = () => {
  const handleGroupSubmit = (data: GroupFormData) => {
    console.log("Novo grupo criado:", data);
    // Aqui você implementaria a lógica para salvar o grupo
    // Por exemplo: mutateGroup(data) ou dispatch(createGroup(data))
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
            <NewGroupModal onSubmit={handleGroupSubmit}>
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
              <div className="text-2xl font-bold text-primary">0</div>
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

          {/* Empty State */}
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Nenhum grupo ainda</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro grupo para começar a dividir despesas
            </p>
            
            {/* Modal de Criar Grupo integrado no empty state */}
            <NewGroupModal onSubmit={handleGroupSubmit}>
              <Button className="bg-ton-gradient text-white hover:bg-ton-gradient-dark">
                <Plus className="w-4 h-4 mr-2" />
                Criar Grupo
              </Button>
            </NewGroupModal>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};