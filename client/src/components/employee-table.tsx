import { useState } from "react";
import { 
  Edit, Calendar, Key, UserX, UserCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

interface EmployeeTableProps {
  data: User[];
  isLoading: boolean;
  onConfigureSchedule: (employee: User) => void;
}

export default function EmployeeTable({ 
  data, 
  isLoading,
  onConfigureSchedule
}: EmployeeTableProps) {
  const { toast } = useToast();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [action, setAction] = useState<'toggle' | 'reset' | null>(null);

  // Toggle employee status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      return apiRequest('PATCH', `/api/employees/${employeeId}/toggle-status`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      
      toast({
        title: "Sucesso",
        description: `Status do empregado ${selectedEmployee?.ativo ? 'inativado' : 'ativado'} com sucesso!`,
      });
      
      setConfirmDialogOpen(false);
      setSelectedEmployee(null);
      setAction(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do empregado. Tente novamente.",
      });
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      return apiRequest('POST', `/api/employees/${employeeId}/reset-password`, {});
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Senha do empregado redefinida com sucesso!",
      });
      
      setConfirmDialogOpen(false);
      setSelectedEmployee(null);
      setAction(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível redefinir a senha do empregado. Tente novamente.",
      });
    }
  });

  // Handlers
  const handleToggleEmployeeStatus = (employee: User) => {
    setSelectedEmployee(employee);
    setAction('toggle');
    setConfirmDialogOpen(true);
  };

  const handleResetPassword = (employee: User) => {
    setSelectedEmployee(employee);
    setAction('reset');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedEmployee) return;
    
    if (action === 'toggle') {
      toggleStatusMutation.mutate(selectedEmployee.id);
    } else if (action === 'reset') {
      resetPasswordMutation.mutate(selectedEmployee.id);
    }
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">CPF</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Data de Início</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Jornada</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3].map((i) => (
              <tr key={i}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full mr-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-20" /></td>
                <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-20" /></td>
                <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-20" /></td>
                <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-6 w-16 rounded-full" /></td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white text-center py-8 text-muted-foreground">
        Nenhum empregado cadastrado.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">CPF</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Data de Início</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Jornada</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((employee) => (
              <tr key={employee.id} className={!employee.ativo ? "bg-gray-50" : ""}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`${employee.ativo ? "bg-primary" : "bg-gray-400"} rounded-full w-8 h-8 flex items-center justify-center text-white mr-2`}>
                      <span className="font-bold">{employee.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                    </div>
                    <span className="font-medium">{employee.nome}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{employee.cpf}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {employee.data_inicio ? new Date(employee.data_inicio).toLocaleDateString('pt-BR') : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{employee.carga_horaria || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {employee.ativo ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-success">Ativo</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">Inativo</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-secondary"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-secondary"
                      title="Configurar Horários"
                      onClick={() => onConfigureSchedule(employee)}
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-warning hover:text-yellow-700"
                      title="Resetar Senha"
                      onClick={() => handleResetPassword(employee)}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={employee.ativo ? "text-error hover:text-red-700" : "text-success hover:text-green-700"}
                      title={employee.ativo ? "Inativar" : "Ativar"}
                      onClick={() => handleToggleEmployeeStatus(employee)}
                    >
                      {employee.ativo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === 'toggle' 
                ? (selectedEmployee?.ativo ? 'Inativar Empregado' : 'Ativar Empregado')
                : 'Resetar Senha'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'toggle' 
                ? `Tem certeza que deseja ${selectedEmployee?.ativo ? 'inativar' : 'ativar'} o empregado ${selectedEmployee?.nome}?`
                : `Tem certeza que deseja resetar a senha de ${selectedEmployee?.nome}? A nova senha será o CPF seguido de "ponto".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {action === 'toggle' 
                ? (selectedEmployee?.ativo ? 'Inativar' : 'Ativar')
                : 'Resetar Senha'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
