import { useState, useEffect, useCallback } from 'react';
import { apiService, type UserSearchResult } from '@/lib/api';

export const useUserSearch = (identifier: string) => {
  const [user, setUser] = useState<UserSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchUser = useCallback(async (searchIdentifier: string) => {
    if (!searchIdentifier || searchIdentifier.length < 3) {
      setUser(null);
      setError(null);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(false);

    try {
      console.log(`🔍 Buscando usuário por: "${searchIdentifier}"`);
      const result = await apiService.searchUser(searchIdentifier);
      setUser(result);
      setHasSearched(true);
      console.log('📊 Resultado da busca:', result);
    } catch (err) {
      console.error('❌ Erro ao buscar usuário:', err);
      setError('Erro ao buscar usuário');
      setUser(null);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUser(identifier);
    }, 300); // Reduzido de 500ms para 300ms

    return () => clearTimeout(timeoutId);
  }, [identifier, searchUser]);

  const clearSearch = useCallback(() => {
    setUser(null);
    setError(null);
    setIsSearching(false);
    setHasSearched(false);
  }, []);

  return {
    user,
    isLoading,
    error,
    isSearching,
    hasSearched,
    clearSearch,
  };
};

export const useUserSearchMultiple = (query: string, limit: number = 10) => {
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setUsers([]);
      setError(null);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(false);

    try {
      console.log(`🔍 Buscando múltiplos usuários por: "${searchQuery}"`);
      const results = await apiService.searchUsers(searchQuery, limit);
      setUsers(results);
      setHasSearched(true);
      console.log('📊 Resultados da busca:', results);
    } catch (err) {
      console.error('❌ Erro ao buscar usuários:', err);
      setError('Erro ao buscar usuários');
      setUsers([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, [limit]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchUsers]);

  const clearSearch = useCallback(() => {
    setUsers([]);
    setError(null);
    setIsSearching(false);
    setHasSearched(false);
  }, []);

  return {
    users,
    isLoading,
    error,
    isSearching,
    hasSearched,
    clearSearch,
  };
}; 