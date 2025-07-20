import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { User, Wallet } from "lucide-react";

interface GroupMember {
  user: {
    id: string;
    firstName: string;
    lastName?: string | null;
    username?: string | null;
    tonWalletAddress: string;
  };
  balance?: number;
}

interface ParticipantSelectorProps {
  members: GroupMember[];
  selected: Array<{ userId: string; amountOwed: string }>;
  onToggle: (userId: string) => void;
  onAmountChange: (userId: string, amount: string) => void;
  splitType: 'EQUAL' | 'CUSTOM';
  showAvatars?: boolean;
  showBalance?: boolean;
}

export const ParticipantSelector = ({
  members,
  selected,
  onToggle,
  onAmountChange,
  splitType,
  showAvatars = true,
  showBalance = true,
}: ParticipantSelectorProps) => {
  const getInitials = (firstName: string, lastName?: string | null) => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  const getFullName = (member: GroupMember) => {
    return member.user.lastName 
      ? `${member.user.firstName} ${member.user.lastName}` 
      : member.user.firstName;
  };

  const getIdentifier = (member: GroupMember) => {
    if (member.user.username) {
      return `@${member.user.username}`;
    }
    const address = member.user.tonWalletAddress;
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  const getBalanceColor = (balance?: number) => {
    if (!balance) return 'text-muted-foreground';
    return balance > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getBalanceText = (balance?: number) => {
    if (!balance) return 'Saldo: R$ 0,00';
    return `Saldo: ${balance > 0 ? '+' : ''}R$ ${balance.toFixed(2)}`;
  };

  const isSelected = (userId: string) => {
    return selected.some(p => p.userId === userId);
  };

  const getSelectedAmount = (userId: string) => {
    const participant = selected.find(p => p.userId === userId);
    return participant ? participant.amountOwed.toString() : '0';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          👥 Participantes ({selected.length}/{members.length} selecionados)
        </span>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {members.map((member) => {
          const selected = isSelected(member.user.id);
          
          return (
            <div
              key={member.user.id}
              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggle(member.user.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                
                {showAvatars && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {getInitials(member.user.firstName, member.user.lastName)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {getFullName(member)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {member.user.username ? (
                      <User className="w-3 h-3 text-blue-500" />
                    ) : (
                      <Wallet className="w-3 h-3 text-green-500" />
                    )}
                    <span className="truncate">{getIdentifier(member)}</span>
                  </div>
                  {showBalance && (
                    <div className={`text-xs ${getBalanceColor(member.balance)}`}>
                      {getBalanceText(member.balance)}
                    </div>
                  )}
                </div>
              </div>

              {splitType === 'CUSTOM' && selected && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-20 h-8 text-sm"
                    value={getSelectedAmount(member.user.id)}
                    onChange={(e) => onAmountChange(member.user.id, e.target.value)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 