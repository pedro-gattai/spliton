import { useState, useCallback } from 'react';
import { useTonContract } from './useTonContract';

interface Settlement {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
  fromAddress?: string;
  toAddress?: string;
}

interface SettlementsData {
  settlements: Settlement[];
  totalAmount: number;
  settlementsCount: number;
  optimizationSaved?: number;
}

export const useSettlements = (
  groupId?: string,
  onSuccess?: (data: SettlementsData) => void,
  onError?: (error: string) => void,
) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  const { isConnected, executeBatchSettlement } = useTonContract();

  // Calcular settlements
  const calculateSettlements = useCallback(async (): Promise<boolean> => {
    console.log('🔍 Calculando settlements...');
    
    setIsCalculating(true);
    setError(null);

    try {
      const queryParam = groupId ? `?groupId=${groupId}` : '';
      const url = `/api/payments/calculate${queryParam}`;
      
      console.log(`📡 Fazendo fetch para: ${url}`);
      
      const response = await fetch(url);
      
      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Response error: ${errorText}`);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Dados recebidos:', data);

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao calcular settlements');
      }

      setSettlements(data.settlements || []);
      setTotalAmount(data.totalAmount || 0);

      const settlementsData: SettlementsData = {
        settlements: data.settlements || [],
        totalAmount: data.totalAmount || 0,
        settlementsCount: data.settlementsCount || 0,
        optimizationSaved: data.optimizationSaved || 0,
      };

      onSuccess?.(settlementsData);
      
      console.log(`✅ ${data.settlementsCount} settlements calculados`);
      
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro ao calcular settlements:', errorMsg);
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    } finally {
      setIsCalculating(false);
    }
  }, [groupId, onSuccess, onError]);

  // Executar settlements via TON Connect
  const executeSettlements = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      const errorMsg = 'Conecte sua carteira TON primeiro!';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    if (settlements.length === 0) {
      const errorMsg = 'Nenhum settlement para executar';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    setIsExecuting(true);
    setError(null);

    try {
      // Preparar settlements para a carteira
      const tonSettlements = settlements.map(settlement => ({
        to: settlement.toAddress || settlement.to,
        amount: settlement.amount
      }));

      console.log('🚀 Executando settlements via TON Connect:', tonSettlements);

      // Executar via TON Connect (frontend assina)
      const result = await executeBatchSettlement(
        tonSettlements,
        groupId || 'global-settlement'
      );

      if (!result.success) {
        throw new Error(result.error || 'Falha na execução do settlement');
      }

      console.log('✅ Settlements executados com sucesso!', result);

      // Limpar settlements após execução
      setSettlements([]);
      setTotalAmount(0);

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro ao executar settlements:', errorMsg);
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    } finally {
      setIsExecuting(false);
    }
  }, [isConnected, settlements, groupId, executeBatchSettlement, onError]);

  return {
    settlements,
    totalAmount,
    isCalculating,
    isExecuting,
    error,
    isConnected,
    calculateSettlements,
    executeSettlements,
  };
};