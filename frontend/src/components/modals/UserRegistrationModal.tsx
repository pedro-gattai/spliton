import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

const userRegistrationSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().optional(),
  username: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
});

type UserRegistrationForm = z.infer<typeof userRegistrationSchema>;

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onUserCreated: (user: any) => void;
}

export const UserRegistrationModal = ({
  isOpen,
  onClose,
  walletAddress,
  onUserCreated,
}: UserRegistrationModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserRegistrationForm>({
    resolver: zodResolver(userRegistrationSchema),
  });

  const onSubmit = async (data: UserRegistrationForm) => {
    setIsLoading(true);
    try {
      const result = await apiService.createUser({
        tonWalletAddress: walletAddress,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
      });

      toast({
        title: "Sucesso!",
        description: "Usuário criado com sucesso.",
      });
      onUserCreated(result);
      reset();
      onClose();
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar usuário",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete seu perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="walletAddress">Endereço da Carteira</Label>
            <Input
              id="walletAddress"
              value={walletAddress}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome *</Label>
            <Input
              id="firstName"
              {...register("firstName")}
              placeholder="Digite seu nome"
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              {...register("lastName")}
              placeholder="Digite seu sobrenome"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nome de usuário</Label>
            <Input
              id="username"
              {...register("username")}
              placeholder="Digite um nome de usuário"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="Digite seu email"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Perfil"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 