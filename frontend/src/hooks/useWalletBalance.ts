import { useQuery } from '@tanstack/react-query';

interface WalletBalance {
  address: string;
  balance: string;
  balanceInTon: number;
  lastUpdated: string;
}

const fetchWalletBalance = async (address: string): Promise<WalletBalance> => {
  const response = await fetch(`/api/wallet/balance/${address}`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar saldo: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Dados do saldo recebidos:', data);
  
  // O backend retorna os dados diretamente, não em um wrapper
  return {
    address: data.address || address,
    balance: data.balance || '0',
    balanceInTon: data.balanceInTon || 0,
    lastUpdated: data.lastUpdated || new Date().toISOString(),
  };
};

export const useWalletBalance = (address: string | null) => {
  return useQuery({
    queryKey: ['walletBalance', address],
    queryFn: () => fetchWalletBalance(address!),
    enabled: !!address,
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 10000, // Considera dados frescos por 10 segundos
    retry: 3,
    retryDelay: 1000,
  });
}; 