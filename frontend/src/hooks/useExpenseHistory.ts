import { useState, useEffect } from 'react';
import { apiService, type Expense } from '@/lib/api';

export type ExpenseHistoryItem = Expense;

export interface ExpenseStats {
  total: number;
  paid: number;
  received: number;
  pending: number;
}

export const useExpenseHistory = (userId?: string) => {
  const [expenses, setExpenses] = useState<ExpenseHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ExpenseStats>({
    total: 0,
    paid: 0,
    received: 0,
    pending: 0,
  });

  const fetchExpenses = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getExpensesByUser(userId);
      setExpenses(response || []);
      
      // Calcular estatísticas
      calculateStats(response || []);
    } catch (err) {
      console.error('Erro ao buscar histórico de despesas:', err);
      setError('Erro ao carregar histórico de despesas');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (expenseList: ExpenseHistoryItem[]) => {
    let total = 0;
    let paid = 0;
    let received = 0;
    let pending = 0;

    expenseList.forEach(expense => {
      const userParticipant = expense.participants.find(p => p.userId === userId);
      
      if (expense.payer.id === userId) {
        // Usuário pagou esta despesa
        total += expense.amount;
        paid += expense.amount;
        
        // Verificar se todos os participantes pagaram
        const allSettled = expense.participants.every(p => p.isSettled);
        if (!allSettled) {
          pending += expense.amount;
        }
      } else if (userParticipant) {
        // Usuário deve dinheiro nesta despesa
        total += userParticipant.amountOwed;
        received += userParticipant.amountOwed;
        
        if (!userParticipant.isSettled) {
          pending += userParticipant.amountOwed;
        }
      }
    });

    setStats({
      total: total,
      paid: paid,
      received: received,
      pending: pending,
    });
  };

  const markAsSettled = async (expenseId: string, participantId: string) => {
    try {
      await apiService.updateExpenseParticipant(expenseId, participantId, { isSettled: true });
      // Recarregar dados
      await fetchExpenses();
    } catch (err) {
      console.error('Erro ao marcar como pago:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [userId]);

  return {
    expenses,
    loading,
    error,
    stats,
    refetch: fetchExpenses,
    markAsSettled,
  };
}; 