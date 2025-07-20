import { useState, useEffect } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';
import { apiService } from '@/lib/api';

interface User {
  id: string;
  tonWalletAddress: string;
  firstName: string;
  lastName?: string;
  username?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export const useWalletConnection = () => {
  const wallet = useTonWallet();
  const connected = !!wallet;
  const account = wallet?.account;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  // Buscar usuário quando a wallet conectar
  useEffect(() => {
    if (connected && account?.address) {
      fetchUser(account.address);
    } else {
      setUser(null);
    }
  }, [connected, account?.address]);

  const fetchUser = async (walletAddress: string) => {
    setIsLoading(true);
    try {
      const result = await apiService.findUserByWalletAddress(walletAddress);

      console.log('Resultado da busca de usuário:', result);

      if (result) {
        setUser(result);
        setShowRegistrationModal(false);
      } else {
        // Usuário não existe, mostrar modal de registro
        setUser(null);
        setShowRegistrationModal(true);
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      setUser(null);
      setShowRegistrationModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserCreated = (newUser: User) => {
    setUser(newUser);
    setShowRegistrationModal(false);
  };

  const handleRegistrationModalClose = () => {
    setShowRegistrationModal(false);
  };

  return {
    user,
    isLoading,
    connected,
    walletAddress: account?.address,
    showRegistrationModal,
    handleUserCreated,
    handleRegistrationModalClose,
    refetchUser: () => account?.address && fetchUser(account.address),
  };
}; 