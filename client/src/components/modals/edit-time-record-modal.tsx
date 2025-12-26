import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { TimeRecord } from "@shared/schema";

interface EditTimeRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: TimeRecord;
}

const editRecordSchema = z.object({
  id: z.number().optional(),
  hora_entrada: z.string().optional(),
  hora_intervalo: z.string().optional(),
  hora_retorno: z.string().optional(),
  hora_saida: z.string().optional(),
  motivo_edicao: z.string().min(1, "É necessário informar o motivo da edição")
});

export default function EditTimeRecordModal({ isOpen, onClose, record }: EditTimeRecordModalProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(editRecordSchema),
    defaultValues: {
      id: record?.id,
      hora_entrada: record?.hora_entrada ? new Date(record.hora_entrada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : "",
      hora_intervalo: record?.hora_intervalo ? new Date(record.hora_intervalo).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : "",
      hora_retorno: record?.hora_retorno ? new Date(record.hora_retorno).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : "",
      hora_saida: record?.hora_saida ? new Date(record.hora_saida).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : "",
      motivo_edicao: ""
    },
  });

  const saveRecordEditMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editRecordSchema>) => {
      return apiRequest('PATCH', `/api/time-records/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-records'] });
      queryClient.invalidateQueries({ queryKey: ['/api/time-records/today'] });
      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso!",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o registro. Tente novamente.",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof editRecordSchema>) => {
    saveRecordEditMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Registro de Ponto</DialogTitle>
        </DialogHeader>
        
        {record ? (
          <>
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center text-white mr-2">
                  <span className="font-bold">
                    {record.employee?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'MS'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{record.employee?.nome || 'Empregado'}</p>
                  <p className="text-xs text-text-secondary">
                    {record.data ? new Date(record.data).toLocaleDateString('pt-BR') : 'Data não disponível'}
                  </p>
                </div>
              </div>
              <div className="text-sm text-yellow-600 bg-yellow-100 p-2 rounded flex items-start">
                <AlertTriangle className="h-5 w-5 mr-1 flex-shrink-0 mt-0.5" />
                <span>Atenção: A edição de registros ficará registrada no histórico.</span>
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hora_entrada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entrada</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hora_intervalo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalo</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hora_retorno"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retorno</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hora_saida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Saída</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="motivo_edicao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo da edição</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={3} 
                          placeholder="Informe o motivo da alteração..."
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
                    disabled={saveRecordEditMutation.isPending}
                  >
                    {saveRecordEditMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          <p className="text-center py-4 text-muted-foreground">
            Erro ao carregar os dados do registro.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
