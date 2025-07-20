import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Search, Filter, ArrowUpDown, CheckCircle, AlertCircle, DollarSign, Users } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useExpenseHistory } from "@/hooks/useExpenseHistory";
import { formatDateSafely } from "@/lib/utils";
import { useState } from "react";

export const History = () => {
  const { user } = useWalletConnection();
  const { expenses, loading, error, stats, refetch, markAsSettled } = useExpenseHistory(user?.id);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "settled" | "pending">("all");



  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.group.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || 
      (filterStatus === "settled" && expense.participants.every(p => p.isSettled)) ||
      (filterStatus === "pending" && expense.participants.some(p => !p.isSettled));
    
    return matchesSearch && matchesFilter;
  });

  const handleMarkAsSettled = async (expenseId: string, participantId: string) => {
    try {
      await markAsSettled(expenseId, participantId);
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
    }
  };

  const getExpenseStatus = (expense: any) => {
    const userParticipant = expense.participants.find((p: any) => p.userId === user?.id);
    
    if (expense.payer.id === user?.id) {
      // Usuário pagou esta despesa
      const allSettled = expense.participants.every((p: any) => p.isSettled);
      return allSettled ? "settled" : "pending";
    } else if (userParticipant) {
      // Usuário deve dinheiro
      return userParticipant.isSettled ? "settled" : "pending";
    }
    
    return "settled";
  };

  const getExpenseAmount = (expense: any) => {
    const userParticipant = expense.participants.find((p: any) => p.userId === user?.id);
    
    if (expense.payer.id === user?.id) {
      return expense.amount;
    } else if (userParticipant) {
      return userParticipant.amountOwed;
    }
    
    return 0;
  };

  const getExpenseType = (expense: any) => {
    if (expense.payer.id === user?.id) {
      return "paid";
    } else {
      return "owed";
    }
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Button 
              variant={filterStatus === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              Todas
            </Button>
            <Button 
              variant={filterStatus === "pending" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("pending")}
            >
              Pendentes
            </Button>
            <Button 
              variant={filterStatus === "settled" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilterStatus("settled")}
            >
              Resolvidas
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">R$ {stats.total.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">R$ {stats.paid.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Pagos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">R$ {stats.received.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Devidos</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">R$ {stats.pending.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </Card>
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
          {!loading && !error && filteredExpenses.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Despesas ({filteredExpenses.length})</h3>
              {filteredExpenses.map((expense) => {
                const status = getExpenseStatus(expense);
                const amount = getExpenseAmount(expense);
                const type = getExpenseType(expense);
                const userParticipant = expense.participants.find((p: any) => p.userId === user?.id);

                return (
                  <Card key={expense.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{expense.description || "Despesa sem descrição"}</h4>
                          <Badge 
                            variant={status === "settled" ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {status === "settled" ? "Resolvida" : "Pendente"}
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
                            {type === "paid" ? "Você pagou" : "Você deve"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-bold ${type === "paid" ? "text-green-600" : "text-red-600"}`}>
                          R$ {amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {expense.category || "Sem categoria"}
                        </div>
                      </div>
                    </div>

                    {/* Action Button for Pending Expenses */}
                    {status === "pending" && userParticipant && !userParticipant.isSettled && (
                      <div className="flex justify-end mt-3 pt-3 border-t">
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkAsSettled(expense.id, userParticipant.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marcar como Pago
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredExpenses.length === 0 && (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">
                {searchTerm || filterStatus !== "all" ? "Nenhuma despesa encontrada" : "Nenhuma despesa ainda"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "all" 
                  ? "Tente ajustar os filtros ou a busca" 
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