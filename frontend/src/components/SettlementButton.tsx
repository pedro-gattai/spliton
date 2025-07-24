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
  AlertCircle, 
  CheckCircle, 
  Wallet,
  Users,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useSettlements } from '../hooks/useSettlements';

interface Settlement {
  from: string;
  to: string;
  amount: number;
  fromName: string;
  toName: string;
  fromAddress?: string;
  toAddress?: string;
  participantId?: string;
  expenseId?: string;
  expenseDescription?: string;
}

interface SettlementsData {
  settlements: Settlement[];
  totalAmount: number;
  settlementsCount: number;
  optimizationSaved?: number;
}

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
    isPayingIndividual,
    error,
    connected,
    calculateSettlements,
    executeAllSettlements,
    executeIndividualSettlement,
    clearSettlements,
    hasSettlements,
    totalAmount,
    settlementsCount
  } = useSettlements(
    groupId,
    (result: SettlementsData) => {
      console.log('Dívidas carregadas:', result);
    },
    (error: string) => {
      console.error('Erro no settlement:', error);
    }
  );

  const handleOpenDialog = () => {
    setIsOpen(true);
    setSuccess(false);
    clearSettlements();
    calculateSettlements();
  };

  const handlePayIndividual = async (settlement: Settlement) => {
    const result = await executeIndividualSettlement(settlement);
    if (result) {
      if (settlements.length === 0) {
        setSuccess(true);
        onSettlementComplete?.();
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 2000);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          type="button"
          variant="default"
          className={`gap-2 bg-gradient-to-r from-[#005A99] via-[#007ACC] to-[#0098EA] hover:from-[#004466] hover:to-[#007ACC] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}
          onClick={handleOpenDialog}
          disabled={!connected}
        >
          <Calculator className="h-4 w-4" />
          Ver Todas as Dívidas
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            Resolver Dívidas
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {groupId && groupName
              ? `Liquidar suas dívidas do grupo "${groupName}"`
              : 'Visualize e pague suas dívidas pendentes'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status da Carteira */}
          {!connected && (
            <Alert className="border-amber-200 bg-amber-50">
              <Wallet className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Conecte sua carteira TON para fazer pagamentos
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
                ✨ Pagamento(s) realizado(s) com sucesso!
              </AlertDescription>
            </Alert>
          )}

          {/* Loading Calculation */}
          {isCalculating && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600">Carregando suas dívidas...</p>
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
                    Suas dívidas ({settlementsCount})
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Total: {totalAmount.toFixed(2)} TON
                </Badge>
              </div>
              
              {/* Individual Debts */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {settlements.map((settlement, index) => (
                  <Card key={settlement.participantId || index} className="transition-colors hover:bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-sm font-medium text-gray-900">
                              Pagar para: {settlement.toName}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {settlement.amount.toFixed(2)} TON
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            Despesa: {settlement.expenseDescription || 'Sem descrição'}
                          </div>
                          {settlement.toAddress && (
                            <div className="text-xs text-gray-400 font-mono mt-1">
                              {settlement.toAddress.slice(0, 8)}...{settlement.toAddress.slice(-6)}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handlePayIndividual(settlement)}
                          disabled={!connected || isPayingIndividual === settlement.participantId}
                          className="ml-3 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isPayingIndividual === settlement.participantId ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              Pagando...
                            </>
                          ) : (
                            <>
                              <Wallet className="w-3 h-3 mr-1" />
                              Pagar
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Summary and Pay All Button */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-blue-900">
                        Total a pagar
                      </div>
                      <div className="text-xs text-blue-600">
                        {settlementsCount} dívida{settlementsCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-900">
                          {totalAmount.toFixed(2)} TON
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* No Settlements */}
          {!hasSettlements && !isCalculating && !error && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma dívida pendente!
                </h3>
                <p className="text-sm text-gray-600">
                  {groupId && groupName
                    ? `Você não tem dívidas pendentes no grupo "${groupName}".`
                    : 'Você não tem dívidas pendentes no momento.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button"
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
