import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Label, Tooltip,
  Legend
} from 'recharts';
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface WorkHoursSummaryProps {
  employeeId?: number;
  compact?: boolean;
}

// Cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function WorkHoursSummary({ employeeId, compact = false }: WorkHoursSummaryProps) {
  // Buscar registros de ponto
  const { data: timeRecords, isLoading } = useQuery({
    queryKey: employeeId 
      ? ['/api/time-records/me'] 
      : ['/api/time-records'],
  });
  
  // Estado para dados do gráfico
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Processar dados quando carregados
  useEffect(() => {
    if (timeRecords && timeRecords.length > 0) {
      // Exemplo de processamento
      // Em um sistema real, usaríamos dados reais calculados a partir do histórico
      // e do banco de horas
      
      setChartData([
        { name: 'Concluído', value: 138 },
        { name: 'Restante', value: 38 },
        { name: 'Extras', value: 16 },
      ]);
    }
  }, [timeRecords]);
  
  // Calcular estatísticas
  const totalHorasMes = 176; // 8h * 22 dias úteis em média
  const horasTrabalhadas = timeRecords?.length || 0;
  const percentComplete = Math.min(100, Math.round((horasTrabalhadas / totalHorasMes) * 100));
  
  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4 text-primary" />
              Horas do Mês
            </h3>
            <span className="text-xs text-muted-foreground">
              {horasTrabalhadas}h/{totalHorasMes}h
            </span>
          </div>
          
          <div className="flex items-center justify-center py-2">
            <div className="w-full">
              <Progress value={percentComplete} className="h-2 mb-1" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Concluído: {percentComplete}%</span>
                <span>Extras: +4:30h</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Banco de Horas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="w-full lg:w-1/2 h-[180px] flex items-center justify-center mb-4 lg:mb-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <Label
                      value="+4:30"
                      position="center"
                      fill="#333"
                      style={{ fontSize: '22px', fontWeight: 'bold' }}
                    />
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}h`, 'Horas']}
                    labelFormatter={(name) => `${name}`}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                Nenhum registro para exibir
              </div>
            )}
          </div>
          
          <div className="w-full lg:w-1/2 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-muted-foreground">Horas previstas</p>
                <p className="font-medium">{totalHorasMes}h</p>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-muted-foreground">Horas trabalhadas</p>
                <p className="font-medium">{horasTrabalhadas + 138}h</p>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-muted-foreground">Horas extras</p>
                <p className="font-medium text-success">+4:30h</p>
              </div>
              <Progress value={25} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-muted-foreground">Saldo total</p>
                <p className="font-medium text-success">+4:30h</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}