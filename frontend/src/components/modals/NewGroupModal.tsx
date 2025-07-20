import { useState } from "react";
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
import { Plus, X, Users, UserPlus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const groupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo"),
  description: z.string().optional(),
  type: z.enum(["travel", "home", "work", "friends", "other"]),
  currency: z.string().default("TON"),
  members: z.array(z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    userId: z.string().min(1, "ID do usuário é obrigatório"),
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
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      const userIds = data.members
        .map(member => member.userId)
        .filter(userId => userId && userId.trim() !== '') as string[];

      // Preparar dados para a API
      const apiData = {
        name: data.name,
        description: data.description || undefined,
        userIds,
      };

      await onSubmit?.(apiData);
      setOpen(false);
      form.reset();
      setNewMemberName("");
      setNewMemberUserId("");
      
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

  const addMember = () => {
    if (!newMemberName.trim() || !newMemberUserId.trim()) return;
    
    const newMember = {
      name: newMemberName.trim(),
      userId: newMemberUserId.trim(),
    };

    const currentMembers = form.getValues("members");
    
    // Verificar se o membro já existe
    const memberExists = currentMembers.some(
      member => member.userId === newMember.userId
    );

    if (!memberExists) {
      form.setValue("members", [...currentMembers, newMember]);
      setNewMemberName("");
      setNewMemberUserId("");
    }
  };

  const removeMember = (index: number) => {
    const currentMembers = form.getValues("members");
    const updatedMembers = currentMembers.filter((_, i) => i !== index);
    form.setValue("members", updatedMembers);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMember();
    }
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
              
              {/* Campo para adicionar novo membro */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do membro"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addMember}
                    disabled={!newMemberName.trim() || !newMemberUserId.trim()}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
                
                <Input
                  placeholder="ID do usuário"
                  value={newMemberUserId}
                  onChange={(e) => setNewMemberUserId(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>

              {/* Lista de Membros */}
              {watchedMembers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Membros adicionados ({watchedMembers.length}):
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {watchedMembers.map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.userId}</div>
                        </div>
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