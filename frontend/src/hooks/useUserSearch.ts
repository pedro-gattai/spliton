import { useState, useEffect, useCallback } from 'react';
import { apiService, type UserSearchResult } from '@/lib/api';

export const useUserSearch = (identifier: string) => {
  const [user, setUser] = useState<UserSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchUser = useCallback(async (searchIdentifier: string) => {
    if (!searchIdentifier || searchIdentifier.length < 3) {
      setUser(null);
      setError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const result = await apiService.searchUser(searchIdentifier);
      setUser(result);
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      setError('Erro ao buscar usuário');
      setUser(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUser(identifier);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [identifier, searchUser]);

  const clearSearch = useCallback(() => {
    setUser(null);
    setError(null);
    setIsSearching(false);
  }, []);

  return {
    user,
    isLoading,
    error,
    isSearching,
    clearSearch,
  };
}; 