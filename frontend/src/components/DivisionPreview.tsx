import { Crown, DollarSign, Users } from 'lucide-react';

interface Participant {
  userId: string;
  userName: string;
  amountOwed: number;
}

interface DivisionPreviewProps {
  amount: number;
  participants: Participant[];
  payer: string;
  splitType: 'EQUAL' | 'CUSTOM';
}

export const DivisionPreview = ({ amount, participants, payer, splitType }: DivisionPreviewProps) => {
  const totalOwed = participants.reduce((sum, p) => sum + p.amountOwed, 0);
  const isValid = Math.abs(totalOwed - amount) < 0.01;

  return (
    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-primary" />
        <h4 className="font-medium">📊 Resumo da Divisão</h4>
      </div>
      
      <div className="space-y-2">
        {/* Pagador */}
        <div className="flex items-center gap-2 text-sm">
          <Crown className="w-4 h-4 text-yellow-500" />
          <span className="font-medium">{payer}</span>
          <span>paga</span>
          <span className="font-bold text-primary">R$ {amount.toFixed(2)}</span>
        </div>

        {/* Participantes */}
        {participants.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>Participantes ({participants.length}):</span>
            </div>
            {participants.map((participant) => (
              <div key={participant.userId} className="flex items-center gap-2 text-sm">
                <span className="text-red-500">💸</span>
                <span className="font-medium">{participant.userName}</span>
                <span>deve</span>
                <span className="font-bold text-red-600">R$ {participant.amountOwed.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Validação */}
        {!isValid && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            ⚠️ A soma dos valores ({totalOwed.toFixed(2)}) deve ser igual ao total ({amount.toFixed(2)})
          </div>
        )}

        {/* Tipo de divisão */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Tipo: <span className="font-medium">{splitType === 'EQUAL' ? 'Divisão Igual' : 'Valores Personalizados'}</span>
        </div>
      </div>
    </div>
  );
}; 