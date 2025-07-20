import { useState, useEffect } from "react";
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
import { Plus, X, Users, DollarSign, Loader2 } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { type CreateExpenseRequest } from "@/lib/api";

// 1. Ajuste do schema para refletir o backend
const expenseSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").max(100, "Descrição muito longa"),
  amount: z.string().min(1, "Valor é obrigatório").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Valor deve ser um número positivo"
  ),
  category: z.string().min(1, "Categoria é obrigatória"),
  groupId: z.string().min(1, "Grupo é obrigatório"),
  payerId: z.string().min(1, "Pagador é obrigatório"),
  splitType: z.enum(["EQUAL", "CUSTOM"]),
  participants: z.array(z.object({
    userId: z.string(),
    amountOwed: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Valor inválido")
  })).min(1, "Selecione pelo menos um participante"),
  receiptImage: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const categories = [
  "Alimentação",
  "Transporte", 
  "Hospedagem",
  "Entretenimento",
  "Compras",
  "Outros"
];

interface NewExpenseModalProps {
  children: React.ReactNode;
  onSubmit?: (data: CreateExpenseRequest) => Promise<void>;
  userId?: string;
}

export const NewExpenseModal = ({ children, onSubmit, userId }: NewExpenseModalProps) => {
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useWalletConnection();
  const { groups, loading: loadingGroups } = useGroups(user?.id);



  // 3. Ajustar defaultValues e lógica do formulário
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      groupId: "",
      payerId: "",
      splitType: "EQUAL",
      participants: [],
      receiptImage: "",
    },
  });

  // 4. handleSubmit: montar payload conforme backend
  const handleSubmit = async (data: ExpenseFormData) => {
    if (!userId) {
      console.error('Usuário não identificado');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload: CreateExpenseRequest = {
        groupId: data.groupId,
        payerId: data.payerId,
        description: data.description || undefined,
        amount: Number(data.amount),
        category: data.category || undefined,
        receiptImage: data.receiptImage || undefined,
        splitType: data.splitType,
        participants: data.participants.map(p => ({
          userId: p.userId,
          amountOwed: Number(p.amountOwed)
        })),
      };
      
      console.log('Enviando despesa:', payload);
      
      await onSubmit?.(payload);
      setOpen(false);
      form.reset();
      setSelectedGroup(null);
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. handleGroupChange: atualizar participantes e pagador
  const handleGroupChange = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    setSelectedGroup(group || null);
    form.setValue("groupId", groupId);
    if (group) {
      // Preencher participantes com todos do grupo
      form.setValue("participants", group.members.map((m: any) => ({ 
        userId: m.user.id, 
        amountOwed: "0" 
      })));
      form.setValue("payerId", group.members[0]?.user.id || "");
    }
  };

  // Corrigir toggleParticipant para manipular objetos { userId, amountOwed }
  const toggleParticipant = (userId: string) => {
    const current = form.getValues("participants");
    const exists = current.find((p: any) => p.userId === userId);
    let updated;
    if (exists) {
      updated = current.filter((p: any) => p.userId !== userId);
    } else {
      updated = [...current, { userId, amountOwed: "0" }];
    }
    form.setValue("participants", updated);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Nova Despesa
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Despesa</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Jantar no restaurante"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (TON)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Grupo */}
            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo</FormLabel>
                  <Select onValueChange={handleGroupChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingGroups ? "Carregando..." : "Selecione um grupo"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingGroups ? (
                        <div className="flex items-center gap-2 p-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Carregando grupos...</span>
                        </div>
                      ) : (
                        groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {group.name}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pagador */}
            {selectedGroup && (
              <FormField
                control={form.control}
                name="payerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagador</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o pagador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedGroup.members.map((member: any) => (
                          <SelectItem key={member.user.id} value={member.user.id}>
                            {member.user.firstName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Participantes */}
            {selectedGroup && (
              <FormField
                control={form.control}
                name="participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participantes</FormLabel>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {selectedGroup.members.map((member: any) => (
                          <Badge
                            key={member.user.id}
                            variant={field.value.some((p: any) => p.userId === member.user.id) ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${
                              field.value.some((p: any) => p.userId === member.user.id) 
                                ? "bg-ton-gradient text-white" 
                                : "hover:bg-muted"
                            }`}
                            onClick={() => toggleParticipant(member.user.id)}
                          >
                            {member.user.firstName}
                            {field.value.some((p: any) => p.userId === member.user.id) && (
                              <X className="w-3 h-3 ml-1" />
                            )}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Clique para selecionar/remover participantes
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Tipo de Divisão */}
            <FormField
              control={form.control}
              name="splitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Divisão</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EQUAL">Divisão Igual</SelectItem>
                      <SelectItem value="CUSTOM">Valores Personalizados</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Receita */}
            <FormField
              control={form.control}
              name="receiptImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receita (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="URL da imagem da nota fiscal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  "Criar Despesa"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 