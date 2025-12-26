import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCPF } from "@/lib/utils";
import { InsertUser } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigureSchedule?: (employeeId: number) => void;
}

// Esquema para validação dos dados de cadastro
const addEmployeeSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido").refine(val => val.replace(/\D/g, "").length === 11, {
    message: "O CPF deve ter 11 dígitos"
  }),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  tipo_contrato: z.string().min(1, "Tipo de contrato é obrigatório"),
  carga_horaria: z.number().min(1, "Carga horária é obrigatória"),
  email: z.string().email("Email inválido").or(z.string().length(0)).optional(),
  telefone: z.string().optional()
});

export default function AddEmployeeModal({ isOpen, onClose, onConfigureSchedule }: AddEmployeeModalProps) {
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      data_nascimento: "",
      data_inicio: new Date().toISOString().split('T')[0],
      tipo_contrato: "Integral (44h)",
      carga_horaria: 44,
      email: "",
      telefone: ""
    },
  });

  // Define a carga horária com base no tipo de contrato
  const definirCargaHoraria = (tipoContrato: string) => {
    if (tipoContrato === "Integral (44h)") {
      form.setValue("carga_horaria", 44);
    } else if (tipoContrato === "Meio período (20h)") {
      form.setValue("carga_horaria", 20);
    }
  };

  const addEmployeeMutation = useMutation({
    mutationFn: async (data: Partial<InsertUser>) => {
      return apiRequest('POST', '/api/employees', data);
    },
    onSuccess: (response) => {
      // Extrair o ID do empregado adicionado
      response.json().then(data => {
        if (data.employee && data.employee.id) {
          queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
          
          // Mostra toast de sucesso
          toast({
            title: "Sucesso",
            description: "Empregado adicionado com sucesso!",
          });
          
          // Fecha o formulário e limpa os campos
          form.reset();
          onClose();
          
          // Se o callback para abrir a configuração de escala estiver disponível,
          // perguntar ao usuário se deseja configurar a escala agora
          if (onConfigureSchedule) {
            const confirmSchedule = window.confirm(
              "Deseja configurar a escala de trabalho do empregado agora?"
            );
            
            if (confirmSchedule) {
              onConfigureSchedule(data.employee.id);
            }
          }
        }
      });
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
    
    const employeeData: Partial<InsertUser> = {
      nome: data.nome,
      cpf: formattedCpf,
      email: data.email,
      telefone: data.telefone,
      data_nascimento: data.data_nascimento,
      data_inicio: data.data_inicio,
      tipo_contrato: data.tipo_contrato,
      carga_horaria: data.carga_horaria
    };
    
    addEmployeeMutation.mutate(employeeData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Empregado</DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar um novo empregado doméstico.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="email@exemplo.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        {...field} 
                      />
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        definirCargaHoraria(value);
                      }}
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
                    <p className="text-xs text-text-secondary mt-1">
                      {form.getValues().tipo_contrato !== "Personalizado" 
                        ? "Atualizado automaticamente com base no tipo de contrato" 
                        : "Informe a carga horária semanal"}
                    </p>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="pt-4 flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onClose()}
              >
                Cancelar
              </Button>
              
              <Button 
                type="submit" 
                disabled={addEmployeeMutation.isPending}
              >
                {addEmployeeMutation.isPending ? "Adicionando..." : "Adicionar Empregado"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}