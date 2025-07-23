import { useState, useRef, useEffect } from "react";
import { Checkbox } from "./ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Wallet, Mail, Search, X, Plus } from "lucide-react";
import { useUserSearch } from "@/hooks/useUserSearch";
import { UserSearchResultItem } from "./UserSearchResult";
import { type UserSearchResult } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface GroupMember {
  user: {
    id: string;
    firstName: string;
    lastName?: string | null;
    username?: string | null;
    email?: string | null;
    tonWalletAddress: string;
  };
  balance?: number;
}

interface ParticipantSelectorProps {
  members: GroupMember[];
  selected: Array<{ userId: string; amountOwed: string }>;
  onToggle: (userId: string) => void;
  onAmountChange: (userId: string, amount: string) => void;
  onAddExternalUser?: (user: UserSearchResult) => void;
  splitType: 'EQUAL' | 'CUSTOM';
  showAvatars?: boolean;
  showBalance?: boolean;
  allowExternalUsers?: boolean;
}

export const ParticipantSelector = ({
  members,
  selected,
  onToggle,
  onAmountChange,
  onAddExternalUser,
  splitType,
  showAvatars = true,
  showBalance = true,
  allowExternalUsers = false,
}: ParticipantSelectorProps) => {
  const [searchIdentifier, setSearchIdentifier] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showExternalSearch, setShowExternalSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { user: searchResult, isSearching, error: searchError, hasSearched, clearSearch } = useUserSearch(searchIdentifier);

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
    if (member.user.email) {
      return member.user.email;
    }
    const address = member.user.tonWalletAddress;
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  const getIdentifierIcon = (member: GroupMember) => {
    if (member.user.username) {
      return <User className="w-3 h-3 text-blue-500" />;
    }
    if (member.user.email) {
      return <Mail className="w-3 h-3 text-purple-500" />;
    }
    return <Wallet className="w-3 h-3 text-green-500" />;
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

  // Validação de input melhorada
  const isValidInput = (input: string) => {
    const clean = input.trim();
    if (clean.startsWith('@')) return clean.length >= 4;
    if (clean.includes('@')) return clean.length >= 5; // Email
    if (clean.startsWith('EQ') || clean.startsWith('UQ')) return clean.length >= 20;
    return clean.length >= 3;
  };

  // Show search results when typing
  useEffect(() => {
    const shouldShow = searchIdentifier.length >= 3 && (isSearching || hasSearched);
    setShowSearchResults(shouldShow);
  }, [searchIdentifier, isSearching, hasSearched, searchResult]);

  const handleAddExternalUser = (user: UserSearchResult) => {
    if (onAddExternalUser) {
      onAddExternalUser(user);
      setSearchIdentifier("");
      clearSearch();
      setShowSearchResults(false);
      setShowExternalSearch(false);
      
      toast({
        title: "Usuário adicionado",
        description: `${user.firstName} foi adicionado como participante externo.`,
      });
    }
  };

  const getSearchIcon = () => {
    if (searchIdentifier.startsWith('@')) {
      return <User className="w-4 h-4 text-blue-500" />;
    }
    if (searchIdentifier.includes('@')) {
      return <Mail className="w-4 h-4 text-purple-500" />;
    }
    if (searchIdentifier.startsWith('EQ') || searchIdentifier.startsWith('UQ')) {
      return <Wallet className="w-4 h-4 text-green-500" />;
    }
    return <Search className="w-4 h-4 text-muted-foreground" />;
  };

  const getPlaceholder = () => {
    if (searchIdentifier.startsWith('@')) return "Digite o username (ex: @joao123)";
    if (searchIdentifier.includes('@')) return "Digite o email (ex: joao@email.com)";
    if (searchIdentifier.startsWith('EQ') || searchIdentifier.startsWith('UQ')) return "Endereço TON detectado...";
    return "Digite @username, email ou endereço da carteira TON";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          👥 Participantes ({selected.length}/{members.length} selecionados)
        </span>
        {allowExternalUsers && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowExternalSearch(!showExternalSearch)}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Adicionar Externo
          </Button>
        )}
      </div>

      {/* Busca de usuários externos */}
      {showExternalSearch && allowExternalUsers && (
        <div className="space-y-2 p-3 border border-dashed border-border rounded-lg">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            🔍 Buscar usuário externo
          </div>
          
          <div className="relative">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {getSearchIcon()}
              </div>
              <Input
                ref={searchInputRef}
                placeholder={getPlaceholder()}
                value={searchIdentifier}
                onChange={(e) => setSearchIdentifier(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchIdentifier && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => {
                    setSearchIdentifier("");
                    clearSearch();
                    setShowSearchResults(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Dica de busca */}
            {searchIdentifier.length > 0 && searchIdentifier.length < 3 && (
              <p className="text-xs text-muted-foreground mt-1">
                Digite pelo menos 3 caracteres para buscar
              </p>
            )}

            {/* Resultados da busca */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Buscando usuário...</p>
                  </div>
                ) : searchError ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-destructive">Erro ao buscar usuário</p>
                  </div>
                ) : searchResult ? (
                  <div className="p-2">
                    <UserSearchResultItem
                      user={searchResult}
                      onSelect={handleAddExternalUser}
                    />
                  </div>
                ) : hasSearched ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
      
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
                    {getIdentifierIcon(member)}
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