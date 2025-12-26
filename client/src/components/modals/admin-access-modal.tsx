import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { adminKeySchema } from "@shared/schema";

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminAccessModal({ isOpen, onClose }: AdminAccessModalProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(adminKeySchema),
    defaultValues: {
      adminKey: "",
    },
  });

  const validateKeyMutation = useMutation({
    mutationFn: async (data: { adminKey: string }) => {
      return apiRequest('POST', '/api/auth/validate-admin-key', data);
    },
    onSuccess: () => {
      onClose();
      navigate('/first-access');
    },
    onError: () => {
      form.setError('adminKey', {
        type: 'manual',
        message: 'Chave de acesso inválida'
      });
    }
  });

  const onSubmit = (data: { adminKey: string }) => {
    validateKeyMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acesso Administrativo</DialogTitle>
          <DialogDescription>
            Insira a chave de acesso administrativa para continuar.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adminKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave de Acesso</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Digite a chave de acesso"
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
                disabled={validateKeyMutation.isPending}
              >
                {validateKeyMutation.isPending ? "Validando..." : "Continuar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
