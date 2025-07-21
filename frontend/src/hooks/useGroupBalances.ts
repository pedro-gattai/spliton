import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '@/lib/api';

export interface GroupBalance {
  balance: number;
  totalPaid: number;
  totalOwed: number;
  status: 'owe' | 'receive' | 'settled';
}

export interface GroupBalancesMap {
  [groupId: string]: GroupBalance;
}

export const useGroupBalances = (userId?: string, groupIds?: string[]) => {
  const [balances, setBalances] = useState<GroupBalancesMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize groupIds to prevent unnecessary re-renders
  const stableGroupIds = useMemo(() => {
    if (!groupIds || groupIds.length === 0) return [];
    return [...groupIds].sort(); // Sort to ensure stable reference
  }, [groupIds]);

  // Create a stable key for dependency tracking
  const dependencyKey = useMemo(() => {
    return `${userId}-${stableGroupIds.join(',')}`;
  }, [userId, stableGroupIds]);

  const fetchBalances = useCallback(async () => {
    if (!userId || !stableGroupIds || stableGroupIds.length === 0) {
      setBalances({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balancePromises = stableGroupIds.map(groupId =>
        apiService.getGroupBalance(groupId, userId)
      );
      
      const balanceResults = await Promise.all(balancePromises);
      
      const balancesMap: GroupBalancesMap = {};
      stableGroupIds.forEach((groupId, index) => {
        balancesMap[groupId] = balanceResults[index];
      });
      
      setBalances(balancesMap);
    } catch (err) {
      console.error('Erro ao buscar balanços dos grupos:', err);
      setError('Erro ao carregar balanços');
    } finally {
      setLoading(false);
    }
  }, [userId, stableGroupIds]);

  useEffect(() => {
    fetchBalances();
  }, [dependencyKey]); // Use dependencyKey instead of individual dependencies

  const getBalanceColor = useCallback((balance: GroupBalance) => {
    if (balance.status === 'settled') return 'gray';
    if (balance.status === 'receive') return 'green';
    return 'red';
  }, []);

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances,
    getBalanceColor,
  };
}; 