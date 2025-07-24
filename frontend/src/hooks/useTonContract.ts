import { useState, useCallback, useMemo, useEffect } from 'react';
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
  note?: string;
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
      // Usar o backend para verificar saldo (mais confiável)
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/wallet/balance/${wallet.account.address}`);
      
      if (!response.ok) {
        console.warn('⚠️ Não foi possível verificar saldo, assumindo suficiente');
        return true; // Assumir que tem saldo se API falhar
      }
      
      const data = await response.json();
      const balanceInTON = data.balanceInTon || 0;
      
      console.log('💰 Verificação de saldo:', {
        balanceInTON,
        requiredAmount,
        sufficient: balanceInTON >= requiredAmount
      });
      
      return balanceInTON >= requiredAmount;
    } catch (error) {
      console.error('❌ Erro ao verificar saldo:', error);
      return true; // Assumir que tem saldo se houver erro
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

  // ✅ FUNÇÃO CORRIGIDA PARA DirectPayment - ESTRUTURA EXATA DO CONTRATO TACT
  const createDirectPaymentPayload = useCallback((to: string, amount: number, description: string): string => {
    try {
      console.log('🏗️ Criando payload DirectPayment CORRETO:', { to, amount, description });
      
      if (!isValidTonAddress(to)) {
        throw new Error(`Endereço inválido: ${to}`);
      }

      // ✅ Validar que o destinatário está correto
      if (!to.startsWith('0:') && !to.startsWith('EQ') && !to.startsWith('kQ')) {
        throw new Error(`Formato de endereço inválido: ${to}. Deve começar com 0:, EQ ou kQ`);
      }

      // ✅ ESTRUTURA EXATA DO CONTRATO TACT
      const cell = beginCell()
        .storeUint(0x04, 32)                    // DirectPayment opcode CORRETO
        .storeAddress(Address.parse(to))        // to: Address
        .storeCoins(toNano(amount))            // amount: Int (EM NANO TON!)
        .storeStringTail(description)          // groupId: String
        .endCell();
      
      const bocString = cell.toBoc().toString('base64');
      console.log('✅ Payload DirectPayment criado com opcode 0x04');
      
      // ✅ ADICIONAR DEBUG DO PAYLOAD
      console.log('🔍 Payload debug:', {
        opcode: '0x04 (DirectPayment)',
        to: to,
        amountTON: amount,
        amountNano: toNano(amount).toString(),
        description: description,
        payloadLength: bocString.length
      });
      
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

  // ✅ FUNÇÃO COMPLETAMENTE REESCRITA PARA TESTNET
  const executeDirectPayment = useCallback(
    async (to: string, amount: number, description = 'SplitON Payment'): Promise<ContractExecutionResult> => {
      if (!wallet) {
        return { success: false, error: 'Carteira TON não conectada' };
      }

      setIsExecuting(true);
      
      try {
        console.log('🚀 Iniciando DirectPayment (sem timeout):', { to, amount, description });

        // ✅ Validações básicas
        if (!to || !isValidTonAddress(to)) {
          throw new Error(`Endereço TON inválido: ${to}`);
        }

        if (amount <= 0 || amount > 100) {
          throw new Error('Valor deve estar entre 0.01 e 100 TON');
        }

        // ✅ ESTRATÉGIA 1: Tentar com contrato (SEM TIMEOUT)
        try {
          console.log('📋 ESTRATÉGIA 1: Usando contrato (sem timeout)');
          
          const contractFee = 0.01;
          const networkFeeMargin = 0.05;
          const totalRequired = amount + contractFee + networkFeeMargin;
          
          const hasSufficientBalance = await checkSufficientBalance(totalRequired);
          if (!hasSufficientBalance) {
            throw new Error(`Saldo insuficiente. Necessário: ${totalRequired} TON`);
          }

          const directPaymentPayload = createDirectPaymentPayload(to, amount, description);
          
          const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutos em vez de 5
            messages: [{
              address: contractAddress,
              amount: toNano(totalRequired).toString(),
              payload: directPaymentPayload
            }]
          };

          console.log('📤 Enviando via contrato (SEM TIMEOUT)...');
          
          // ✅ REMOVER TIMEOUT - deixar a carteira processar naturalmente
          const result = await tonConnectUI.sendTransaction(transaction) as { boc: string };
          
          console.log('✅ DirectPayment via contrato executado!');
          
          return {
            success: true,
            transactionHash: result.boc,
            totalAmount: amount,
            settlementsCount: 1,
            note: 'Pagamento via contrato'
          };

        } catch (contractError) {
          console.error('❌ Erro no contrato, tentando pagamento direto:', contractError);
          
          // ✅ ESTRATÉGIA 2: Fallback para pagamento direto
          console.log('🔄 ESTRATÉGIA 2: Pagamento direto (sem contrato)');
          
          const directTransaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutos
            messages: [{
              address: to,
              amount: toNano(amount + 0.01).toString(), // Amount + gas mínimo
              // Sem payload - transação TON simples
            }]
          };

          console.log('📤 Enviando pagamento direto (SEM TIMEOUT)...');
          const directResult = await tonConnectUI.sendTransaction(directTransaction) as { boc: string };
          
          console.log('✅ Pagamento direto executado!');
          
          return {
            success: true,
            transactionHash: directResult.boc,
            totalAmount: amount,
            settlementsCount: 1,
            note: 'Pagamento direto realizado (contrato falhou)'
          };
        }

      } catch (error) {
        console.error('❌ Erro completo em DirectPayment:', error);
        
        let errorMessage = 'Erro desconhecido na transação';
        let suggestion = '';
        
        if (error instanceof Error) {
          if (error.message.includes('User declined') || error.message.includes('cancelled')) {
            errorMessage = 'Transação cancelada pelo usuário';
          } else if (error.message.includes('Unable to verify') || error.message.includes('verify transaction')) {
            errorMessage = 'Erro de verificação da transação';
            suggestion = 'Tente trocar de Wi-Fi para dados móveis ou vice-versa';
          } else {
            errorMessage = error.message;
          }
        }

        return { 
          success: false, 
          error: errorMessage,
          suggestion: suggestion || 'Verifique sua conexão e tente novamente'
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, tonConnectUI, contractAddress, isValidTonAddress, createDirectPaymentPayload, checkSufficientBalance]
  );

  // ✅ ADICIONAR FUNÇÃO DE TESTE DIRETO
  const testDirectPayment = useCallback(
    async (to: string, amount: number): Promise<ContractExecutionResult> => {
      if (!wallet) {
        return { success: false, error: 'Carteira TON não conectada' };
      }

      setIsExecuting(true);
      
      try {
        console.log('🧪 TESTE: Pagamento direto simples');

        // ✅ Transação super simples para teste
        const testTransaction = {
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [{
            address: to,
            amount: toNano(amount).toString(),
          }]
        };

        console.log('🧪 Enviando transação de teste:', testTransaction);
        const result = await tonConnectUI.sendTransaction(testTransaction) as { boc: string };

        console.log('✅ Teste direto realizado!');
        
        return {
          success: true,
          transactionHash: result.boc,
          totalAmount: amount,
          settlementsCount: 1,
          note: 'Teste de pagamento direto'
        };

      } catch (error) {
        console.error('❌ Erro no teste direto:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro no teste',
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, tonConnectUI]
  );

  // ✅ VERIFICAR CONFIGURAÇÃO DE REDE
  useEffect(() => {
    if (wallet) {
      console.log('🔍 Configuração detalhada da carteira:', {
        address: wallet.account?.address,
        chain: wallet.account?.chain,
        publicKey: wallet.account?.publicKey,
        walletStateInit: wallet.account?.walletStateInit,
        contractIsTestnet: contractAddress.startsWith('kQ'),
        contractAddress
      });
    }
  }, [wallet, contractAddress]);

  return {
    // Estados
    isConnected: !!wallet,
    walletAddress: wallet?.account?.address,
    isExecuting,
    
    // Ações
    executeBatchSettlement,
    executeDirectPayment,
    testDirectPayment, // ✅ Nova função de teste
    
    // Configuração
    contractAddress,
    
    // Utilitários
    toNano: (amount: string | number) => toNano(amount.toString()).toString(),
    isValidTonAddress,
    checkSufficientBalance,
  };
};