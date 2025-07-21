import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

export interface UserStats {
  totalExpenses: number;
  totalSpent: number;
  totalOwed: number;
  totalToReceive: number;
  groupsCount: number;
  settledExpenses: number;
}

export const useUserStats = (userId?: string) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getUserStats(userId);
      setStats(response);
    } catch (err) {
      console.error('Erro ao buscar estatísticas do usuário:', err);
      setError('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}; 