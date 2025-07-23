import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Calendar, 
  Copy, 
  CheckCircle, 
  Clock,
  User,
  Wallet,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { BottomNavigation } from "@/components/BottomNavigation";

interface GroupMember {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  isActive: boolean;
  user: {
    id: string;
    username: string;
    email: string | null;
    tonWalletAddress: string;
  };
}

interface GroupExpense {
  id: string;
  description: string | null;
  amount: number;
  category: string | null;
  createdAt: string;
  payer: {
    id: string;
    username: string | null;
  };
  participants: Array<{
    id: string;
    userId: string;
    amountOwed: number;
    isSettled: boolean;
    user: {
      id: string;
      username: string | null;
    };
  }>;
}

interface GroupDetails {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
  creator: {
    id: string;
    username: string;
    email: string | null;
  };
}

export const GroupDetails = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useWalletConnection();
  
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);

  useEffect(() => {
    if (groupId) {
      loadGroupDetails();
      loadGroupExpenses();
    }
  }, [groupId]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const groupData = await apiService.getGroupById(groupId!);
      setGroup(groupData);
    } catch (err) {
      console.error('Erro ao carregar detalhes do grupo:', err);
      setError('Erro ao carregar detalhes do grupo');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupExpenses = async () => {
    try {
      const expensesData = await apiService.getExpenses(groupId!);
      setExpenses(expensesData);
    } catch (err) {
      console.error('Erro ao carregar despesas do grupo:', err);
    }
  };

  const copyInviteCode = async () => {
    if (group?.inviteCode) {
      try {
        await navigator.clipboard.writeText(group.inviteCode);
        setCopiedInviteCode(true);
        toast({
          title: "Código copiado!",
          description: "Código de convite copiado para a área de transferência.",
        });
        setTimeout(() => setCopiedInviteCode(false), 2000);
      } catch (err) {
        toast({
          title: "Erro",
          description: "Não foi possível copiar o código.",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} TON`;
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'ADMIN' ? 'default' : 'secondary';
  };

  const getSettlementStatus = (expense: GroupExpense) => {
    const totalParticipants = expense.participants.length;
    const settledParticipants = expense.participants.filter(p => p.isSettled).length;
    
    if (settledParticipants === 0) return { status: 'pending', text: 'Pendente' };
    if (settledParticipants === totalParticipants) return { status: 'settled', text: 'Liquidado' };
    return { status: 'partial', text: 'Parcial' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="font-semibold mb-2">Erro ao carregar grupo</h3>
            <p className="text-muted-foreground mb-4">{error || 'Grupo não encontrado'}</p>
            <Button onClick={() => navigate('/groups')} variant="outline">
              Voltar aos Grupos
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/groups')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
          </div>
        </div>

        {/* Group Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Informações do Grupo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Criado por</p>
                <p className="font-medium">@{group.creator.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de criação</p>
                <p className="font-medium">{formatDate(group.createdAt)}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Código de convite</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {group.inviteCode}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyInviteCode}
                  className="flex items-center gap-1"
                >
                  {copiedInviteCode ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {group.members.length}
              </div>
              <div className="text-xs text-muted-foreground">Membros</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {expenses.length}
              </div>
              <div className="text-xs text-muted-foreground">Despesas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(expenses.reduce((total, exp) => total + exp.amount, 0))}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Members */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Membros ({group.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {member.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">@{member.user.username}</div>
                      <div className="text-xs text-muted-foreground">
                        Entrou em {formatDate(member.joinedAt)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role === 'ADMIN' ? 'Admin' : 'Membro'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Despesas ({expenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma despesa ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => {
                  const settlementStatus = getSettlementStatus(expense);
                  return (
                    <div
                      key={expense.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {expense.description || 'Sem descrição'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                         <div className="flex items-center gap-1">
                               <User className="w-3 h-3" />
                               Pago por @{expense.payer.username || 'usuário'}
                             </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(expense.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {formatCurrency(expense.amount)}
                          </div>
                          <Badge 
                            variant={
                              settlementStatus.status === 'settled' ? 'secondary' :
                              settlementStatus.status === 'partial' ? 'outline' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {settlementStatus.text}
                          </Badge>
                        </div>
                      </div>
                      
                      {expense.category && (
                        <div className="text-xs text-muted-foreground">
                          Categoria: {expense.category}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        {expense.participants.length} participantes
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <BottomNavigation />
    </div>
  );
}; 