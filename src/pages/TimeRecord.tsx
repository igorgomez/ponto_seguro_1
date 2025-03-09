import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TimeRecord: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastRecord, setLastRecord] = useState<any>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
        }
      );
    }

    fetchLastRecord();
  }, []);

  const fetchLastRecord = async () => {
    try {
      const { data, error } = await supabase
        .from('time_records')
        .select('*')
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setLastRecord(data);
    } catch (error) {
      console.error('Erro ao buscar último registro:', error);
    }
  };

  const handleRecordTime = async (type: 'entry' | 'exit') => {
    if (!user || !location) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('time_records').insert({
        user_id: user.id,
        record_type: type,
        location: `${location.latitude},${location.longitude}`,
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;

      alert(`${type === 'entry' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
      await fetchLastRecord();
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      alert('Erro ao registrar ponto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center mb-8">
                <Clock className="mx-auto h-12 w-12 text-blue-600" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h2>
                <p className="mt-2 text-xl text-gray-600">
                  {format(new Date(), 'HH:mm:ss')}
                </p>
              </div>

              {location ? (
                <div className="flex items-center justify-center text-sm text-gray-500 mb-8">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Localização capturada</span>
                </div>
              ) : (
                <div className="text-center text-sm text-red-500 mb-8">
                  Ative a localização para registrar o ponto
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleRecordTime('entry')}
                  disabled={loading || !location}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Registrar Entrada
                </button>
                <button
                  onClick={() => handleRecordTime('exit')}
                  disabled={loading || !location}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Registrar Saída
                </button>
              </div>

              {lastRecord && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Último registro</h3>
                  <p className="text-sm text-gray-600">
                    Tipo: {lastRecord.record_type === 'entry' ? 'Entrada' : 'Saída'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Horário: {format(new Date(lastRecord.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Voltar para o Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeRecord;