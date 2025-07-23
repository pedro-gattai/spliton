import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api';

export const useUsernameCheck = (username: string) => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  const checkUsername = useCallback(async (checkUsername: string) => {
    if (!checkUsername || checkUsername.length < 3) {
      setIsAvailable(null);
      setError(null);
      setMessage('');
      setIsChecking(false);
      return;
    }

    // Validar formato do username
    if (!/^[a-zA-Z0-9]+$/.test(checkUsername)) {
      setIsAvailable(false);
      setError('Username deve conter apenas letras e números');
      setMessage('Username deve conter apenas letras e números');
      setIsChecking(false);
      return;
    }

    if (checkUsername.length > 20) {
      setIsAvailable(false);
      setError('Username deve ter no máximo 20 caracteres');
      setMessage('Username deve ter no máximo 20 caracteres');
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      console.log(`🔍 Verificando username: "${checkUsername}"`);
      const result = await apiService.checkUsername(checkUsername);
      
      setIsAvailable(result.available);
      setMessage(result.message);
      
      console.log('📊 Resultado da verificação:', result);
    } catch (err) {
      console.error('❌ Erro ao verificar username:', err);
      setError('Erro ao verificar username');
      setIsAvailable(false);
      setMessage('Erro ao verificar username');
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkUsername(username);
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [username, checkUsername]);

  const clearCheck = useCallback(() => {
    setIsAvailable(null);
    setError(null);
    setIsChecking(false);
    setMessage('');
  }, []);

  return {
    isAvailable,
    isChecking,
    error,
    message,
    clearCheck,
  };
}; 