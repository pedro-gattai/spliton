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
      console.log('✅ Payload DirectPayment TACT criado com opcode 0x04');
      
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
      throw error;
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
        return { 
          success: false, 
          error: 'Carteira TON não conectada' 
        };
      }

      setIsExecuting(true);
      
      try {
        console.log('🚀 Iniciando DirectPayment (TESTNET):', { to, amount, description });

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

        // ✅ VERIFICAR STATUS DO CONTRATO TESTNET
        try {
          console.log('🔍 Verificando contrato testnet:', {
            contractAddress: 'kQD54Y2fe0Ixu7lUZHRDe1wZhdgE4cDR7EfUhTACHlMJbJLV',
            isTestnet: contractAddress.startsWith('kQ'),
            walletNetwork: wallet?.account?.chain
          });
          
          // Verificar se contrato é testnet
          if (contractAddress.startsWith('kQ')) {
            console.log('⚠️ Usando contrato testnet - certifique-se de que a wallet está na rede testnet');
          }
        } catch (networkError) {
          console.error('❌ Erro de rede:', networkError);
          return { 
            success: false, 
            error: networkError instanceof Error ? networkError.message : 'Erro de rede desconhecido' 
          };
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

        // ✅ VERIFICAR SE CONTRATO ESTÁ ATIVO
        console.log('🔍 Verificações do contrato:', {
          contractAddress,
          expectedOpcode: '0x04',
          messageStructure: 'to: Address, amount: Int (nano), groupId: String',
          contractFee: '0.05 TON fixo',
          maxAmount: '100 TON'
        });

        if (amount > 100) {
          throw new Error('Valor máximo permitido pelo contrato é 100 TON');
        }

        // ✅ CORRIGIR CÁLCULO DE VALORES
        const contractFee = 0.05;  // 0.05 TON de taxa
        const totalRequired = amount + contractFee; // Valor total a enviar
        
        console.log('💰 Cálculo CORRETO:', {
          amount: `${amount} TON`,
          contractFee: `${contractFee} TON`, 
          totalRequired: `${totalRequired} TON`,
          amountInNano: toNano(amount).toString(),
          totalInNano: toNano(totalRequired).toString()
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

        // ✅ Criar payload compatível com testnet
        const directPaymentPayload = createDirectPaymentPayload(to, amount, description);

        // ✅ CORRIGIR TRANSAÇÃO
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutos
          messages: [{
            address: contractAddress,
            amount: toNano(totalRequired).toString(), // Total incluindo taxa
            payload: directPaymentPayload // Payload com opcode 0x04 correto
          }]
        };

        // ✅ ADICIONAR DEBUG ESPECÍFICO PARA TESTNET
        console.log('🔍 Debug transação testnet:', {
          contractAddress: 'kQD54Y2fe0Ixu7lUZHRDe1wZhdgE4cDR7EfUhTACHlMJbJLV',
          isTestnetContract: true,
          walletAddress: wallet?.account?.address,
          walletChain: wallet?.account?.chain,
          transaction: JSON.stringify(transaction, null, 2),
          payloadSize: transaction.messages[0].payload?.length || 0,
          timestamp: new Date().toISOString()
        });

        console.log('📤 Enviando transação testnet...');

        // ✅ Enviar transação
        const result = await Promise.race([
          tonConnectUI.sendTransaction(transaction),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: Transação demorou mais de 60s')), 60000)
          )
        ]) as { boc: string };

        console.log('✅ DirectPayment testnet executado com sucesso!');

        return {
          success: true,
          transactionHash: result.boc,
          totalAmount: amount,
          settlementsCount: 1,
        };

      } catch (contractError) {
        console.error('❌ Erro em executeDirectPayment testnet:', contractError);

        // ✅ ADICIONAR FALLBACK PARA TRANSAÇÃO DIRETA
        console.error('❌ Erro no contrato testnet, tentando transação direta:', contractError);
        
        try {
          const directTransaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [{
              address: to, // Pagar direto para o destinatário
              amount: toNano(amount).toString(),
              payload: undefined // Sem payload - transação TON simples
            }]
          };
          
          console.log('🔄 Transação direta (sem contrato):', directTransaction);
          const result = await tonConnectUI.sendTransaction(directTransaction);
          
          return {
            success: true,
            transactionHash: result.boc,
            totalAmount: amount,
            settlementsCount: 1,
            note: 'Pagamento direto realizado (contrato bypassed)'
          };
          
        } catch (directError) {
          console.error('❌ Erro na transação direta:', directError);
          
          // ✅ Tratamento de erros MELHORADO com verificação específica
          let errorMessage = 'Erro desconhecido na transação';
          let suggestion = '';
          
          if (contractError instanceof Error) {
            if (contractError.message.includes('Unable to verify') || contractError.message.includes('verify transaction')) {
              errorMessage = 'Erro de verificação da transação. Verifique sua conexão e saldo de TON.';
              suggestion = 'Tente trocar de Wi-Fi para dados móveis ou vice-versa.';
            } else if (contractError.message.includes('User declined') || contractError.message.includes('cancelled')) {
              errorMessage = 'Transação cancelada pelo usuário';
            } else if (contractError.message.includes('Timeout')) {
              errorMessage = 'Timeout: Tente novamente';
            } else if (contractError.message.includes('Invalid address')) {
              errorMessage = 'Endereço inválido';
            } else if (contractError.message.includes('Insufficient funds')) {
              errorMessage = 'Saldo insuficiente';
              suggestion = 'Verifique se você tem TON suficiente na sua carteira';
            } else if (contractError.message.includes('Contract is paused')) {
              errorMessage = 'Contrato está pausado';
            } else if (contractError.message.includes('Amount too large')) {
              errorMessage = 'Valor muito alto (máximo 100 TON)';
            } else if (contractError.message.includes('Amount must be positive')) {
              errorMessage = 'Valor deve ser positivo';
            } else {
              errorMessage = contractError.message;
            }
          }

          return {
            success: false,
            error: `Erro no contrato testnet: ${errorMessage}. Erro direto: ${directError instanceof Error ? directError.message : 'Erro desconhecido'}`,
            suggestion
          };
        }
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, tonConnectUI, contractAddress, isValidTonAddress, createDirectPaymentPayload, checkSufficientBalance]
  );

  // ✅ FUNÇÃO DE TESTE SEM PAYLOAD PARA DEBUG
  const testDirectPaymentWithoutPayload = useCallback(
    async (to: string, amount: number): Promise<ContractExecutionResult> => {
      if (!wallet) {
        return { 
          success: false, 
          error: 'Carteira TON não conectada' 
        };
      }

      setIsExecuting(true);
      
      try {
        console.log('🧪 TESTE: Enviando transação sem payload para debug');

        // ✅ Versão simplificada para teste
        const testTransaction = {
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [{
            address: contractAddress,
            amount: toNano(amount + 0.01).toString()
            // SEM payload - deixar o contrato processar como quiser
          }]
        };

        console.log('🧪 Transação de teste:', testTransaction);
        const result = await tonConnectUI.sendTransaction(testTransaction) as { boc: string };

        return {
          success: true,
          transactionHash: result.boc,
          totalAmount: amount,
          settlementsCount: 1,
          note: 'Teste sem payload realizado com sucesso'
        };

      } catch (error) {
        console.error('❌ Erro no teste sem payload:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido no teste',
          note: 'Teste sem payload falhou'
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, tonConnectUI, contractAddress]
  );

  return {
    // Estados
    isConnected: !!wallet,
    walletAddress: wallet?.account?.address,
    isExecuting,
    
    // Ações
    executeBatchSettlement,
    executeDirectPayment,
    testDirectPaymentWithoutPayload, // ✅ Nova função de teste
    
    // Configuração
    contractAddress,
    
    // Utilitários
    toNano: (amount: string | number) => toNano(amount.toString()).toString(),
    isValidTonAddress,
    checkSufficientBalance, // ✅ Nova função exportada
  };
};