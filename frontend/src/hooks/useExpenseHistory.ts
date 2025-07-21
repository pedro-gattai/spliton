import { useState, useEffect } from 'react';
import { apiService, type ExpenseHistory } from '@/lib/api';

export interface ExpenseHistoryOptions {
  limit?: number;
  offset?: number;
  status?: 'all' | 'paid' | 'unpaid';
}

export interface ExpenseStats {
  total: number;
  paid: number;
  received: number;
  pending: number;
}

export const useExpenseHistory = (
  userId?: string,
  options: ExpenseHistoryOptions = {},
) => {
  const [expenses, setExpenses] = useState<ExpenseHistory[]>([]);
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
      const response = await apiService.getExpenseHistory(userId, options);
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

  const calculateStats = (expenseList: ExpenseHistory[]) => {
    let total = 0;
    let paid = 0;
    let received = 0;
    let pending = 0;

    expenseList.forEach(expense => {
      total += expense.userAmountOwed;
      
      if (expense.isSettled) {
        paid += expense.userAmountOwed;
      } else {
        pending += expense.userAmountOwed;
      }
    });

    setStats({
      total: total,
      paid: paid,
      received: received,
      pending: pending,
    });
  };

  useEffect(() => {
    fetchExpenses();
  }, [userId, options.limit, options.offset, options.status]);

  return {
    expenses,
    loading,
    error,
    stats,
    refetch: fetchExpenses,
  };
}; 