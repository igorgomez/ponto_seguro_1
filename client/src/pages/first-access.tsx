import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatCPF } from "@/lib/utils";

const setupFormSchema = z.object({
  cpf: z.string().min(1, "CPF é obrigatório"),
  novaSenha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmaSenha: z.string().min(1, "Confirmação de senha é obrigatória")
}).refine(data => data.novaSenha === data.confirmaSenha, {
  message: "As senhas não coincidem",
  path: ["confirmaSenha"]
});

export default function FirstAccess() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEmployee, setIsEmployee] = useState(false);

  const form = useForm({
    resolver: zodResolver(setupFormSchema),
    defaultValues: {
      cpf: user?.tipo === 'empregado' ? user.cpf : "",
      novaSenha: "",
      confirmaSenha: ""
    },
  });

  useEffect(() => {
    // Check if user is employee or admin
    if (user) {
      setIsEmployee(user.tipo === 'empregado');
      
      if (user.tipo === 'empregado') {
        form.setValue('cpf', user.cpf);
      }
    }
  }, [user, form]);

  const setupAccountMutation = useMutation({
    mutationFn: async (data: z.infer<typeof setupFormSchema>) => {
      return apiRequest('POST', '/api/auth/setup-account', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: "Conta configurada com sucesso!",
      });
      
      // Navigate to the appropriate dashboard
      if (isEmployee) {
        navigate('/employee');
      } else {
        navigate('/admin');
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível configurar a conta. Tente novamente.",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof setupFormSchema>) => {
    const formattedCpf = data.cpf.replace(/\D/g, "");
    setupAccountMutation.mutate({
      ...data,
      cpf: formattedCpf
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background-light text-text-primary">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-primary">Primeiro Acesso</h1>
            <p className="text-text-secondary mb-2">
              {isEmployee 
                ? "Configure sua senha para acessar o sistema" 
                : "Configure sua conta de administrador"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!isEmployee && (
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF do Administrador</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000.000.000-00" 
                          {...field}
                          onChange={(e) => {
                            const value = formatCPF(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
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
                    <FormLabel>Confirme a Senha</FormLabel>
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

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={setupAccountMutation.isPending}
                >
                  {setupAccountMutation.isPending ? "Configurando..." : "Configurar Conta"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
