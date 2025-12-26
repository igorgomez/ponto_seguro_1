import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import ChangePasswordModal from "@/components/modals/change-password-modal";
import { useMobile } from "@/hooks/use-mobile";
import CompactViewToggle from "@/components/compact-view-toggle";
import WorkHoursSummary from "@/components/work-hours-summary";
import PerformanceDashboard from "@/components/performance-dashboard";
import EmployeeBadges from "@/components/employee-badges";
import NotificationSystem from "@/components/notification-system";

export default function EmployeeDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const isMobile = useMobile();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isCompactView, setIsCompactView] = useState(false);

  // Fetch employee data
  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ['/api/employees/me'],
  });

  // Fetch today's time record
  const { data: todayRecord, isLoading: loadingTodayRecord } = useQuery({
    queryKey: ['/api/time-records/today/me'],
  });

  // Fetch time record history
  const { data: timeRecords, isLoading: loadingTimeRecords } = useQuery({
    queryKey: ['/api/time-records/me'],
  });

  // Fetch work schedule
  const { data: workSchedule, isLoading: loadingWorkSchedule } = useQuery({
    queryKey: ['/api/work-schedule/me'],
  });

  // Mutation for registering time
  const registerTimeMutation = useMutation({
    mutationFn: async (type: 'entry' | 'break' | 'return' | 'exit') => {
      return apiRequest('POST', '/api/time-records/register', { type });
    },
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-records/today/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/time-records/me'] });
      
      const messages: Record<string, string> = {
        entry: 'Entrada registrada com sucesso!',
        break: 'Intervalo registrado com sucesso!',
        return: 'Retorno registrado com sucesso!',
        exit: 'Saída registrada com sucesso!'
      };
      
      toast({
        title: "Sucesso",
        description: messages[type],
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível registrar o ponto. Tente novamente.",
      });
    }
  });

  useEffect(() => {
    // Redirect to login if not authenticated or not an employee
    if (!user || user.tipo !== 'empregado') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const registerTime = (type: 'entry' | 'break' | 'return' | 'exit') => {
    registerTimeMutation.mutate(type);
  };

  // Determine which buttons should be enabled based on today's record
  const canRegisterEntry = !todayRecord?.hora_entrada;
  const canRegisterBreak = todayRecord?.hora_entrada && !todayRecord?.hora_intervalo;
  const canRegisterReturn = todayRecord?.hora_intervalo && !todayRecord?.hora_retorno;
  const canRegisterExit = 
    (todayRecord?.hora_entrada && !todayRecord?.hora_intervalo && !todayRecord?.hora_saida) || 
    (todayRecord?.hora_retorno && !todayRecord?.hora_saida);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Sistema de Ponto Eletrônico</h1>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <NotificationSystem />
              </div>
              <div className="hidden md:flex items-center">
                <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center text-primary mr-2">
                  <span className="font-bold">{user.nome?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div>
                  <p className="font-medium">{user.nome}</p>
                  <p className="text-xs opacity-75">{user.cpf}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-blue-700" 
                onClick={handleLogout}
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Painel do Funcionário</h2>
          <div className="flex items-center gap-2">
            <CompactViewToggle 
              isCompact={isCompactView}
              onToggle={setIsCompactView}
            />
            <div className="md:hidden">
              <NotificationSystem />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Clock-in/out */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-text-primary mb-2">
                    {currentTime.toLocaleTimeString('pt-BR')}
                  </div>
                  <div className="text-text-secondary">
                    {currentTime.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-background-light rounded-lg p-4">
                    <h3 className="font-medium mb-1">Horário Previsto</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-text-secondary">Entrada</p>
                        <p className="font-semibold">
                          {loadingWorkSchedule ? '...' : (workSchedule?.hora_entrada || '08:00')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Saída</p>
                        <p className="font-semibold">
                          {loadingWorkSchedule ? '...' : (workSchedule?.hora_saida || '17:00')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Intervalo</p>
                        <p className="font-semibold">
                          {loadingWorkSchedule ? '...' : 
                            `${workSchedule?.intervalo_inicio || '12:00'} - ${workSchedule?.intervalo_fim || '13:00'}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Total</p>
                        <p className="font-semibold">8h</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-background-light rounded-lg p-4">
                    <h3 className="font-medium mb-1">Hoje</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-text-secondary">Entrada</p>
                        <p className="font-semibold">
                          {loadingTodayRecord ? '...' : 
                            (todayRecord?.hora_entrada ? 
                              new Date(todayRecord.hora_entrada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 
                              '--:--'
                            )
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Saída</p>
                        <p className="font-semibold">
                          {loadingTodayRecord ? '...' : 
                            (todayRecord?.hora_saida ? 
                              new Date(todayRecord.hora_saida).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 
                              '--:--'
                            )
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Intervalo</p>
                        <p className="font-semibold">
                          {loadingTodayRecord ? '...' : 
                            (todayRecord?.hora_intervalo ? 
                              new Date(todayRecord.hora_intervalo).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 
                              '--:--'
                            ) + ' - ' + 
                            (todayRecord?.hora_retorno ? 
                              new Date(todayRecord.hora_retorno).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 
                              '--:--'
                            )
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Status</p>
                        <p className="text-success font-semibold">
                          {loadingTodayRecord ? '...' : 
                            !todayRecord?.hora_entrada ? 'Não iniciado' : 
                            !todayRecord?.hora_saida ? 'Trabalhando' : 
                            'Concluído'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3 text-center">Registrar Ponto</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button 
                      variant={canRegisterEntry ? "default" : "secondary"}
                      disabled={!canRegisterEntry || registerTimeMutation.isPending}
                      onClick={() => registerTime('entry')}
                      className={!canRegisterEntry ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      Entrada
                    </Button>
                    <Button 
                      variant={canRegisterBreak ? "default" : "secondary"}
                      disabled={!canRegisterBreak || registerTimeMutation.isPending}
                      onClick={() => registerTime('break')}
                      className={!canRegisterBreak ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      Intervalo
                    </Button>
                    <Button 
                      variant={canRegisterReturn ? "default" : "secondary"}
                      disabled={!canRegisterReturn || registerTimeMutation.isPending}
                      onClick={() => registerTime('return')}
                      className={!canRegisterReturn ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      Retorno
                    </Button>
                    <Button 
                      variant={canRegisterExit ? "default" : "secondary"}
                      disabled={!canRegisterExit || registerTimeMutation.isPending}
                      onClick={() => registerTime('exit')}
                      className={!canRegisterExit ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      Saída
                    </Button>
                  </div>
                  <p className="text-xs text-text-secondary text-center mt-3">
                    Os botões ficam disponíveis conforme a sequência de registros do dia.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
              <PerformanceDashboard employeeId={user.id} compact={isCompactView || isMobile} />
              <WorkHoursSummary employeeId={user.id} compact={isCompactView || isMobile} />
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-lg">Histórico Recente</h2>
                  <Button variant="link" className="p-0">Ver Completo</Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Data</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Entrada</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Intervalo</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Retorno</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Saída</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loadingTimeRecords ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-2 whitespace-nowrap text-center">
                            Carregando histórico...
                          </td>
                        </tr>
                      ) : timeRecords?.length ? (
                        timeRecords.map((record, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {new Date(record.data).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {record.hora_entrada ? 
                                new Date(record.hora_entrada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 
                                '--:--'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {record.hora_intervalo ? 
                                new Date(record.hora_intervalo).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 
                                '--:--'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {record.hora_retorno ? 
                                new Date(record.hora_retorno).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 
                                '--:--'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {record.hora_saida ? 
                                new Date(record.hora_saida).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 
                                '--:--'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {record.total_horas || 'Em andamento'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-3 py-2 whitespace-nowrap text-center">
                            Nenhum registro encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Stats and Profile */}
          <div>
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-4">Resumo do Mês</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-text-secondary">Dias trabalhados</p>
                      <p className="font-medium">17 / 22</p>
                    </div>
                    <Progress value={77} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-text-secondary">Horas previstas</p>
                      <p className="font-medium">176h</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-text-secondary">Horas registradas</p>
                      <p className="font-medium">140h</p>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-text-secondary">Saldo de horas</p>
                      <p className="font-medium text-success">+4:30</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <EmployeeBadges employeeId={user.id} compact={isCompactView || isMobile} />
            
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-4">Minha Conta</h2>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-text-secondary">Nome</span>
                    <span className="font-medium">{user.nome}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-text-secondary">CPF</span>
                    <span className="font-medium">{user.cpf}</span>
                  </div>
                  {user.data_nascimento && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-text-secondary">Data de Nascimento</span>
                      <span className="font-medium">
                        {new Date(user.data_nascimento).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-text-secondary">Email</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                  )}
                  {user.telefone && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-text-secondary">Telefone</span>
                      <span className="font-medium">{user.telefone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-text-secondary">Data de Admissão</span>
                    <span className="font-medium">
                      {user.data_inicio 
                        ? new Date(user.data_inicio).toLocaleDateString('pt-BR')
                        : 'Não informado'}
                    </span>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowChangePasswordModal(true)}
                    >
                      Alterar Senha
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <ChangePasswordModal 
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
}
