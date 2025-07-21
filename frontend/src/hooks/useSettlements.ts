import { useState, useCallback } from 'react';
import { useTonContract } from './useTonContract';

export interface Settlement {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
}

interface UseSettlementsOptions {
  groupId?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export const useSettlements = ({ 
  groupId, 
  onSuccess, 
  onError 
}: UseSettlementsOptions = {}) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    isConnected, 
    executeBatchSettlement, 
    isExecuting 
  } = useTonContract();

  // Calcular settlements otimizados
  const calculateSettlements = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      const errorMsg = 'Conecte sua carteira TON primeiro!';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const url = `/api/debts/calculate${groupId ? `?groupId=${groupId}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao calcular settlements');
      }
      
      setSettlements(data.settlements || []);
      return true;
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao calcular settlements';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    } finally {
      setIsCalculating(false);
    }
  }, [isConnected, groupId, onError]);

  // Executar settlements na blockchain
  const executeSettlements = useCallback(async (): Promise<boolean> => {
    if (!isConnected || settlements.length === 0) {
      const errorMsg = settlements.length === 0 
        ? 'Nenhum settlement para executar'
        : 'Carteira não conectada';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    setError(null);

    try {
      // 1. Buscar endereços TON dos usuários destinatários
      const settlementsWithAddresses = await Promise.all(
        settlements.map(async (settlement) => {
          try {
            const response = await fetch(`/api/users/${settlement.to}/wallet`);
            
            if (!response.ok) {
              throw new Error(`Usuário ${settlement.toName} não encontrado`);
            }
            
            const userData = await response.json();
            
            if (!userData.tonWalletAddress) {
              throw new Error(`${settlement.toName} não possui carteira TON configurada`);
            }
            
            return {
              to: userData.tonWalletAddress,
              amount: settlement.amount
            };
          } catch (err) {
            throw new Error(`Erro ao buscar dados de ${settlement.toName}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
          }
        })
      );

      // 2. Executar transação na blockchain (usuário assina)
      const txResult = await executeBatchSettlement(
        settlementsWithAddresses,
        groupId || 'global-settlement'
      );

      if (!txResult.success) {
        throw new Error(txResult.error || 'Falha na execução da transação');
      }

      // 3. Registrar settlement no backend para histórico
      try {
        const registrationResponse = await fetch('/api/debts/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId,
            settlements,
            transactionHash: txResult.transactionHash,
            status: 'COMPLETED',
            totalAmount: txResult.totalAmount,
            settlementsCount: txResult.settlementsCount,
            executedAt: new Date().toISOString()
          })
        });

        if (!registrationResponse.ok) {
          console.warn('Erro ao registrar settlement no backend:', registrationResponse.statusText);
        }
      } catch (registrationError) {
        // Não falhar se o registro no backend der erro
        console.warn('Erro ao registrar settlement no backend:', registrationError);
      }

      // 4. Limpar estados e notificar sucesso
      setSettlements([]);
      setError(null);
      
      onSuccess?.(txResult);
      
      return true;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao executar settlement';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }
  }, [settlements, isConnected, executeBatchSettlement, groupId, onSuccess, onError]);

  // Limpar settlements e erros
  const clearSettlements = useCallback(() => {
    setSettlements([]);
    setError(null);
  }, []);

  // Computed values
  const hasSettlements = settlements.length > 0;
  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
  const settlementsCount = settlements.length;

  return {
    // Estados
    settlements,
    isCalculating,
    isExecuting,
    error,
    isConnected,
    
    // Ações
    calculateSettlements,
    executeSettlements,
    clearSettlements,
    
    // Computed
    hasSettlements,
    totalAmount,
    settlementsCount
  };
};
