import { useState, useRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Users, UserPlus, Trash2, Loader2, Search, User, Wallet, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserSearch } from "@/hooks/useUserSearch";
import { UserSearchResultItem } from "@/components/UserSearchResult";
import { type UserSearchResult } from "@/lib/api";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useGroups } from "@/hooks/useGroups";
import { useGroupBalances } from "@/hooks/useGroupBalances";

const groupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo"),
  description: z.string().optional(),
  type: z.enum(["travel", "home", "work", "friends", "other"]),
  currency: z.string().default("TON"),
  members: z.array(z.object({
    id: z.string().min(1, "ID do usuário é obrigatório"),
    firstName: z.string().min(1, "Nome é obrigatório"),
    lastName: z.string().optional(),
    username: z.string().optional(),
    tonWalletAddress: z.string().min(1, "Endereço da carteira é obrigatório"),
  })).min(1, "Adicione pelo menos um membro"),
});

type GroupFormData = z.infer<typeof groupSchema>;

const groupTypes = [
  { value: "travel", label: "Viagem", icon: "✈️" },
  { value: "home", label: "Casa/Apartamento", icon: "🏠" },
  { value: "work", label: "Trabalho", icon: "💼" },
  { value: "friends", label: "Amigos", icon: "👥" },
  { value: "other", label: "Outros", icon: "📋" },
];

interface NewGroupModalProps {
  children: React.ReactNode;
  onSubmit?: (data: { name: string; description?: string; userIds: string[] }) => Promise<void>;
  userId?: string;
}

export const NewGroupModal = ({ children, onSubmit, userId }: NewGroupModalProps) => {
  const [open, setOpen] = useState(false);
  const [searchIdentifier, setSearchIdentifier] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useWalletConnection();
  const { groups, loading: loadingGroups } = useGroups(user?.id);
  
  // Stabilize array reference to prevent unnecessary re-renders
  const selectedGroupIds = useMemo(() => 
    selectedGroup ? [selectedGroup.id] : [], 
    [selectedGroup?.id]
  );
  
  const { balances } = useGroupBalances(user?.id, selectedGroupIds);
  const { toast } = useToast();

  const { user: searchResult, isSearching, error: searchError, hasSearched, clearSearch } = useUserSearch(searchIdentifier);

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "friends",
      currency: "TON",
      members: [],
    },
  });

  const watchedMembers = form.watch("members");

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Show search results when typing - CORRIGIDO
  useEffect(() => {
    const shouldShow = searchIdentifier.length >= 3 && (isSearching || hasSearched);
    setShowSearchResults(shouldShow);
  }, [searchIdentifier, isSearching, hasSearched, searchResult]);

  // Validação de input melhorada
  const isValidInput = (input: string) => {
    const clean = input.trim();
    if (clean.startsWith('@')) return clean.length >= 4;
    if (clean.includes('@')) return clean.length >= 5; // Email
    if (clean.startsWith('EQ') || clean.startsWith('UQ')) return clean.length >= 20;
    return clean.length >= 3;
  };

  const handleSubmit = async (data: GroupFormData) => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não identificado. Faça login primeiro.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Extrair userIds dos membros
      const userIds = data.members.map(member => member.id);

      // Preparar dados para a API
      const apiData = {
        name: data.name,
        description: data.description || undefined,
        userIds,
      };

      await onSubmit?.(apiData);
      setOpen(false);
      form.reset();
      setSearchIdentifier("");
      clearSearch();
      
      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar grupo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMember = (user: UserSearchResult) => {
    const currentMembers = form.getValues("members");
    
    // Verificar se o membro já existe
    const memberExists = currentMembers.some(member => member.id === user.id);

    if (memberExists) {
      toast({
        title: "Usuário já adicionado",
        description: "Este usuário já está na lista de membros.",
        variant: "destructive",
      });
      return;
    }

    const newMember = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName || undefined,
      username: user.username || undefined,
      tonWalletAddress: user.tonWalletAddress,
    };

    form.setValue("members", [...currentMembers, newMember]);
    setSearchIdentifier("");
    clearSearch();
    setShowSearchResults(false);
    
    toast({
      title: "Membro adicionado",
      description: `${user.firstName} foi adicionado ao grupo.`,
    });
  };

  const removeMember = (index: number) => {
    const currentMembers = form.getValues("members");
    const updatedMembers = currentMembers.filter((_, i) => i !== index);
    form.setValue("members", updatedMembers);
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

  // Placeholder dinâmico melhorado
  const getPlaceholder = () => {
    if (searchIdentifier.startsWith('@')) return "Digite o username (ex: @joao123)";
    if (searchIdentifier.includes('@')) return "Digite o email (ex: joao@email.com)";
    if (searchIdentifier.startsWith('EQ') || searchIdentifier.startsWith('UQ')) return "Endereço TON detectado...";
    return "Digite @username, email ou endereço da carteira TON";
  };

  const getFullName = (member: any) => {
    return member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName;
  };

  const getMemberIdentifier = (member: any) => {
    if (member.username) {
      return `@${member.username}`;
    }
    const address = member.tonWalletAddress;
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

  const getMemberInitials = (member: any) => {
    const first = member.firstName.charAt(0).toUpperCase();
    const last = member.lastName ? member.lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Novo Grupo
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Nome do Grupo */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Grupo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Viagem para a Praia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo do Grupo */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo do Grupo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groupTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o propósito do grupo..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Adicionar Membros */}
            <div className="space-y-3">
              <FormLabel>Membros do Grupo</FormLabel>
              
              {/* Campo de busca */}
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

                {/* Resultados da busca - CORRIGIDO */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
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
                          onSelect={addMember}
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

              {/* Lista de Membros */}
              {watchedMembers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Membros selecionados ({watchedMembers.length}):
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {watchedMembers.map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {getMemberInitials(member)}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {getFullName(member)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {member.username ? (
                              <User className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Wallet className="w-3 h-3 text-green-500" />
                            )}
                            <span className="truncate">{getMemberIdentifier(member)}</span>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMember(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="members"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Moeda */}
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moeda Padrão</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TON">TON</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="BRL">BRL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resumo */}
            {watchedMembers.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="text-sm font-medium">Resumo:</p>
                <p className="text-xs text-muted-foreground">
                  O grupo será criado com {watchedMembers.length} membro(s)
                </p>
                <p className="text-xs text-muted-foreground">
                  Cada membro poderá adicionar despesas e visualizar o histórico
                </p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-ton-gradient text-white hover:bg-ton-gradient-dark"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Grupo"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 