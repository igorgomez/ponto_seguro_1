import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

interface ConfigureScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: User | null;
}

const weekdaySchema = z.object({
  dia_semana: z.string(),
  ativo: z.boolean().default(true),
  hora_entrada: z.string().min(1, "Obrigatório"),
  hora_saida: z.string().min(1, "Obrigatório"),
  intervalo_inicio: z.string().min(1, "Obrigatório"),
  intervalo_fim: z.string().min(1, "Obrigatório")
});

const scheduleFormSchema = z.object({
  empregado_id: z.number(),
  schedules: z.array(weekdaySchema)
});

const weekdays = [
  { name: "Segunda-feira", value: "segunda" },
  { name: "Terça-feira", value: "terca" },
  { name: "Quarta-feira", value: "quarta" },
  { name: "Quinta-feira", value: "quinta" },
  { name: "Sexta-feira", value: "sexta" },
  { name: "Sábado", value: "sabado" },
  { name: "Domingo", value: "domingo" },
];

export default function ConfigureScheduleModal({ 
  isOpen, 
  onClose, 
  employee 
}: ConfigureScheduleModalProps) {
  const { toast } = useToast();

  // Fetch current schedules if they exist
  const { data: schedules, isLoading: loadingSchedules } = useQuery({
    queryKey: ['/api/work-schedule', employee?.id],
    enabled: isOpen && !!employee?.id,
  });

  const form = useForm({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      empregado_id: employee?.id || 0,
      schedules: weekdays.map(day => ({
        dia_semana: day.value,
        ativo: day.value !== "sabado" && day.value !== "domingo",
        hora_entrada: "08:00",
        hora_saida: "17:00",
        intervalo_inicio: "12:00",
        intervalo_fim: "13:00"
      }))
    },
  });

  const { fields, update } = useFieldArray({
    control: form.control,
    name: "schedules"
  });

  // Update form values when employee or schedules change
  useEffect(() => {
    if (employee) {
      form.setValue("empregado_id", employee.id);
    }
    
    if (schedules) {
      // Map existing schedules to form fields
      const schedulesMap = new Map(schedules.map(s => [s.dia_semana, s]));
      
      fields.forEach((field, index) => {
        const existingSchedule = schedulesMap.get(field.dia_semana);
        if (existingSchedule) {
          update(index, {
            ...field,
            ativo: existingSchedule.ativo,
            hora_entrada: existingSchedule.hora_entrada,
            hora_saida: existingSchedule.hora_saida,
            intervalo_inicio: existingSchedule.intervalo_inicio,
            intervalo_fim: existingSchedule.intervalo_fim
          });
        }
      });
    }
  }, [employee, schedules, fields, update, form]);

  const saveScheduleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof scheduleFormSchema>) => {
      return apiRequest('POST', '/api/work-schedule', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-schedule'] });
      toast({
        title: "Sucesso",
        description: "Horários salvos com sucesso!",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar os horários. Tente novamente.",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof scheduleFormSchema>) => {
    saveScheduleMutation.mutate(data);
  };

  const applyToAllWorkdays = () => {
    const firstWorkdayIndex = fields.findIndex(f => f.dia_semana === "segunda");
    if (firstWorkdayIndex >= 0) {
      const model = form.getValues().schedules[firstWorkdayIndex];
      
      fields.forEach((field, index) => {
        if (field.dia_semana !== "sabado" && field.dia_semana !== "domingo") {
          update(index, {
            ...field,
            hora_entrada: model.hora_entrada,
            hora_saida: model.hora_saida,
            intervalo_inicio: model.intervalo_inicio,
            intervalo_fim: model.intervalo_fim
          });
        }
      });
    }
  };

  const applyToAllDays = () => {
    const firstWorkdayIndex = fields.findIndex(f => f.dia_semana === "segunda");
    if (firstWorkdayIndex >= 0) {
      const model = form.getValues().schedules[firstWorkdayIndex];
      
      fields.forEach((field, index) => {
        update(index, {
          ...field,
          hora_entrada: model.hora_entrada,
          hora_saida: model.hora_saida,
          intervalo_inicio: model.intervalo_inicio,
          intervalo_fim: model.intervalo_fim
        });
      });
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Configurar Horários - {employee.nome}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <FormField
                      control={form.control}
                      name={`schedules.${index}.ativo`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-medium">
                            {weekdays.find(d => d.value === form.getValues().schedules[index].dia_semana)?.name}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <span className="text-xs text-text-secondary">
                      {form.getValues().schedules[index].dia_semana === "sabado" || 
                       form.getValues().schedules[index].dia_semana === "domingo" 
                        ? "Fim de semana" 
                        : "Dia útil"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name={`schedules.${index}.hora_entrada`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-text-secondary">Entrada</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} disabled={!form.getValues().schedules[index].ativo} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`schedules.${index}.hora_saida`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-text-secondary">Saída</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} disabled={!form.getValues().schedules[index].ativo} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`schedules.${index}.intervalo_inicio`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-text-secondary">Início Intervalo</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} disabled={!form.getValues().schedules[index].ativo} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`schedules.${index}.intervalo_fim`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-text-secondary">Fim Intervalo</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} disabled={!form.getValues().schedules[index].ativo} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={applyToAllWorkdays}
              >
                Aplicar o mesmo horário para todos os dias úteis
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={applyToAllDays}
              >
                Aplicar o mesmo horário para todos os dias (incluindo fim de semana)
              </Button>
            </div>
            
            <div className="flex space-x-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={saveScheduleMutation.isPending}
              >
                {saveScheduleMutation.isPending ? "Salvando..." : "Salvar Horários"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
