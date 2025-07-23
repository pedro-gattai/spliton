import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { 
  Plus, 
  X, 
  Users, 
  DollarSign, 
  Loader2, 
  Crown,
  Calculator,
  Receipt,
  AlertCircle
} from "lucide-react";
import { useGroups } from "@/hooks/useGroups";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useGroupBalances } from "@/hooks/useGroupBalances";
import { type CreateExpenseRequest } from "@/lib/api";
import { DivisionPreview } from "@/components/DivisionPreview";
import { ParticipantSelector } from "@/components/ParticipantSelector";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { useToast } from "@/hooks/use-toast";

// Schema atualizado com validações em tempo real
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

// Categorias inteligentes baseadas no contexto
const categories = [
  { value: "Alimentação", icon: "🍕", keywords: ["comida", "restaurante", "jantar", "almoço", "café", "pizza", "hamburger"] },
  { value: "Transporte", icon: "🚗", keywords: ["uber", "taxi", "gasolina", "estacionamento", "ônibus", "metrô"] },
  { value: "Hospedagem", icon: "🏨", keywords: ["hotel", "airbnb", "hospedagem", "acomodação"] },
  { value: "Entretenimento", icon: "🎬", keywords: ["cinema", "show", "bar", "balada", "teatro", "museu"] },
  { value: "Compras", icon: "🛍️", keywords: ["compras", "shopping", "loja", "mercado", "supermercado"] },
  { value: "Outros", icon: "📋", keywords: [] }
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
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [totalValidation, setTotalValidation] = useState({ isValid: true, message: '' });
  
  const { user } = useWalletConnection();
  const { groups, loading: loadingGroups } = useGroups(user?.id);
  
  // Stabilize array reference to prevent unnecessary re-renders
  const selectedGroupIds = useMemo(() => 
    selectedGroup ? [selectedGroup.id] : [], 
    [selectedGroup?.id]
  );
  
  const { balances } = useGroupBalances(user?.id, selectedGroupIds);
  const { toast } = useToast();

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

  const watchedAmount = form.watch("amount");
  const watchedParticipants = form.watch("participants");
  const watchedSplitType = form.watch("splitType");
  const watchedDescription = form.watch("description");
  const watchedPayerId = form.watch("payerId");

  // Cálculo automático em tempo real - usando setTimeout para quebrar o loop
  const calculateSplit = useCallback((amount: number, participants: any[], splitType: string) => {
    if (splitType === 'EQUAL' && participants.length > 0) {
      const payerId = watchedPayerId;
      
      // Para divisão igual, dividir o valor total entre TODOS os participantes
      const amountPerPerson = amount / participants.length;
      const updatedParticipants = participants.map(p => {
        if (p.userId === payerId) {
          // Pagador não deve nada (já pagou)
          return { ...p, amountOwed: "0" };
        } else {
          // Outros participantes devem sua parte
          return { ...p, amountOwed: amountPerPerson.toFixed(2) };
        }
      });
      
      // Use setTimeout to break the render loop
      setTimeout(() => {
        form.setValue("participants", updatedParticipants);
      }, 0);
    }
  }, [form, watchedPayerId]);

  // Executar cálculo quando mudar valor, participantes, pagador ou tipo de divisão
  useEffect(() => {
    const amount = Number(watchedAmount);
    if (amount > 0 && watchedParticipants && watchedParticipants.length > 0 && watchedPayerId && watchedSplitType) {
      calculateSplit(amount, watchedParticipants, watchedSplitType);
    }
  }, [watchedAmount, watchedParticipants?.length, watchedSplitType, watchedPayerId, calculateSplit]);

  // Validação da soma em tempo real
  useEffect(() => {
    if (watchedSplitType === 'CUSTOM' && watchedParticipants && watchedParticipants.length > 0) {
      const amount = Number(watchedAmount);
      const totalOwed = watchedParticipants.reduce((sum, p) => sum + Number(p.amountOwed), 0);
      const difference = Math.abs(totalOwed - amount);
      
      if (difference > 0.01) {
        setTotalValidation({
          isValid: false,
          message: `A soma deve ser ${amount.toFixed(2)} TON. Atual: ${totalOwed.toFixed(2)} TON`
        });
      } else {
        setTotalValidation({ isValid: true, message: '' });
      }
    } else {
      setTotalValidation({ isValid: true, message: '' });
    }
  }, [watchedAmount, watchedParticipants, watchedSplitType]);

  // Sugerir categoria baseada na descrição
  const suggestCategory = useCallback((description: string) => {
    if (!description) return;
    
    const lowerDesc = description.toLowerCase();
    for (const category of categories) {
      if (category.keywords.some(keyword => lowerDesc.includes(keyword))) {
        form.setValue("category", category.value);
        break;
      }
    }
  }, [form]);

  useEffect(() => {
    if (watchedDescription) {
      suggestCategory(watchedDescription);
    }
  }, [watchedDescription, suggestCategory]);

  // Sugerir pagador baseado no saldo
  const suggestPayer = useCallback((group: any) => {
    if (!group || !balances[group.id]) return;
    
    const groupBalance = balances[group.id];
    if (groupBalance.status === 'receive') {
      // Se o usuário deve receber, sugerir ele como pagador
      form.setValue("payerId", user?.id || "");
    } else {
      // Senão, sugerir quem tem melhor saldo
      const bestPayer = group.members.find((m: any) => {
        const memberBalance = balances[group.id];
        return memberBalance && memberBalance.status === 'receive';
      });
      
      if (bestPayer) {
        form.setValue("payerId", bestPayer.user.id);
      }
    }
  }, [balances, form, user?.id]);

  const handleSubmit = async (data: ExpenseFormData) => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não identificado. Faça login primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!totalValidation.isValid) {
      toast({
        title: "Erro de Validação",
        description: totalValidation.message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Processar imagem se houver
      let receiptImageUrl = data.receiptImage;
      if (receiptFile) {
        // Aqui você implementaria o upload da imagem
        // Por enquanto, vamos usar uma URL mock
        receiptImageUrl = URL.createObjectURL(receiptFile);
      }

      const payload: CreateExpenseRequest = {
        groupId: data.groupId,
        payerId: data.payerId,
        description: data.description || undefined,
        amount: Number(data.amount),
        category: data.category || undefined,
        receiptImage: receiptImageUrl || undefined,
        splitType: data.splitType,
        participants: data.participants.map(p => ({
          userId: p.userId,
          amountOwed: Number(p.amountOwed)
        })),
      };
      
      await onSubmit?.(payload);
      setOpen(false);
      form.reset();
      setSelectedGroup(null);
      setReceiptFile(null);
      setReceiptPreview(null);
      
      toast({
        title: "Sucesso",
        description: "Despesa criada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar despesa",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGroupChange = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    
    // Add change detection to avoid redundant updates
    if (selectedGroup?.id === groupId) return;
    
    setSelectedGroup(group || null);
    form.setValue("groupId", groupId);
    
    if (group) {
      // Preencher participantes com todos do grupo
      const allParticipants = group.members.map((m: any) => ({ 
        userId: m.user.id, 
        amountOwed: "0" 
      }));
      form.setValue("participants", allParticipants);
      
      // Sugerir pagador
      suggestPayer(group);
    }
  };

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

  const updateParticipantAmount = (userId: string, amount: string) => {
    const current = form.getValues("participants");
    const updated = current.map((p: any) => 
      p.userId === userId ? { ...p, amountOwed: amount } : p
    );
    form.setValue("participants", updated);
  };

  const handleAddExternalUser = (user: any) => {
    const current = form.getValues("participants");
    const exists = current.find((p: any) => p.userId === user.id);
    
    if (exists) {
      toast({
        title: "Usuário já adicionado",
        description: "Este usuário já está na lista de participantes.",
        variant: "destructive",
      });
      return;
    }

    const newParticipant = { userId: user.id, amountOwed: "0" };
    form.setValue("participants", [...current, newParticipant]);
    
    toast({
      title: "Participante adicionado",
                      description: `@${user.username} foi adicionado como participante externo.`,
    });
  };

  const handleReceiptUpload = (file: File | null) => {
    setReceiptFile(file);
    
    if (file) {
      const url = URL.createObjectURL(file);
      setReceiptPreview(url);
      form.setValue("receiptImage", url);
    } else {
      setReceiptPreview(null);
      form.setValue("receiptImage", "");
    }
  };

  const getPayerName = () => {
    if (!selectedGroup || !watchedPayerId) return "";
    const payer = selectedGroup.members.find((m: any) => m.user.id === watchedPayerId);
    return payer ? `@${payer.user.username}` : "";
  };

  const getParticipantsWithNames = () => {
    if (!selectedGroup || !watchedParticipants) return [];
    
    return watchedParticipants.map(p => {
      const member = selectedGroup.members.find((m: any) => m.user.id === p.userId);
      return {
        userId: p.userId,
        userName: member ? `@${member.user.username}` : "Desconhecido",
        amountOwed: Number(p.amountOwed)
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            ✨ Nova Despesa
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Informações da Despesa
              </h3>

              {/* Descrição */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição da Despesa</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Jantar no restaurante italiano"
                        className="resize-none"
                        rows={2}
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
                            <SelectItem key={category.value} value={category.value}>
                              <div className="flex items-center gap-2">
                                <span>{category.icon}</span>
                                {category.value}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Grupo e Pagador */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Grupo e Pagador
              </h3>

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
                          {selectedGroup.members.map((member: any) => {
                            const balance = balances[selectedGroup.id];
                            const isRecommended = balance?.status === 'receive' && member.user.id === user?.id;
                            
                            return (
                              <SelectItem key={member.user.id} value={member.user.id}>
                                <div className="flex items-center gap-2">
                                  <Crown className="w-4 h-4" />
                                  @{member.user.username}
                                  {isRecommended && (
                                    <Badge variant="secondary" className="text-xs">
                                      Recomendado
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Participantes e Divisão */}
            {selectedGroup && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Participantes e Divisão
                </h3>

                {/* Seleção de Participantes */}
                <ParticipantSelector
                  members={selectedGroup.members}
                  selected={watchedParticipants || []}
                  onToggle={toggleParticipant}
                  onAmountChange={updateParticipantAmount}
                  onAddExternalUser={handleAddExternalUser}
                  splitType={watchedSplitType || 'EQUAL'}
                  showAvatars={true}
                  showBalance={true}
                  allowExternalUsers={true}
                />

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

                {/* Preview da Divisão */}
                {Number(watchedAmount) > 0 && watchedParticipants && watchedParticipants.length > 0 && watchedPayerId && (
                  <DivisionPreview
                    amount={Number(watchedAmount)}
                    participants={getParticipantsWithNames()}
                    payer={getPayerName()}
                    splitType={watchedSplitType || 'EQUAL'}
                    payerId={watchedPayerId}
                  />
                )}

                {/* Validação da Soma */}
                {!totalValidation.isValid && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">{totalValidation.message}</span>
                  </div>
                )}
              </div>
            )}

            {/* Upload de Recibo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Foto do Recibo (Opcional)
              </h3>

              <ReceiptUpload
                onUpload={handleReceiptUpload}
                preview={receiptPreview}
                maxSize="5MB"
                acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
              />
            </div>

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
                disabled={isSubmitting || !totalValidation.isValid}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Criar Despesa
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 