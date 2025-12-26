import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { changePasswordSchema } from "@shared/schema";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      senhaAtual: "",
      novaSenha: "",
      confirmaSenha: ""
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { senhaAtual: string; novaSenha: string; confirmaSenha: string }) => {
      return apiRequest('POST', '/api/auth/change-password', data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      if (error.message?.includes("senha atual")) {
        form.setError('senhaAtual', {
          type: 'manual',
          message: 'Senha atual incorreta'
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível alterar a senha. Tente novamente.",
        });
      }
    }
  });

  const onSubmit = (data: { senhaAtual: string; novaSenha: string; confirmaSenha: string }) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="senhaAtual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha Atual</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Digite sua senha atual"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="novaSenha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Digite sua nova senha"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmaSenha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirme a Nova Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirme sua nova senha"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
