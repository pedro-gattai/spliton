import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Search, Filter, ArrowUpDown } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";

export const History = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mobile-container min-h-screen pb-20">
        <AppHeader />

        {/* Main Content */}
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Histórico</h1>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
              placeholder="Buscar transações..."
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-success">0</div>
              <div className="text-xs text-muted-foreground">Recebidos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">0</div>
              <div className="text-xs text-muted-foreground">Pagos</div>
            </Card>
          </div>

          {/* Empty State */}
          <Card className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Nenhuma transação ainda</h3>
            <p className="text-muted-foreground">
              Suas transações aparecerão aqui quando você começar a usar o SplitOn
            </p>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};