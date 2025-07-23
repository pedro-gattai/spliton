import { User, Wallet, Mail } from 'lucide-react';
import { type UserSearchResult } from '@/lib/api';

interface UserSearchResultItemProps {
  user: UserSearchResult;
  onSelect: (user: UserSearchResult) => void;
  isSelected?: boolean;
}

export const UserSearchResultItem = ({ user, onSelect, isSelected = false }: UserSearchResultItemProps) => {
  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  const getIdentifier = () => {
    if (user.username) {
      return `@${user.username}`;
    }
    if (user.email) {
      return user.email;
    }
    // Show wallet address preview (first 8 + "..." + last 8)
    const address = user.tonWalletAddress;
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  const getIdentifierIcon = () => {
    if (user.username) {
      return <User className="w-3 h-3 text-blue-500" />;
    }
    if (user.email) {
      return <Mail className="w-3 h-3 text-purple-500" />;
    }
    return <Wallet className="w-3 h-3 text-green-500" />;
  };

  const getFullName = () => {
    return `@${user.username}`;
  };

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent hover:border-primary ${
        isSelected ? 'bg-accent border-primary' : 'border-border'
      }`}
      onClick={() => onSelect(user)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(user);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Selecionar ${getFullName()}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
          {getInitials(user.username)}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {getFullName()}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {getIdentifierIcon()}
            <span className="truncate">{getIdentifier()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 