import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeRecord } from "@shared/schema";

interface TimeRecordTableProps {
  data: TimeRecord[];
  isLoading: boolean;
  onEdit: (record: TimeRecord) => void;
}

export default function TimeRecordTable({ data, isLoading, onEdit }: TimeRecordTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Empregado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Data</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Entrada</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Intervalo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Retorno</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Saída</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Horas</th>
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
                <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-12" /></td>
                <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-12" /></td>
                <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-12" /></td>
                <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-12" /></td>
                <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-4 w-16" /></td>
                <td className="px-4 py-3 whitespace-nowrap"><Skeleton className="h-6 w-6 rounded-full" /></td>
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
        Nenhum registro de ponto encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Empregado</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Data</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Entrada</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Intervalo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Retorno</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Saída</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Horas</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((record) => (
            <tr key={record.id}>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center text-white mr-2">
                    <span className="font-bold">
                      {record.employee?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'NA'}
                    </span>
                  </div>
                  <span className="font-medium">{record.employee?.nome || 'N/A'}</span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {record.data ? new Date(record.data).toLocaleDateString('pt-BR') : 'N/A'}
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
                {record.total_horas || (
                  record.hora_saida ? (
                    <span className="text-success">Calculando...</span>
                  ) : (
                    'Em andamento'
                  )
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary hover:text-secondary"
                  title="Editar registro"
                  onClick={() => onEdit(record)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
