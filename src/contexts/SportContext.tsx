import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.service';
import type { SportResponse } from '../types/api';
import { useAuth } from './AuthContext';

interface SportContextType {
  sports: SportResponse[];
  loading: boolean;
  error: string | null;
  refreshSports: () => Promise<void>;
}

const SportContext = createContext<SportContextType | undefined>(undefined);

export function SportProvider({ children }: { children: React.ReactNode }) {
  const [sports, setSports] = useState<SportResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [hasFetched, setHasFetched] = useState(false);
  const fetchingRef = React.useRef(false);

  const fetchSports = useCallback(async () => {
    if (!user || fetchingRef.current) return;
    
    fetchingRef.current = true;
    setLoading(true);
    try {
      const response = await apiService.listSports({ pageSize: 100 });
      setSports(response.items);
      setError(null);
      setHasFetched(true);
    } catch (err) {
      console.error('Erro ao buscar esportes:', err);
      setError('Não foi possível carregar os esportes.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user && !hasFetched) {
      fetchSports();
    }
    if (!user) {
      setSports([]);
      setHasFetched(false);
    }
  }, [user, fetchSports, hasFetched]);

  return (
    <SportContext.Provider value={{ 
      sports, 
      loading, 
      error, 
      refreshSports: fetchSports 
    }}>
      {children}
    </SportContext.Provider>
  );
}

export function useSports() {
  const context = useContext(SportContext);
  if (context === undefined) {
    throw new Error('useSports must be used within a SportProvider');
  }
  return context;
}
