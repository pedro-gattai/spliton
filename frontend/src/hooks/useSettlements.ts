import { useState, useCallback } from 'react';
import { useWalletConnection } from './useWalletConnection';
import { useTonContract } from './useTonContract';

interface Settlement {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
  fromAddress?: string;
  toAddress?: string;
  participantId?: string;
  expenseId?: string;
  expenseDescription?: string;
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
  const [isPayingIndividual, setIsPayingIndividual] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  const { user, connected } = useWalletConnection();
  const { executeDirectPayment } = useTonContract();

  // Calcular settlements (buscar dívidas do usuário)
  const calculateSettlements = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setError('Usuário não conectado');
      return false;
    }
    
    setIsCalculating(true);
    setError(null);

    try {
      // Use direct fetch with proper API base URL
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/api';
      const queryParam = groupId ? `?groupId=${groupId}` : '';
      const url = `${API_BASE_URL}/payments/debts/${user.id}${queryParam}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Response error: ${errorText}`);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao buscar dívidas');
      }

      // Converter dívidas para formato de settlements
      const debtsAsSettlements: Settlement[] = data.debts.map((debt: {
        to: string;
        toName: string;
        toAddress: string;
        amount: number;
        participantId: string;
        expenseId: string;
        expenseDescription: string;
      }) => ({
        from: user.id,
        to: debt.to,
        amount: debt.amount,
        fromName: user.username || 'Você',
        toName: debt.toName,
        fromAddress: user.tonWalletAddress,
        toAddress: debt.toAddress,
        participantId: debt.participantId,
        expenseId: debt.expenseId,
        expenseDescription: debt.expenseDescription,
      }));

      setSettlements(debtsAsSettlements);
      setTotalAmount(data.totalAmount || 0);

      const settlementsData: SettlementsData = {
        settlements: debtsAsSettlements,
        totalAmount: data.totalAmount || 0,
        settlementsCount: data.debtsCount || 0,
        optimizationSaved: 0,
      };

      onSuccess?.(settlementsData);
      
      console.log(`✅ ${data.debtsCount} dívidas encontradas`);
      
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
  }, [user, groupId, onSuccess, onError]);

  // Executar TODAS as dívidas de uma vez
  const executeAllSettlements = useCallback(async (): Promise<boolean> => {
    if (!connected) {
      const errorMsg = 'Conecte sua carteira TON primeiro!';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    if (settlements.length === 0) {
      const errorMsg = 'Nenhuma dívida para pagar';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    setIsExecuting(true);
    setError(null);

    try {
      console.log('🚀 Executando TODOS os pagamentos via carteira:', settlements.length);

      let successfulPayments = 0;
      const participantIds: string[] = [];

      for (const settlement of settlements) {
        console.log(`💸 Pagando ${settlement.amount} TON para ${settlement.toName}`);

        try {
          // ✅ USAR A CARTEIRA CONECTADA EM VEZ DO BACKEND
          const result = await executeDirectPayment(
            settlement.toAddress!,
            settlement.amount,
            `${settlement.expenseDescription || 'Pagamento'} - SplitOn`
          );

          if (!result.success) {
            console.error(`❌ Falha no pagamento para ${settlement.toName}:`, result.error);
            continue;
          }

          console.log(`✅ Pagamento realizado para ${settlement.toName}:`, result);
          successfulPayments++;
          
          if (settlement.participantId) {
            participantIds.push(settlement.participantId);
          }

        } catch (paymentError) {
          console.error(`❌ Erro no pagamento para ${settlement.toName}:`, paymentError);
        }
      }

      // Marcar dívidas como pagas
      if (participantIds.length > 0) {
        try {
          const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/api';
          const markResponse = await fetch(`${API_BASE_URL}/payments/mark-paid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantIds })
          });

          if (markResponse.ok) {
            console.log(`✅ ${participantIds.length} dívidas marcadas como pagas`);
            // Remover dívidas pagas da lista
            setSettlements(prev => prev.filter(s => !participantIds.includes(s.participantId || '')));
            setTotalAmount(prev => prev - settlements.filter(s => participantIds.includes(s.participantId || '')).reduce((sum, s) => sum + s.amount, 0));
          }
        } catch (markError) {
          console.warn('⚠️ Erro ao marcar dívidas como pagas:', markError);
        }
      }

      if (successfulPayments === 0) {
        throw new Error('Nenhum pagamento foi processado com sucesso');
      }

      console.log(`✅ ${successfulPayments}/${settlements.length} pagamentos executados com sucesso!`);
      return true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro ao executar todos os pagamentos:', errorMsg);
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    } finally {
      setIsExecuting(false);
    }
  }, [connected, settlements, executeDirectPayment, onError]);

  // Executar UMA dívida específica
  const executeIndividualSettlement = useCallback(async (settlement: Settlement): Promise<boolean> => {
    if (!connected) {
      const errorMsg = 'Conecte sua carteira TON primeiro!';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    if (!settlement.participantId) {
      const errorMsg = 'ID da dívida não encontrado';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    setIsPayingIndividual(settlement.participantId);
    setError(null);

    try {
      console.log(`💸 Pagando ${settlement.amount} TON para ${settlement.toName}`);

      // ✅ USAR A CARTEIRA CONECTADA EM VEZ DO BACKEND
      const result = await executeDirectPayment(
        settlement.toAddress!,
        settlement.amount,
        `${settlement.expenseDescription || 'Pagamento'} - SplitOn`
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Falha no pagamento');
      }

      console.log(`✅ Pagamento individual realizado:`, result);

      // Marcar esta dívida como paga
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/api';
      const markResponse = await fetch(`${API_BASE_URL}/payments/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [settlement.participantId] })
      });

      if (markResponse.ok) {
        console.log(`✅ Dívida marcada como paga`);
        // Remover esta dívida da lista
        setSettlements(prev => prev.filter(s => s.participantId !== settlement.participantId));
        setTotalAmount(prev => prev - settlement.amount);
      }

      return true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro ao executar pagamento individual:', errorMsg);
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    } finally {
      setIsPayingIndividual(null);
    }
  }, [connected, executeDirectPayment, onError]);



  // Limpar settlements
  const clearSettlements = useCallback(() => {
    setSettlements([]);
    setTotalAmount(0);
    setError(null);
  }, []);

  return {
    settlements,
    totalAmount,
    isCalculating,
    isExecuting,
    isPayingIndividual,
    error,
    connected,
    calculateSettlements,
    executeAllSettlements,
    executeIndividualSettlement,
    clearSettlements,
    hasSettlements: settlements.length > 0,
    settlementsCount: settlements.length,
  };
};