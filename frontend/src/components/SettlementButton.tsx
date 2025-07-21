import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle, 
  Wallet,
  Users,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useSettlements } from '../hooks/useSettlements';

interface SettlementButtonProps {
  groupId?: string;
  groupName?: string;
  onSettlementComplete?: () => void;
  className?: string;
}

export const SettlementButton: React.FC<SettlementButtonProps> = ({
  groupId,
  groupName,
  onSettlementComplete,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    settlements,
    isCalculating,
    isExecuting,
    error,
    isConnected,
    calculateSettlements,
    executeSettlements,
    clearSettlements,
    hasSettlements,
    totalAmount,
    settlementsCount
  } = useSettlements({
    groupId,
    onSuccess: (result) => {
      setSuccess(true);
      onSettlementComplete?.();
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2500);
    },
    onError: (error) => {
      console.error('Settlement error:', error);
    }
  });

  const handleOpenDialog = () => {
    setIsOpen(true);
    setSuccess(false);
    clearSettlements();
    calculateSettlements();
  };

  const formatTON = (amount: number) => {
    return (amount / 1e9).toFixed(4);
  };

  const getButtonText = () => {
    if (groupId && groupName) {
      return `Resolver ${groupName}`;
    }
    return 'Resolver Todas as Dívidas';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default"
          className={`gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}
          onClick={handleOpenDialog}
          disabled={!isConnected}
        >
          <Calculator className="h-4 w-4" />
          {getButtonText()}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            Settlement de Dívidas
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {groupId && groupName
              ? `Liquidar dívidas do grupo "${groupName}" de forma otimizada`
              : 'Algoritmo inteligente para otimizar pagamentos e liquidar todas as dívidas'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status da Carteira */}
          {!isConnected && (
            <Alert className="border-amber-200 bg-amber-50">
              <Wallet className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Conecte sua carteira TON para executar settlements
              </AlertDescription>
            </Alert>
          )}

          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sucesso */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✨ Settlement executado com sucesso! As transações foram processadas na blockchain TON.
              </AlertDescription>
            </Alert>
          )}

          {/* Loading Calculation */}
          {isCalculating && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600">Calculando settlements otimizados...</p>
                  <p className="text-xs text-gray-500">Analisando o grafo de dívidas</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settlements List */}
          {hasSettlements && !isCalculating && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Pagamentos necessários ({settlementsCount})
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Otimizado
                </Badge>
              </div>
              
              {/* Settlements */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {settlements.map((settlement, index) => (
                  <Card key={index} className="transition-colors hover:bg-gray-50">
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {settlement.fromName}
                          </div>
                          <div className="text-xs text-gray-500">
                            paga para {settlement.toName}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {formatTON(settlement.amount)} TON
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Summary */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total a transferir:</span>
                    <Badge variant="outline" className="font-mono text-sm">
                      {formatTON(totalAmount)} TON
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Em {settlementsCount} transação{settlementsCount > 1 ? 'ões' : ''}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* No Settlements */}
          {!hasSettlements && !isCalculating && !error && (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-medium text-gray-900 mb-1">
                  Nenhuma dívida para resolver!
                </p>
                <p className="text-sm text-gray-500">
                  Todas as contas estão quitadas
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isExecuting}
            className="flex-1"
          >
            Cancelar
          </Button>
          
          {hasSettlements && !success && isConnected && (
            <Button 
              onClick={executeSettlements}
              disabled={isExecuting}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white gap-2"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Executar Settlement
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
