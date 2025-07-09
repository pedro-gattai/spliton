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
import { Plus, X, Users, DollarSign } from "lucide-react";

const expenseSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(100, "Título muito longo"),
  amount: z.string().min(1, "Valor é obrigatório").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Valor deve ser um número positivo"
  ),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
  groupId: z.string().min(1, "Grupo é obrigatório"),
  splitType: z.enum(["equal", "custom", "percentage"]),
  participants: z.array(z.string()).min(1, "Selecione pelo menos um participante"),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

// Mock data - substituir por dados reais do contexto/API
const mockGroups = [
  { id: "1", name: "Viagem para Praia", members: ["João", "Maria", "Pedro"] },
  { id: "2", name: "Casa Compartilhada", members: ["Ana", "Carlos", "Sofia"] },
];

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
  onSubmit?: (data: ExpenseFormData) => void;
}

export const NewExpenseModal = ({ children, onSubmit }: NewExpenseModalProps) => {
  const [open, setOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<typeof mockGroups[0] | null>(null);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      amount: "",
      category: "",
      description: "",
      groupId: "",
      splitType: "equal",
      participants: [],
    },
  });

  const handleSubmit = (data: ExpenseFormData) => {
    console.log("Dados da despesa:", data);
    onSubmit?.(data);
    setOpen(false);
    form.reset();
    setSelectedGroup(null);
  };

  const handleGroupChange = (groupId: string) => {
    const group = mockGroups.find(g => g.id === groupId);
    setSelectedGroup(group || null);
    form.setValue("groupId", groupId);
    if (group) {
      form.setValue("participants", group.members);
    }
  };

  const toggleParticipant = (participant: string) => {
    const current = form.getValues("participants");
    const updated = current.includes(participant)
      ? current.filter(p => p !== participant)
      : [...current, participant];
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
            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Despesa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Jantar no restaurante" {...field} />
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
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        {selectedGroup.members.map((member) => (
                          <Badge
                            key={member}
                            variant={field.value.includes(member) ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${
                              field.value.includes(member) 
                                ? "bg-ton-gradient text-white" 
                                : "hover:bg-muted"
                            }`}
                            onClick={() => toggleParticipant(member)}
                          >
                            {member}
                            {field.value.includes(member) && (
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
                      <SelectItem value="equal">Divisão Igual</SelectItem>
                      <SelectItem value="custom">Valores Personalizados</SelectItem>
                      <SelectItem value="percentage">Por Porcentagem</SelectItem>
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
                      placeholder="Adicione detalhes sobre a despesa..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
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
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-ton-gradient text-white hover:bg-ton-gradient-dark"
              >
                Criar Despesa
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 