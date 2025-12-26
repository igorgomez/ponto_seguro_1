import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp } from "lucide-react";

interface PerformanceDashboardProps {
  employeeId?: number;
  compact?: boolean;
}

export default function PerformanceDashboard({ employeeId, compact = false }: PerformanceDashboardProps) {
  // Buscar registros de ponto
  const { data: timeRecords, isLoading } = useQuery({
    queryKey: employeeId 
      ? ['/api/time-records/me'] 
      : ['/api/time-records'],
  });
  
  // Estados para dados de gráficos
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  
  useEffect(() => {
    // Gerar dados para demonstração
    if (timeRecords && timeRecords.length > 0) {
      // Em um sistema real, processaríamos os registros para gerar estatísticas reais
      // Aqui vamos simular dados de desempenho para demonstração
      
      // Dados semanais
      setWeeklyData([
        { name: 'Segunda', horas: 8.5, media: 8.0 },
        { name: 'Terça', horas: 7.8, media: 8.0 },
        { name: 'Quarta', horas: 8.2, media: 8.0 },
        { name: 'Quinta', horas: 8.0, media: 8.0 },
        { name: 'Sexta', horas: 7.5, media: 8.0 },
      ]);
      
      // Dados mensais
      setMonthlyData([
        { name: 'Semana 1', horas: 39, pontualidade: 92 },
        { name: 'Semana 2', horas: 41, pontualidade: 96 },
        { name: 'Semana 3', horas: 38, pontualidade: 88 },
        { name: 'Semana 4', horas: 40, pontualidade: 94 },
      ]);
    }
  }, [timeRecords]);
  
  // Calcular métricas
  const registrosNoMes = timeRecords?.length || 0;
  const registrosPontuais = timeRecords?.filter((r: any) => 
    r.hora_entrada && new Date(r.hora_entrada).getHours() <= 8 && 
    new Date(r.hora_entrada).getMinutes() <= 5
  )?.length || 0;
  
  const pontualidade = registrosNoMes ? Math.round((registrosPontuais / registrosNoMes) * 100) : 0;
  
  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              Performance
            </h3>
            <span className={`text-xs ${pontualidade >= 90 ? 'text-success' : 'text-warning'}`}>
              {pontualidade}% pontualidade
            </span>
          </div>
          
          <div className="h-[100px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <Line 
                  type="monotone" 
                  dataKey="horas" 
                  stroke="#0088FE" 
                  strokeWidth={2} 
                  dot={{ r: 2 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="media" 
                  stroke="#FF8042" 
                  strokeWidth={1} 
                  strokeDasharray="3 3" 
                />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-[220px] w-full">
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={weeklyData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    domain={[0, 10]}
                    tickCount={6}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ fontSize: '12px' }}
                    formatter={(value: number) => [`${value}h`, 'Horas']}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    align="center"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="horas" 
                    name="Horas Trabalhadas" 
                    stroke="#0088FE" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }} 
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="media" 
                    name="Meta Diária" 
                    stroke="#FF8042" 
                    strokeWidth={1.5}
                    strokeDasharray="3 3" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                Nenhum registro para exibir
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="text-2xl font-bold text-success">{pontualidade}%</div>
              <div className="text-sm text-muted-foreground">Pontualidade</div>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="text-2xl font-bold">{registrosNoMes}</div>
              <div className="text-sm text-muted-foreground">Dias Trabalhados</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}