import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Users,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useExpenseHistory } from "@/hooks/useExpenseHistory";
import { useUserStats } from "@/hooks/useUserStats";
import { formatDateSafely } from "@/lib/utils";
import { useState } from "react";

export const History = () => {
  const { user } = useWalletConnection();
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  
  // Use the new hooks
  const { stats: userStats, loading: statsLoading, error: statsError } = useUserStats(user?.id);
  const { 
    expenses, 
    loading: historyLoading, 
    error: historyError, 
    stats: expenseStats, 
    refetch 
  } = useExpenseHistory(user?.id, { status: filterStatus });

  const loading = statsLoading || historyLoading;
  const error = statsError || historyError;

  const getStatusIcon = (amount: number) => {
    if (amount > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (amount < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };



  return (
    <div className="min-h-screen bg-background">
      <div className="mobile-container min-h-screen pb-20">
        <AppHeader />

        {/* Main Content */}
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Histórico</h1>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Statistics Cards */}
          {!statsLoading && userStats && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-muted-foreground">Total Gasto</div>
                  {getStatusIcon(userStats.totalSpent)}
                </div>
                <div className="text-lg font-bold text-primary">
                  {userStats.totalSpent.toFixed(2)} TON
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-muted-foreground">A Receber</div>
                  {getStatusIcon(userStats.totalToReceive)}
                </div>
                <div className="text-lg font-bold text-green-600">
                  {userStats.totalToReceive.toFixed(2)} TON
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-muted-foreground">Grupos Ativos</div>
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {userStats.groupsCount}
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-muted-foreground">Você Deve</div>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-lg font-bold text-red-600">
                  {userStats.totalOwed.toFixed(2)} TON
                </div>
              </Card>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button 
              variant={filterStatus === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              Todos
            </Button>
            <Button 
              variant={filterStatus === "paid" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("paid")}
            >
              Pagos
            </Button>
            <Button 
              variant={filterStatus === "unpaid" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("unpaid")}
            >
              Pendentes
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <Card className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="font-semibold mb-2">Carregando histórico...</h3>
            </Card>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="font-semibold mb-2">Erro ao carregar</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => refetch()} variant="outline">
                Tentar Novamente
              </Button>
            </Card>
          )}

          {/* Expenses List */}
          {!loading && !error && expenses.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Despesas ({expenses.length})</h3>
              {expenses.map((expense) => (
                <Card key={expense.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{expense.description}</h4>
                        <Badge 
                          variant={expense.isSettled ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {expense.isSettled ? "PAGO" : "PENDENTE"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Users className="w-3 h-3" />
                        {expense.group.name}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateSafely(expense.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Pago por @{expense.payer.username}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {expense.amount.toFixed(2)} TON
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Você deve: {expense.userAmountOwed.toFixed(2)} TON
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {expense.category || "Sem categoria"}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && expenses.length === 0 && (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">
                {filterStatus !== "all" ? "Nenhuma despesa encontrada" : "Nenhuma despesa ainda"}
              </h3>
              <p className="text-muted-foreground">
                {filterStatus !== "all" 
                  ? "Tente ajustar os filtros" 
                  : "Suas despesas aparecerão aqui quando você começar a usar o SplitOn"
                }
              </p>
            </Card>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};