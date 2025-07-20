import { useState, useEffect } from 'react';
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

  const fetchBalances = async () => {
    if (!userId || !groupIds || groupIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const balancePromises = groupIds.map(groupId =>
        apiService.getGroupBalance(groupId, userId)
      );
      
      const balanceResults = await Promise.all(balancePromises);
      
      const balancesMap: GroupBalancesMap = {};
      groupIds.forEach((groupId, index) => {
        balancesMap[groupId] = balanceResults[index];
      });
      
      setBalances(balancesMap);
    } catch (err) {
      console.error('Erro ao buscar balanços dos grupos:', err);
      setError('Erro ao carregar balanços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [userId, groupIds]);

  const getBalanceColor = (balance: GroupBalance) => {
    if (balance.status === 'settled') return 'gray';
    if (balance.status === 'receive') return 'green';
    return 'red';
  };

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances,
    getBalanceColor,
  };
}; 