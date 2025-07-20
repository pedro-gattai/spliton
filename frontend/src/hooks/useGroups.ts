import { useState, useEffect, useCallback } from 'react';
import { apiService, type Group, type CreateGroupRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useGroups = (userId?: string) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar grupos do usuário
  const fetchGroups = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const userGroups = await apiService.getUserGroups(userId);
      setGroups(userGroups);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar grupos';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Criar novo grupo
  const createGroup = useCallback(async (groupData: Omit<CreateGroupRequest, 'createdBy'>) => {
    if (!userId) {
      throw new Error('Usuário não identificado');
    }

    setLoading(true);
    setError(null);

    try {
      const newGroup = await apiService.createGroup({
        ...groupData,
        createdBy: userId,
      });

      setGroups(prev => [newGroup, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso!",
      });

      return newGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar grupo';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  // Buscar grupo por ID
  const getGroupById = useCallback(async (groupId: string) => {
    try {
      return await apiService.getGroupById(groupId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar grupo';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Validar convite
  const validateInvite = useCallback(async (token: string) => {
    try {
      return await apiService.validateInvite(token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao validar convite';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  // Aceitar convite
  const acceptInvite = useCallback(async (token: string) => {
    if (!userId) {
      throw new Error('Usuário não identificado');
    }

    try {
      const group = await apiService.acceptInvite(token, userId);
      setGroups(prev => [group, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Convite aceito com sucesso!",
      });

      return group;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aceitar convite';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [userId, toast]);

  // Buscar grupos quando userId mudar
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    createGroup,
    getGroupById,
    validateInvite,
    acceptInvite,
    refetch: fetchGroups,
  };
}; 