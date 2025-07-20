import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma data de forma segura, retornando uma string legível
 * ou "Data não disponível" se a data for inválida
 */
export function formatDateSafely(dateValue: any, options?: {
  addSuffix?: boolean;
  locale?: any;
}): string {
  try {
    if (!dateValue) {
      return "Data não disponível";
    }

    // Se já é uma string válida de data
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return "Data não disponível";
      }
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: ptBR,
        ...options
      });
    }

    // Se é um objeto Date
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) {
        return "Data não disponível";
      }
      return formatDistanceToNow(dateValue, {
        addSuffix: true,
        locale: ptBR,
        ...options
      });
    }

    // Se é um objeto com propriedades de data (como do Prisma)
    if (typeof dateValue === 'object' && dateValue !== null) {
      // Verificar se tem propriedades de data
      if (dateValue.createdAt || dateValue.updatedAt) {
        const dateToUse = dateValue.createdAt || dateValue.updatedAt;
        return formatDateSafely(dateToUse, options);
      }
    }

    return "Data não disponível";
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Valor:', dateValue);
    return "Data não disponível";
  }
}
