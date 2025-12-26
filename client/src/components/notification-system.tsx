import { useState, useEffect } from "react";
import { BellIcon, BellRing, CheckCircle, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: Date;
  read: boolean;
}

export default function NotificationSystem() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Buscar informações do usuário
  const { data: employee } = useQuery({
    queryKey: ['/api/employees/me'],
  });
  
  // Buscar registros de ponto do dia
  const { data: todayRecord } = useQuery({
    queryKey: ['/api/time-records/today/me'],
  });
  
  // Buscar escala de trabalho
  const { data: workSchedule } = useQuery({
    queryKey: ['/api/work-schedule/me'],
  });
  
  // Efeito para gerar notificações baseadas nos dados
  useEffect(() => {
    if (employee && workSchedule) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const generatedNotifications: Notification[] = [];
      
      // Notificação para lembrar de registrar entrada
      if (!todayRecord?.hora_entrada && currentHour >= 7 && currentHour < 9) {
        generatedNotifications.push({
          id: 'reminder-entry',
          title: 'Lembrete de Entrada',
          message: 'Não esqueça de registrar sua entrada no sistema.',
          type: 'info',
          timestamp: new Date(),
          read: false
        });
      }
      
      // Notificação para lembrar de registrar intervalo
      if (todayRecord?.hora_entrada && !todayRecord?.hora_intervalo && 
          currentHour >= 11 && currentHour < 13) {
        generatedNotifications.push({
          id: 'reminder-break',
          title: 'Hora do Intervalo',
          message: 'Está chegando a hora do seu intervalo. Lembre-se de registrar.',
          type: 'info',
          timestamp: new Date(),
          read: false
        });
      }
      
      // Notificação para lembrar de retorno do intervalo
      if (todayRecord?.hora_intervalo && !todayRecord?.hora_retorno && 
          currentHour >= 12 && currentHour < 14) {
        generatedNotifications.push({
          id: 'reminder-return',
          title: 'Retorno do Intervalo',
          message: 'Não esqueça de registrar seu retorno do intervalo.',
          type: 'info',
          timestamp: new Date(),
          read: false
        });
      }
      
      // Notificação para lembrar de registrar saída
      if (todayRecord?.hora_entrada && !todayRecord?.hora_saida && 
          currentHour >= 16 && currentHour < 19) {
        generatedNotifications.push({
          id: 'reminder-exit',
          title: 'Lembrete de Saída',
          message: 'Está chegando a hora de saída. Não esqueça de registrar.',
          type: 'info',
          timestamp: new Date(),
          read: false
        });
      }
      
      // Notificação de sucesso para horas extras (simulado)
      if (todayRecord?.hora_saida && currentHour >= 18) {
        generatedNotifications.push({
          id: 'overtime-success',
          title: 'Horas Extras Registradas',
          message: 'Suas horas extras de hoje foram registradas com sucesso.',
          type: 'success',
          timestamp: new Date(),
          read: false
        });
      }
      
      // Notificação de sucesso para conquista de badge (simulado)
      if (todayRecord?.hora_entrada && Math.random() > 0.7) {
        generatedNotifications.push({
          id: 'badge-earned',
          title: 'Nova Conquista!',
          message: 'Você desbloqueou a conquista "Pontualidade Perfeita"',
          type: 'success',
          timestamp: new Date(),
          read: false
        });
      }
      
      // Adicionar notificações somente se elas já não existirem
      if (generatedNotifications.length > 0) {
        setNotifications(prevNotifications => {
          const existingIds = new Set(prevNotifications.map(n => n.id));
          const newNotifications = generatedNotifications.filter(n => !existingIds.has(n.id));
          
          return [...prevNotifications, ...newNotifications];
        });
      }
    }
  }, [employee, todayRecord, workSchedule]);
  
  // Atualizar contador de não lidas
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);
  
  const markAsRead = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) {
      return 'Agora';
    } else if (minutes < 60) {
      return `Há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
  };
  
  const getNotificationIcon = (type: 'info' | 'warning' | 'success') => {
    switch(type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-4 min-h-4 flex items-center justify-center text-[10px]"
              >
                {unreadCount}
              </Badge>
            </>
          ) : (
            <BellIcon className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-8"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 ${notification.read ? 'bg-background' : 'bg-muted/20'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <div className="py-6">
                <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-25" />
                <p className="text-sm">Você não tem novas notificações</p>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}