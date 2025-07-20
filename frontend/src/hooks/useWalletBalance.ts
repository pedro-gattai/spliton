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
  
  return response.json();
};

export const useWalletBalance = (address: string | null) => {
  return useQuery({
    queryKey: ['walletBalance', address],
    queryFn: () => fetchWalletBalance(address!),
    enabled: !!address,
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 10000, // Considera dados frescos por 10 segundos
  });
}; 