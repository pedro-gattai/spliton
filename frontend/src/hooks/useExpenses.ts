import { useState, useEffect, useCallback } from 'react';
import { apiService, type Expense, type CreateExpenseRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useExpenses = (groupId?: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar despesas
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const expensesData = await apiService.getExpenses(groupId);
      setExpenses(expensesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar despesas';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [groupId, toast]);

  // Criar nova despesa
  const createExpense = useCallback(async (expenseData: CreateExpenseRequest) => {
    setLoading(true);
    setError(null);

    try {
      const newExpense = await apiService.createExpense(expenseData);
      
      setExpenses(prev => [newExpense, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Despesa criada com sucesso!",
      });

      return newExpense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar despesa';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Buscar despesa por ID
  const getExpenseById = useCallback(async (expenseId: string) => {
    try {
      return await apiService.getExpenseById(expenseId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar despesa';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Atualizar despesa
  const updateExpense = useCallback(async (expenseId: string, data: Partial<CreateExpenseRequest>) => {
    try {
      const updatedExpense = await apiService.updateExpense(expenseId, data);
      
      setExpenses(prev => prev.map(expense => 
        expense.id === expenseId ? updatedExpense : expense
      ));
      
      toast({
        title: "Sucesso",
        description: "Despesa atualizada com sucesso!",
      });

      return updatedExpense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar despesa';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Deletar despesa
  const deleteExpense = useCallback(async (expenseId: string) => {
    try {
      await apiService.deleteExpense(expenseId);
      
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      
      toast({
        title: "Sucesso",
        description: "Despesa deletada com sucesso!",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar despesa';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Buscar despesas quando groupId mudar
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    createExpense,
    getExpenseById,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
}; 