import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCPF } from "@/lib/utils";
import { InsertUser } from "@shared/schema";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const addEmployeeSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido").refine(val => val.replace(/\D/g, "").length === 11, {
    message: "O CPF deve ter 11 dígitos"
  }),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  tipo_contrato: z.string().min(1, "Tipo de contrato é obrigatório"),
  carga_horaria: z.number().min(1, "Carga horária é obrigatória")
});

export default function AddEmployeeModal({ isOpen, onClose }: AddEmployeeModalProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      data_inicio: new Date().toISOString().split('T')[0],
      tipo_contrato: "Integral (44h)",
      carga_horaria: 44
    },
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (data: Partial<InsertUser>) => {
      return apiRequest('POST', '/api/employees', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Sucesso",
        description: "Empregado adicionado com sucesso!",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro na criação de empregado:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error?.message || "Não foi possível adicionar o empregado. Verifique os dados e tente novamente.",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof addEmployeeSchema>) => {
    const formattedCpf = data.cpf.replace(/\D/g, "");
    
    // Enviar apenas os campos esperados pelo backend
    const employeeData: Partial<InsertUser> = {
      nome: data.nome,
      cpf: formattedCpf,
      email: "",
      telefone: ""
    };
    
    addEmployeeMutation.mutate(employeeData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Empregado</DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar um novo empregado doméstico.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do empregado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
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
                  <p className="text-xs text-text-secondary mt-1">Este será o login do empregado.</p>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="data_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de início</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tipo_contrato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de contrato</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo de contrato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Integral (44h)">Integral (44h)</SelectItem>
                      <SelectItem value="Meio período (20h)">Meio período (20h)</SelectItem>
                      <SelectItem value="Personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="carga_horaria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carga horária semanal</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                disabled={addEmployeeMutation.isPending}
              >
                {addEmployeeMutation.isPending ? "Adicionando..." : "Adicionar Empregado"}
              </Button>
              <p className="text-xs text-text-secondary text-center mt-2">
                A senha inicial será o CPF+ponto. O empregado deverá alterá-la no primeiro acesso.
              </p>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
