import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Função para verificar se a tela é considerada mobile
    const checkIfMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768); // Consideramos telas abaixo de 768px como móveis
    };

    // Verificar ao montar o componente
    checkIfMobile();

    // Adicionar listener para redimensionamento da janela
    window.addEventListener('resize', checkIfMobile);

    // Limpar listener ao desmontar
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
}

// Alias para manter compatibilidade
export const useMobile = useIsMobile;