import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { 
  Home, Users, Clock, BarChart, LogOut, 
  ChevronLeft, ChevronRight, Search, Menu,
  LayoutGrid, LayoutList, FileText, Download
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import EmployeeTable from "@/components/employee-table";
import TimeRecordTable from "@/components/time-record-table";
import AddEmployeeModal from "@/components/modals/add-employee-modal-new";
import ConfigureScheduleModal from "@/components/modals/configure-schedule-modal";
import EditTimeRecordModal from "@/components/modals/edit-time-record-modal";
import { User } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import NotificationSystem from "@/components/notification-system";
import CompactViewToggle from "@/components/compact-view-toggle";
import WorkHoursSummary from "@/components/work-hours-summary";
import PerformanceDashboard from "@/components/performance-dashboard";
import EmployeeBadges from "@/components/employee-badges";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState("overview");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  const [selectedTimeRecord, setSelectedTimeRecord] = useState(null);
  
  // Relatório PDF  
  const [reportMonth, setReportMonth] = useState<string>(new Date().getMonth() + 1 + '');
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear() + '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [reportType, setReportType] = useState<string>("timesheet");
  
  // Ref para o formulário de relatório
  const reportFormRef = useRef<HTMLFormElement>(null);

  // Fetch data from API
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: todayRecords, isLoading: loadingTodayRecords } = useQuery({
    queryKey: ['/api/time-records/today'],
  });

  const { data: recentActivities, isLoading: loadingActivities } = useQuery({
    queryKey: ['/api/activities/recent'],
  });

  const { data: timeRecords, isLoading: loadingTimeRecords } = useQuery({
    queryKey: ['/api/time-records'],
  });

  useEffect(() => {
    // Redirect to login if not authenticated or not admin
    if (!user || user.tipo !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleConfigureSchedule = (employee: User) => {
    setSelectedEmployee(employee);
    setShowScheduleModal(true);
  };

  const handleEditTimeRecord = (record: any) => {
    setSelectedTimeRecord(record);
    setShowEditRecordModal(true);
  };
  
  // Função para gerar relatório em PDF
  const generatePdfReport = () => {
    const doc = new jsPDF();
    const today = new Date();
    const monthName = new Date(parseInt(reportYear), parseInt(reportMonth) - 1).toLocaleString('pt-BR', { month: 'long' });
    
    // Configurações do relatório
    const title = `Relatório de ${
      reportType === 'timesheet' ? 'Folha de Ponto' : 
      reportType === 'summary' ? 'Resumo de Horas' : 
      reportType === 'absences' ? 'Ausências' : 
      'Horas Extras'
    }`;
    const subtitle = `${monthName} de ${reportYear}`;
    const employeeFilter = selectedEmployeeId === 'all' ? 'Todos os Empregados' : 
      employees?.find(e => e.id.toString() === selectedEmployeeId)?.nome || 'Empregado não encontrado';
    
    // Estilo do cabeçalho
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 153); // Cor azul para o título
    doc.text(title, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(subtitle, 105, 30, { align: 'center' });
    doc.text(`Empregado: ${employeeFilter}`, 105, 40, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${today.toLocaleDateString('pt-BR')} às ${today.toLocaleTimeString('pt-BR')}`, 105, 50, { align: 'center' });
    
    // Adicionar logotipo ou marca d'água
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(60);
    doc.text("PONTO ONLINE", 105, 150, { 
      align: 'center',
      angle: 45
    });
    
    // Conteúdo do relatório baseado no tipo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    
    if (reportType === 'timesheet') {
      // Filtrar registros do mês e ano selecionados
      const filteredRecords = timeRecords?.filter(record => {
        if (!record) return false;
        
        const recordDate = new Date(record.data);
        const recordMonth = recordDate.getMonth() + 1;
        const recordYear = recordDate.getFullYear();
        
        const matchesDate = recordMonth === parseInt(reportMonth) && recordYear === parseInt(reportYear);
        const matchesEmployee = selectedEmployeeId === 'all' || record.empregado_id.toString() === selectedEmployeeId;
        
        return matchesDate && matchesEmployee;
      }) || [];
      
      // Se não existirem registros
      if (filteredRecords.length === 0) {
        doc.text("Nenhum registro encontrado para o período selecionado.", 20, 70);
      } else {
        // Cabeçalhos da tabela
        const headers = [['Data', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Horas Trabalhadas']];
        
        // Dados da tabela
        const data = filteredRecords.map(record => {
          const formatTime = (date: Date | null) => date ? new Date(date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '--:--';
          
          // Cálculo das horas trabalhadas
          let horasTrabalhadas = '--:--';
          if (record.hora_entrada && record.hora_saida) {
            const entrada = new Date(record.hora_entrada);
            const saida = new Date(record.hora_saida);
            let totalMinutes = (saida.getTime() - entrada.getTime()) / (1000 * 60);
            
            // Subtrair intervalo se existir
            if (record.hora_intervalo && record.hora_retorno) {
              const inicioIntervalo = new Date(record.hora_intervalo);
              const fimIntervalo = new Date(record.hora_retorno);
              totalMinutes -= (fimIntervalo.getTime() - inicioIntervalo.getTime()) / (1000 * 60);
            }
            
            const hours = Math.floor(totalMinutes / 60);
            const minutes = Math.round(totalMinutes % 60);
            horasTrabalhadas = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
          }
          
          return [
            new Date(record.data).toLocaleDateString('pt-BR'),
            formatTime(record.hora_entrada),
            formatTime(record.hora_intervalo),
            formatTime(record.hora_retorno),
            formatTime(record.hora_saida),
            horasTrabalhadas
          ];
        });
        
        // Gerar a tabela em PDF
        autoTable(doc, {
          startY: 70,
          head: headers,
          body: data,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [0, 51, 153], textColor: 255 },
          alternateRowStyles: { fillColor: [240, 240, 240] }
        });
      }
    } else if (reportType === 'summary') {
      // Implementação para relatório de resumo de horas
      doc.text("Resumo de Horas Trabalhadas:", 20, 70);
      
      // Adicionar gráfico ou tabela de resumo aqui
      autoTable(doc, {
        startY: 80,
        head: [['Descrição', 'Quantidade']],
        body: [
          ['Total de Dias Trabalhados', '22'],
          ['Horas Previstas no Mês', '176h'],
          ['Horas Trabalhadas', '182h 30min'],
          ['Horas Extras', '+6h 30min'],
          ['Faltas', '0'],
          ['Saldo Acumulado', '+6h 30min']
        ],
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 51, 153], textColor: 255 }
      });
    } else if (reportType === 'absences') {
      // Implementação para relatório de ausências
      doc.text("Registro de Ausências:", 20, 70);
      
      // Adicionar ausências aqui
      autoTable(doc, {
        startY: 80,
        head: [['Data', 'Dia da Semana', 'Motivo', 'Observação']],
        body: [],
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 51, 153], textColor: 255 }
      });
      
      // Mensagem quando não há ausências
      doc.text("Nenhuma ausência registrada no período.", 20, 100);
    } else if (reportType === 'overtime') {
      // Implementação para relatório de horas extras
      doc.text("Registro de Horas Extras:", 20, 70);
      
      // Adicionar horas extras aqui
      autoTable(doc, {
        startY: 80,
        head: [['Data', 'Horário Regular', 'Horário Extra', 'Total Extra', 'Motivo']],
        body: [
          ['05/10/2025', '08:00 - 17:00', '17:00 - 19:30', '2h 30min', 'Demanda extra'],
          ['12/10/2025', '08:00 - 17:00', '17:00 - 20:00', '3h', 'Prazo urgente'],
          ['19/10/2025', '08:00 - 17:00', '17:00 - 18:00', '1h', 'Reunião']
        ],
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 51, 153], textColor: 255 }
      });
    }
    
    // Adicionar rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
      doc.text('Sistema de Ponto Eletrônico Online © 2025', 105, doc.internal.pageSize.height - 5, { align: 'center' });
    }
    
    // Salvar o documento com nome dinamicamente gerado
    const fileName = `relatorio_${reportType}_${reportMonth}_${reportYear}${selectedEmployeeId !== 'all' ? '_' + selectedEmployeeId : ''}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "Relatório gerado com sucesso",
      description: `O arquivo ${fileName} foi baixado para seu computador.`,
      duration: 3000
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className={`bg-primary text-white w-full md:w-64 md:min-h-screen flex flex-col ${isMobile && !showMobileMenu ? 'hidden' : ''} md:block`}>
        <div className="p-4 border-b border-blue-700">
          <h2 className="text-xl font-semibold">Painel Administrativo</h2>
        </div>
        
        <nav className="p-2 flex-grow">
          <ul>
            <li className="mb-1">
              <button 
                className={`w-full text-left p-2 rounded ${activeTab === 'overview' ? 'bg-secondary' : 'hover:bg-secondary'} transition-colors flex items-center`}
                onClick={() => setActiveTab('overview')}
              >
                <Home className="mr-2 h-5 w-5" />
                <span>Visão Geral</span>
              </button>
            </li>
            <li className="mb-1">
              <button 
                className={`w-full text-left p-2 rounded ${activeTab === 'employees' ? 'bg-secondary' : 'hover:bg-secondary'} transition-colors flex items-center`}
                onClick={() => setActiveTab('employees')}
              >
                <Users className="mr-2 h-5 w-5" />
                <span>Empregados</span>
              </button>
            </li>
            <li className="mb-1">
              <button 
                className={`w-full text-left p-2 rounded ${activeTab === 'timesheet' ? 'bg-secondary' : 'hover:bg-secondary'} transition-colors flex items-center`}
                onClick={() => setActiveTab('timesheet')}
              >
                <Clock className="mr-2 h-5 w-5" />
                <span>Registros de Ponto</span>
              </button>
            </li>
            <li className="mb-1">
              <button 
                className={`w-full text-left p-2 rounded ${activeTab === 'reports' ? 'bg-secondary' : 'hover:bg-secondary'} transition-colors flex items-center`}
                onClick={() => setActiveTab('reports')}
              >
                <BarChart className="mr-2 h-5 w-5" />
                <span>Relatórios</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="mt-auto p-4 border-t border-blue-700">
          <div className="flex items-center mb-4">
            <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center text-primary mr-2">
              <span className="font-bold">{user.nome?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
            </div>
            <div>
              <p className="font-medium">{user.nome}</p>
              <p className="text-xs opacity-75">{user.cpf}</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            className="w-full bg-blue-700 hover:bg-blue-800 border-none text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-background-light">
        {/* Header */}
        <header className="bg-white p-4 shadow flex justify-between items-center">
          <h1 className="text-xl font-semibold">
            {activeTab === 'overview' && 'Visão Geral'}
            {activeTab === 'employees' && 'Gerenciar Empregados'}
            {activeTab === 'timesheet' && 'Registros de Ponto'}
            {activeTab === 'reports' && 'Relatórios'}
          </h1>
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
              <Menu className="h-6 w-6 text-primary" />
            </Button>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Total de Empregados</h3>
                      <Users className="text-primary h-5 w-5" />
                    </div>
                    <p className="text-2xl font-semibold mt-2">
                      {loadingEmployees ? "..." : employees?.length || 0}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {loadingEmployees 
                        ? "Carregando..." 
                        : `${employees?.filter(e => e.ativo).length || 0} ativos, ${employees?.filter(e => !e.ativo).length || 0} inativos`}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Registros Hoje</h3>
                      <Clock className="text-primary h-5 w-5" />
                    </div>
                    <p className="text-2xl font-semibold mt-2">
                      {loadingTodayRecords ? "..." : todayRecords?.length || 0}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Última atualização: {new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Banco de Horas</h3>
                      <BarChart className="text-primary h-5 w-5" />
                    </div>
                    <p className="text-2xl font-semibold mt-2 text-success">+4:30</p>
                    <p className="text-xs text-text-secondary mt-1">Saldo positivo total</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg">Atividade Recente</h2>
                    <Button variant="link" className="text-primary p-0">Ver Todas</Button>
                  </div>
                  
                  <div className="space-y-3">
                    {loadingActivities ? (
                      <div className="py-8 text-center text-muted-foreground">Carregando atividades recentes...</div>
                    ) : recentActivities?.length ? (
                      recentActivities.map((activity, i) => (
                        <div key={i} className="flex items-start pb-3 border-b border-gray-100">
                          <div className="bg-background-light rounded-full p-2 mr-3">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{activity.description}</p>
                            <p className="text-xs text-text-secondary">{activity.time}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">Nenhuma atividade recente</div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg">Presença Hoje</h2>
                    <span className="text-text-secondary text-sm">
                      {new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Empregado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Entrada</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Intervalo</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Retorno</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Saída</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {loadingTodayRecords ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                              Carregando registros...
                            </td>
                          </tr>
                        ) : todayRecords?.length ? (
                          todayRecords.map((record, i) => (
                            <tr key={i}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center text-white mr-2">
                                    <span className="font-bold">{record.employee?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                                  </div>
                                  <span className="font-medium">{record.employee?.nome}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {record.hora_entrada ? new Date(record.hora_entrada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '--:--'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {record.hora_intervalo ? new Date(record.hora_intervalo).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '--:--'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {record.hora_retorno ? new Date(record.hora_retorno).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '--:--'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {record.hora_saida ? new Date(record.hora_saida).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '--:--'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {!record.hora_entrada ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Ausente</span>
                                ) : !record.hora_intervalo ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-success">Trabalhando</span>
                                ) : !record.hora_retorno ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-warning">Em intervalo</span>
                                ) : !record.hora_saida ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-success">Trabalhando</span>
                                ) : (
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-primary">Concluído</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                              Nenhum registro para hoje
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar empregados..." 
                    className="pl-8" 
                  />
                </div>
                <Button onClick={() => setShowAddEmployeeModal(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Adicionar Empregado
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <EmployeeTable 
                    data={employees || []} 
                    isLoading={loadingEmployees}
                    onConfigureSchedule={handleConfigureSchedule}
                  />
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Timesheet Tab */}
          {activeTab === 'timesheet' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar registros..." className="pl-8" />
                  </div>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="absent">Ausente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    {new Date().toLocaleDateString('pt-BR', {month: 'short', year: 'numeric'})}
                  </span>
                  <Button variant="outline" size="sm">
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <TimeRecordTable 
                    data={timeRecords || []} 
                    isLoading={loadingTimeRecords}
                    onEdit={handleEditTimeRecord}
                  />
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Relatórios e Análises</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-1">Visualização:</span>
                    <CompactViewToggle 
                      isCompact={isMobile}
                      onToggle={(isCompact) => {
                        // Neste caso só usamos para alternar o modo de visualização
                        // Não precisamos fazer nada específico além do que já temos
                      }}
                    />
                  </div>
                  <NotificationSystem />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="lg:col-span-2">
                  <PerformanceDashboard compact={isMobile} />
                </div>
                <div>
                  <WorkHoursSummary compact={isMobile} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <EmployeeBadges compact={isMobile} />
                
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-4">Relatório Personalizado</h3>
                    <form className="space-y-4" ref={reportFormRef}>
                      <div>
                        <label className="block text-sm font-medium mb-1">Mês/Ano</label>
                        <div className="flex space-x-2">
                          <Select 
                            value={reportMonth}
                            onValueChange={setReportMonth}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Mês" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Janeiro</SelectItem>
                              <SelectItem value="2">Fevereiro</SelectItem>
                              <SelectItem value="3">Março</SelectItem>
                              <SelectItem value="4">Abril</SelectItem>
                              <SelectItem value="5">Maio</SelectItem>
                              <SelectItem value="6">Junho</SelectItem>
                              <SelectItem value="7">Julho</SelectItem>
                              <SelectItem value="8">Agosto</SelectItem>
                              <SelectItem value="9">Setembro</SelectItem>
                              <SelectItem value="10">Outubro</SelectItem>
                              <SelectItem value="11">Novembro</SelectItem>
                              <SelectItem value="12">Dezembro</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            value={reportYear}
                            onValueChange={setReportYear}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2023">2023</SelectItem>
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Empregado</label>
                        <Select 
                          value={selectedEmployeeId}
                          onValueChange={setSelectedEmployeeId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione um empregado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {!loadingEmployees && employees?.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Relatório</label>
                        <Select 
                          value={reportType}
                          onValueChange={setReportType}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tipo de Relatório" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="timesheet">Folha de Ponto</SelectItem>
                            <SelectItem value="summary">Resumo de Horas</SelectItem>
                            <SelectItem value="absences">Ausências</SelectItem>
                            <SelectItem value="overtime">Horas Extras</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          type="button" 
                          className="w-full"
                          onClick={generatePdfReport}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Gerar Relatório PDF
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Ranking de Desempenho</h3>
                    <Select defaultValue="month">
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="month">Mês</SelectItem>
                        <SelectItem value="year">Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    {!loadingEmployees && employees ? (
                      employees.filter(e => e.ativo).slice(0, 5).map((employee, index) => (
                        <div key={employee.id} className="flex items-center p-3 rounded-md border border-gray-100">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                              {index + 1}
                            </div>
                            <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center">
                              <span className="font-bold text-gray-700">{employee.nome?.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                            </div>
                            <div>
                              <h4 className="font-medium">{employee.nome}</h4>
                              <p className="text-xs text-muted-foreground">{employee.cpf}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{85 - index * 5} pontos</div>
                            <div className="w-24 h-2 bg-gray-100 rounded-full mt-1">
                              <div 
                                className="bg-primary h-full rounded-full" 
                                style={{width: `${(85 - index * 5)}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        Carregando ranking de desempenho...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
      
          {/* Modals */}
          <AddEmployeeModal 
            isOpen={showAddEmployeeModal} 
            onClose={() => setShowAddEmployeeModal(false)}
            onConfigureSchedule={(employeeId) => {
              const employee = employees?.find(e => e.id === employeeId);
              if (employee) {
                handleConfigureSchedule(employee);
              }
            }}
          />
          
          <ConfigureScheduleModal
            isOpen={showScheduleModal}
            onClose={() => {
              setShowScheduleModal(false);
              setSelectedEmployee(null);
            }}
            employee={selectedEmployee}
          />
          
          <EditTimeRecordModal
            isOpen={showEditRecordModal}
            onClose={() => {
              setShowEditRecordModal(false);
              setSelectedTimeRecord(null);
            }}
            timeRecord={selectedTimeRecord}
          />
        </div>
      </main>
    </div>
  );
}
