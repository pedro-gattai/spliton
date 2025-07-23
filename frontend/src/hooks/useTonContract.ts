import { useState, useCallback, useMemo } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { beginCell, toNano, Address, Cell, Dictionary } from '@ton/core';

interface Settlement {
  to: string;
  amount: number;
}

interface ContractExecutionResult {
  success: boolean;
  transactionHash?: string;
  totalAmount?: number;
  settlementsCount?: number;
  error?: string;
  suggestion?: string;
}

// ✅ Função para buscar saldo da carteira via backend
const fetchWalletBalance = async (address: string): Promise<number> => {
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
  const url = API_BASE_URL ? `${API_BASE_URL}/wallet/balance/${address}` : `/api/wallet/balance/${address}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar saldo: ${response.status}`);
    }
    
    const data = await response.json();
    return data.balanceInTon || 0;
  } catch (error) {
    console.error('❌ Erro ao buscar saldo:', error);
    throw error;
  }
};

export const useTonContract = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [isExecuting, setIsExecuting] = useState(false);

  // Endereço do contrato configurado via .env
  const contractAddress = useMemo(
    () => import.meta.env.VITE_SPLIT_CONTRACT_ADDRESS || '',
    []
  );

  // ✅ NOVA FUNÇÃO: Verificar saldo antes de executar transações
  const checkSufficientBalance = useCallback(async (requiredAmount: number) => {
    if (!wallet?.account?.address) return false;
    try {
      const balanceInTON = await fetchWalletBalance(wallet.account.address);
      console.log('💰 Saldo:', { balanceInTON, requiredAmount, sufficient: balanceInTON >= requiredAmount });
      return balanceInTON >= requiredAmount;
    } catch (error) {
      console.error('❌ Erro ao verificar saldo:', error);
      return false;
    }
  }, [wallet]);

  // Função melhorada para validar endereços TON
  const isValidTonAddress = useCallback((address: string): boolean => {
    if (!address || typeof address !== 'string') {
      return false;
    }

    try {
      Address.parse(address);
      return true;
    } catch (error) {
      console.log('❌ Endereço inválido:', address);
      return false;
    }
  }, []);

  // ✅ FUNÇÃO CORRIGIDA PARA DirectPayment - COMPATÍVEL COM SEU CONTRATO TACT
  const createDirectPaymentPayload = useCallback((to: string, amount: number, groupId: string): string => {
    try {
      console.log('🏗️ Criando payload DirectPayment (TACT):', { to, amount, groupId });
      
      if (!isValidTonAddress(to)) {
        throw new Error(`Endereço inválido: ${to}`);
      }

      // ✅ ESTRUTURA CORRETA PARA TACT: opcode + fields em ordem
      const cell = beginCell()
        .storeUint(0x04, 32)                    // DirectPayment opcode
        .storeAddress(Address.parse(to))        // to: Address
        .storeCoins(toNano(amount.toString()))  // amount: Int (em nano)
        .storeStringTail(groupId)               // groupId: String (inline)
        .endCell();
      
      const bocString = cell.toBoc().toString('base64');
      console.log('✅ Payload DirectPayment TACT criado');
      return bocString;
      
    } catch (error) {
      console.error('❌ Erro ao criar payload DirectPayment:', error);
      throw new Error(`Erro ao criar payload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [isValidTonAddress]);

  // ✅ FUNÇÃO CORRIGIDA PARA BatchSettlement - COMPATÍVEL COM SEU CONTRATO TACT
  const createBatchSettlementPayload = useCallback((settlements: Settlement[], groupId: string): string => {
    try {
      console.log('🏗️ Criando payload BatchSettlement (TACT):', { settlements: settlements.length, groupId });
      
      // ✅ Criar map<Address, Int> conforme definido no TACT
      const recipientsMap = Dictionary.empty(
        Dictionary.Keys.Address(),  // Address key
        Dictionary.Values.BigVarUint(4)  // Int value (BigVarUint para valores grandes)
      );
      
      settlements.forEach((settlement) => {
        if (!isValidTonAddress(settlement.to)) {
          throw new Error(`Endereço inválido: ${settlement.to}`);
        }
        
        const addr = Address.parse(settlement.to);
        const amount = toNano(settlement.amount.toString());
        recipientsMap.set(addr, amount);
      });

      // ✅ ESTRUTURA CORRETA PARA TACT: opcode + map + groupId
      const cell = beginCell()
        .storeUint(0x05, 32)              // BatchSettlement opcode
        .storeDict(recipientsMap)         // recipients: map<Address, Int>
        .storeStringTail(groupId)         // groupId: String (inline)
        .endCell();
      
      const bocString = cell.toBoc().toString('base64');
      console.log('✅ Payload BatchSettlement TACT criado');
      return bocString;
      
    } catch (error) {
      console.error('❌ Erro ao criar payload BatchSettlement:', error);
      throw new Error(`Erro ao criar payload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [isValidTonAddress]);

  // ✅ FUNÇÃO OTIMIZADA PARA BatchSettlement
  const executeBatchSettlement = useCallback(
    async (settlements: Settlement[], groupId: string): Promise<ContractExecutionResult> => {
      if (!wallet) {
        return {
          success: false,
          error: 'Carteira TON não conectada'
        };
      }

      if (settlements.length === 0) {
        return {
          success: false,
          error: 'Nenhum settlement para executar'
        };
      }

      setIsExecuting(true);
      
      try {
        // Validar endereço do contrato
        if (!contractAddress || !isValidTonAddress(contractAddress)) {
          throw new Error('Endereço do contrato inválido ou não configurado');
        }

        // ✅ IMPORTANTE: BatchSettlement só pode ser chamado pelo owner (backend)
        console.warn('⚠️ BatchSettlement requer que o sender seja o owner do contrato');

        // Calcular valor total e validar settlements
        let totalAmount = 0;
        for (const [index, settlement] of settlements.entries()) {
          const amountTON = Number(settlement.amount);
          if (isNaN(amountTON) || amountTON <= 0) {
            throw new Error(`Valor inválido no settlement ${index}: ${settlement.amount}`);
          }

          if (!isValidTonAddress(settlement.to)) {
            throw new Error(`Endereço TON inválido no settlement ${index}: ${settlement.to}`);
          }
          
          totalAmount += amountTON;
        }

        // Criar payload para BatchSettlement
        const batchPayload = createBatchSettlementPayload(settlements, groupId);
        
        // ✅ Gas calculado baseado no contrato (SendPayGasSeparately)
        const baseGas = 0.1; // Gas base para processamento
        const gasPerSettlement = 0.05; // Gas por settlement individual
        const totalGas = baseGas + (gasPerSettlement * settlements.length);
        const totalWithGas = totalAmount + totalGas;
        
        // ✅ Verificar saldo antes de executar
        const hasSufficientBalance = await checkSufficientBalance(totalWithGas);
        if (!hasSufficientBalance) {
          return {
            success: false,
            error: 'Saldo insuficiente para executar a transação',
            suggestion: 'Verifique se você tem TON suficiente na sua carteira'
          };
        }
        
        // Criar transação
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutos
          messages: [{
            address: contractAddress,
            amount: toNano(totalWithGas).toString(),
            payload: batchPayload
          }]
        };

        console.log('🚀 Executando BatchSettlement:', {
          settlements: settlements.length,
          totalAmount,
          totalGas,
          totalWithGas,
          groupId
        });

        const result = await tonConnectUI.sendTransaction(transaction) as { boc: string };

        console.log('✅ BatchSettlement executado com sucesso');

        return {
          success: true,
          transactionHash: result.boc,
          totalAmount: totalAmount,
          settlementsCount: settlements.length,
        };

      } catch (error) {
        console.error('❌ Erro ao executar BatchSettlement:', error);
        
        // ✅ Melhorado tratamento de erros
        if (error instanceof Error && (error.message.includes('Unable to verify') || error.message.includes('verify transaction'))) {
          return {
            success: false,
            error: 'Erro de verificação da transação. Verifique sua conexão e saldo de TON.',
            suggestion: 'Tente trocar de Wi-Fi para dados móveis ou vice-versa.'
          };
        }
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido na transação'
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, tonConnectUI, contractAddress, isValidTonAddress, createBatchSettlementPayload, checkSufficientBalance]
  );

  // ✅ FUNÇÃO COMPLETAMENTE REESCRITA BASEADA NO SEU CONTRATO TACT
  const executeDirectPayment = useCallback(
    async (to: string, amount: number, description = 'SplitON Payment'): Promise<ContractExecutionResult> => {
      if (!wallet) {
        return { 
          success: false, 
          error: 'Carteira TON não conectada' 
        };
      }

      setIsExecuting(true);
      
      try {
        console.log('🚀 Iniciando DirectPayment (TACT):', { to, amount, description });

        // ✅ Validações básicas
        if (!to || typeof to !== 'string' || to.trim().length === 0) {
          throw new Error('Endereço de destino está vazio');
        }
        
        if (!contractAddress || contractAddress.trim().length === 0) {
          throw new Error('VITE_SPLIT_CONTRACT_ADDRESS não está configurado');
        }

        if (!isValidTonAddress(to)) {
          throw new Error(`Endereço TON inválido: ${to}`);
        }

        if (!isValidTonAddress(contractAddress)) {
          throw new Error('Endereço do contrato inválido');
        }

        // ✅ Validações baseadas no seu contrato TACT
        if (amount <= 0) {
          throw new Error('Valor deve ser positivo');
        }

        if (amount > 100) {
          throw new Error('Valor máximo é 100 TON');
        }

        const minAmount = 0.01;
        if (amount < minAmount) {
          throw new Error(`Valor mínimo é ${minAmount} TON`);
        }

        // ✅ Cálculo MELHORADO com margem para taxas da rede
        const contractFee = 0.05;  // Fee fixo definido no contrato: ton("0.05")
        const networkFeeMargin = 0.1; // Margem para taxas variáveis da rede
        const totalRequired = amount + contractFee + networkFeeMargin;  // Adicionando margem
        
        console.log('💰 Cálculo baseado no contrato TACT:', {
          amount,
          contractFee,
          networkFeeMargin,
          totalRequired,
          'context().value >= totalRequired': `${totalRequired} TON`
        });

        // ✅ Verificar saldo antes de executar
        const hasSufficientBalance = await checkSufficientBalance(totalRequired);
        if (!hasSufficientBalance) {
          return {
            success: false,
            error: 'Saldo insuficiente para executar a transação',
            suggestion: 'Verifique se você tem TON suficiente na sua carteira'
          };
        }

        // ✅ Criar payload compatível com TACT
        const directPaymentPayload = createDirectPaymentPayload(to, amount, description);

        // ✅ Construir transação
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutos
          messages: [{
            address: contractAddress,
            amount: toNano(totalRequired).toString(), // Valor com margem para taxas
            payload: directPaymentPayload
          }]
        };

        // ✅ Debug detalhado antes de sendTransaction
        console.log('🔍 Debug da transação:', {
          contractAddress,
          walletAddress: wallet?.account?.address,
          transaction: JSON.stringify(transaction, null, 2),
          totalRequired,
          validUntil: new Date(transaction.validUntil * 1000)
        });

        console.log('📤 Enviando transação TACT-compatível...');

        // ✅ Enviar transação
        const result = await Promise.race([
          tonConnectUI.sendTransaction(transaction),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: Transação demorou mais de 60s')), 60000)
          )
        ]) as { boc: string };

        console.log('✅ DirectPayment TACT executado com sucesso!');

        return {
          success: true,
          transactionHash: result.boc,
          totalAmount: amount,
          settlementsCount: 1,
        };

      } catch (error) {
        console.error('❌ Erro em executeDirectPayment TACT:', error);

        // ✅ Tratamento de erros MELHORADO com verificação específica
        let errorMessage = 'Erro desconhecido na transação';
        let suggestion = '';
        
        if (error instanceof Error) {
          if (error.message.includes('Unable to verify') || error.message.includes('verify transaction')) {
            errorMessage = 'Erro de verificação da transação. Verifique sua conexão e saldo de TON.';
            suggestion = 'Tente trocar de Wi-Fi para dados móveis ou vice-versa.';
          } else if (error.message.includes('User declined') || error.message.includes('cancelled')) {
            errorMessage = 'Transação cancelada pelo usuário';
          } else if (error.message.includes('Timeout')) {
            errorMessage = 'Timeout: Tente novamente';
          } else if (error.message.includes('Invalid address')) {
            errorMessage = 'Endereço inválido';
          } else if (error.message.includes('Insufficient funds')) {
            errorMessage = 'Saldo insuficiente';
            suggestion = 'Verifique se você tem TON suficiente na sua carteira';
          } else if (error.message.includes('Contract is paused')) {
            errorMessage = 'Contrato está pausado';
          } else if (error.message.includes('Amount too large')) {
            errorMessage = 'Valor muito alto (máximo 100 TON)';
          } else if (error.message.includes('Amount must be positive')) {
            errorMessage = 'Valor deve ser positivo';
          } else {
            errorMessage = error.message;
          }
        }

        return {
          success: false,
          error: errorMessage,
          suggestion
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, tonConnectUI, contractAddress, isValidTonAddress, createDirectPaymentPayload, checkSufficientBalance]
  );

  return {
    // Estados
    isConnected: !!wallet,
    walletAddress: wallet?.account?.address,
    isExecuting,
    
    // Ações
    executeBatchSettlement,
    executeDirectPayment,
    
    // Configuração
    contractAddress,
    
    // Utilitários
    toNano: (amount: string | number) => toNano(amount.toString()).toString(),
    isValidTonAddress,
    checkSufficientBalance, // ✅ Nova função exportada
  };
};