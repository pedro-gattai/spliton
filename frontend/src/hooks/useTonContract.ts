import { useState, useCallback, useMemo } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

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
}

export const useTonContract = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [isExecuting, setIsExecuting] = useState(false);

  // Endereço do contrato configurado via .env
  const contractAddress = useMemo(
    () => import.meta.env.VITE_SPLIT_CONTRACT_ADDRESS || '',
    []
  );

  const toNano = (ton: string): string => {
    const amount = parseFloat(ton);
    if (isNaN(amount)) throw new Error('Invalid amount');
    return Math.floor(amount * 1_000_000_000).toString(); // 1 TON = 1e9 nanoTON
  };

  const isValidTonAddress = (address: string): boolean => {
    // TON addresses podem ser base64 (EQ..., UQ..., kQ...) ou raw (0:...)
    const base64Pattern = /^(EQ|UQ|kQ)[A-Za-z0-9_-]{46}$/;
    const rawPattern = /^0:[a-fA-F0-9]{64}$/;
    return base64Pattern.test(address) || rawPattern.test(address);
  };

  // Função para executar BatchSettlement
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

        // Prepara mensagens para cada settlement
        let totalAmount = 0;
        const messages = settlements.map(settlement => {
          const amountTON = Number(settlement.amount);
          if (isNaN(amountTON) || amountTON <= 0) {
            throw new Error(`Valor inválido: ${settlement.amount}`);
          }

          if (!isValidTonAddress(settlement.to)) {
            throw new Error(`Endereço TON inválido: ${settlement.to}`);
          }
          
          totalAmount += amountTON;
          
          return {
            address: settlement.to, // Enviar diretamente para o destinatário
            amount: toNano(amountTON.toString()),
            // ✅ Payload simples para comentário (opcional)
            payload: groupId ? 
              btoa(`SplitON Settlement - Group: ${groupId}`) : 
              btoa('SplitON Settlement')
          };
        });

        // ✅ Transação simples do TON Connect
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutos
          messages
        };

        console.log('🚀 Executando settlement:', {
          settlements: settlements.length,
          totalAmount,
          groupId
        });

        // Enviar para carteira assinar
        const result = await tonConnectUI.sendTransaction(transaction);

        console.log('✅ Settlement executado:', result);

        return {
          success: true,
          transactionHash: result.boc,
          totalAmount,
          settlementsCount: settlements.length,
        };

      } catch (error) {
        console.error('❌ Erro ao executar BatchSettlement:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido na transação'
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, tonConnectUI, contractAddress]
  );

  // Função para executar DirectPayment (pagamento direto)
  const executeDirectPayment = useCallback(
    async (to: string, amount: number, description?: string): Promise<ContractExecutionResult> => {
      if (!wallet) {
        return {
          success: false,
          error: 'Carteira TON não conectada'
        };
      }
      console.log('🚀 Executando pagamento direto:', { to, amount, description });

      setIsExecuting(true);
      try {
        if (!isValidTonAddress(to)) {
          throw new Error('Endereço TON de destino inválido');
        }

        const amountNano = toNano(amount.toString());
        
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [
            {
              address: to,
              amount: amountNano,
              payload: description ? 
                btoa(`SplitON Payment: ${description}`) : 
                btoa('SplitON Payment')
            }
          ]
        };

        console.log('🚀 Executando pagamento direto:', { to, amount, description });

        const result = await tonConnectUI.sendTransaction(transaction);

        console.log('✅ Pagamento executado:', result);

        return {
          success: true,
          transactionHash: result.boc,
          totalAmount: amount,
          settlementsCount: 1,
        };

      } catch (error) {
        console.error('❌ Erro ao executar DirectPayment:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido na transação'
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, tonConnectUI]
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
    toNano,
    isValidTonAddress,
  };
};