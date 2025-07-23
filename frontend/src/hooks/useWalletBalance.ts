import { useQuery } from '@tanstack/react-query';

interface WalletBalance {
  address: string;
  balance: string;
  balanceInTon: number;
  lastUpdated: string;
}

const fetchWalletBalance = async (address: string): Promise<WalletBalance> => {
  // Em produção, usar o path correto do backend
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
  const url = API_BASE_URL ? `${API_BASE_URL}/wallet/balance/${address}` : `/api/wallet/balance/${address}`;
  
  console.log(`🔍 Buscando saldo para: ${address}`);
  console.log(`📡 URL da request: ${url}`);
  
  // AbortController para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`❌ Erro HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`Erro ao buscar saldo: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Dados do saldo recebidos:', data);
    
    return {
      address: data.address || address,
      balance: data.balance || '0',
      balanceInTon: data.balanceInTon || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Timeout na busca do saldo');
      throw new Error('Timeout ao buscar saldo da carteira');
    }
    
    console.error('❌ Erro na busca do saldo:', error);
    throw error;
  }
};

export const useWalletBalance = (address: string | null) => {
  return useQuery({
    queryKey: ['walletBalance', address],
    queryFn: () => fetchWalletBalance(address!),
    enabled: !!address,
    refetchInterval: 60000, // Reduzir para 1 minuto
    staleTime: 30000, // 30 segundos
    retry: 2, // Reduzir tentativas
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}; 