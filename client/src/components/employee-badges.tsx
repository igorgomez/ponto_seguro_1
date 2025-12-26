import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Award, Clock, Calendar, CheckCircle, Target, Zap, 
  ThumbsUp, Star, Shield, BookOpen 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmployeeBadgesProps {
  employeeId?: number;
  compact?: boolean;
}

interface EmployeeBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  achieved: boolean;
  progress?: number;
  totalNeeded?: number;
}

export default function EmployeeBadges({ employeeId, compact = false }: EmployeeBadgesProps) {
  // Buscar registros de ponto
  const { data: timeRecords, isLoading } = useQuery({
    queryKey: employeeId 
      ? ['/api/time-records/me'] 
      : ['/api/time-records'],
  });
  
  // Estado para badges
  const [badges, setBadges] = useState<EmployeeBadge[]>([]);
  
  // Processar badges quando os dados forem carregados
  useEffect(() => {
    if (timeRecords && timeRecords.length > 0) {
      // Em um sistema real, processaríamos os registros para gerar as conquistas
      // Aqui vamos simular as badges para o protótipo
      
      // Algumas conquistas que podem ser implementadas:
      const badgesList: EmployeeBadge[] = [
        {
          id: "pontualidade",
          name: "Pontualidade Perfeita",
          description: "Registrou entrada no horário por 30 dias consecutivos",
          icon: <Clock className="h-4 w-4" />,
          color: "bg-blue-500 text-white",
          achieved: true,
        },
        {
          id: "assiduidade",
          name: "Assiduidade Total",
          description: "Não teve faltas por 3 meses consecutivos",
          icon: <Calendar className="h-4 w-4" />,
          color: "bg-green-500 text-white",
          achieved: true,
        },
        {
          id: "dedicated",
          name: "Dedicação",
          description: "Completou 1 ano sem atrasos nas entradas",
          icon: <Target className="h-4 w-4" />,
          color: "bg-purple-500 text-white",
          achieved: false,
          progress: 75,
          totalNeeded: 100,
        },
        {
          id: "efficiency",
          name: "Eficiência",
          description: "Completou as metas de horas mensais por 6 meses seguidos",
          icon: <Zap className="h-4 w-4" />,
          color: "bg-yellow-500 text-black",
          achieved: false,
          progress: 4,
          totalNeeded: 6,
        },
        {
          id: "feedback",
          name: "Feedback Positivo",
          description: "Recebeu 10 avaliações positivas do empregador",
          icon: <ThumbsUp className="h-4 w-4" />,
          color: "bg-pink-500 text-white",
          achieved: false,
          progress: 7,
          totalNeeded: 10,
        },
        {
          id: "veteran",
          name: "Veterano",
          description: "Completou 3 anos de serviço",
          icon: <Star className="h-4 w-4" />,
          color: "bg-amber-500 text-white",
          achieved: false,
          progress: 1.5,
          totalNeeded: 3,
        },
        {
          id: "overtime",
          name: "Hora Extra",
          description: "Trabalhou horas extras quando necessário 20 vezes",
          icon: <CheckCircle className="h-4 w-4" />,
          color: "bg-red-500 text-white",
          achieved: true,
        },
        {
          id: "training",
          name: "Treinamento",
          description: "Completou todos os treinamentos de segurança",
          icon: <Shield className="h-4 w-4" />,
          color: "bg-indigo-500 text-white",
          achieved: true,
        },
      ];
      
      setBadges(badgesList);
    }
  }, [timeRecords]);
  
  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <Award className="h-4 w-4 text-primary" />
              Conquistas
            </h3>
            <span className="text-xs text-muted-foreground">
              {badges.filter(b => b.achieved).length}/{badges.length}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            <TooltipProvider>
              {badges.filter(badge => badge.achieved).slice(0, 5).map(badge => (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${badge.color}`}>
                      {badge.icon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-xs">{badge.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {badges.filter(b => b.achieved).length > 5 && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-medium">
                  +{badges.filter(b => b.achieved).length - 5}
                </div>
              )}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Conquistas e Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="flex justify-between items-center mb-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Progresso Total</p>
              <div className="text-2xl font-bold">{badges.filter(b => b.achieved).length}/{badges.length}</div>
            </div>
            <div className="text-4xl text-primary">
              <Award className="h-12 w-12" />
            </div>
          </div>
          
          {/* Badges Conquistados */}
          <div>
            <h4 className="text-sm font-medium mb-2">Conquistados</h4>
            <div className="grid grid-cols-2 gap-2">
              {badges.filter(badge => badge.achieved).map(badge => (
                <div key={badge.id} className="flex items-center p-2 bg-muted/30 rounded-lg">
                  <div className={`mr-3 w-8 h-8 rounded-full flex items-center justify-center ${badge.color}`}>
                    {badge.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{badge.name}</div>
                    <div className="text-xs text-muted-foreground">{badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Em Progresso */}
          <div>
            <h4 className="text-sm font-medium mb-2">Em Progresso</h4>
            <div className="space-y-3">
              {badges.filter(badge => !badge.achieved && badge.progress !== undefined).map(badge => (
                <div key={badge.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`mr-2 w-5 h-5 rounded-full flex items-center justify-center ${badge.color}`}>
                        {badge.icon}
                      </div>
                      <span className="text-sm font-medium">{badge.name}</span>
                    </div>
                    <span className="text-xs">
                      {badge.progress} / {badge.totalNeeded}
                    </span>
                  </div>
                  <Progress value={(badge.progress! / badge.totalNeeded!) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}