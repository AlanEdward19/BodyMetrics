import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.service';
import type { AthleteViewModel, CreateAthleteCommand, UpdateAthleteCommand } from '../types/api';
import { useAuth } from './AuthContext';

interface AthleteContextType {
  athletes: AthleteViewModel[];
  loading: boolean;
  error: string | null;
  addAthlete: (athleteData: CreateAthleteCommand) => Promise<string>;
  updateAthlete: (id: string, athleteData: UpdateAthleteCommand) => Promise<void>;
  deleteAthlete: (id: string) => Promise<void>;
  getAthleteById: (id: string) => AthleteViewModel | undefined;
  refreshAthletes: () => Promise<void>;
  searchAthletes: (fullName: string) => Promise<void>;
  loadMoreAthletes: () => Promise<void>;
  hasMore: boolean;
}

const AthleteContext = createContext<AthleteContextType | undefined>(undefined);

export function AthleteProvider({ children }: { children: React.ReactNode }) {
  const [athletes, setAthletes] = useState<AthleteViewModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [hasFetched, setHasFetched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fetchingRef = React.useRef(false);

  const fetchAthletes = useCallback(async (pageNum: number = 1) => {
    if (!user || fetchingRef.current) return;
    
    fetchingRef.current = true;
    setLoading(true);
    try {
      const response = await apiService.listAthletes({ page: pageNum, pageSize: 20 });
      if (pageNum === 1) {
        setAthletes(response.items);
      } else {
        setAthletes(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newItems = response.items.filter(a => !existingIds.has(a.id));
          return [...prev, ...newItems];
        });
      }
      setPage(response.page);
      setTotalPages(response.totalPages);
      setError(null);
      setHasFetched(true);
    } catch (err) {
      console.error('Erro ao buscar atletas:', err);
      setError('Não foi possível carregar os atletas.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user]);

  const loadMoreAthletes = useCallback(async () => {
    if (page < totalPages && !loading) {
      await fetchAthletes(page + 1);
    }
  }, [page, totalPages, loading, fetchAthletes]);

  useEffect(() => {
    if (user && !hasFetched) {
      fetchAthletes();
    }
    // Se o usuário deslogar, resetamos o estado
    if (!user) {
      setAthletes([]);
      setHasFetched(false);
    }
  }, [user, fetchAthletes, hasFetched]);

  const addAthlete = async (athleteData: CreateAthleteCommand) => {
    setLoading(true);
    try {
      const newAthlete = await apiService.createAthlete(athleteData);
      setAthletes(prev => [...prev, newAthlete]);
      return newAthlete.id;
    } catch (err) {
      console.error('Erro ao adicionar atleta:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAthlete = async (id: string, athleteData: UpdateAthleteCommand) => {
    setLoading(true);
    try {
      const updated = await apiService.updateAthlete(id, athleteData);
      setAthletes(prev => prev.map(a => a.id === id ? updated : a));
    } catch (err) {
      console.error('Erro ao atualizar atleta:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAthlete = async (id: string) => {
    setLoading(true);
    try {
      await apiService.deleteAthlete(id);
      setAthletes(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Erro ao deletar atleta:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAthleteById = (id: string) => {
    return athletes.find(a => a.id === id);
  };

  return (
    <AthleteContext.Provider value={{ 
      athletes, 
      loading, 
      error, 
      addAthlete, 
      updateAthlete, 
      deleteAthlete, 
      getAthleteById,
      refreshAthletes: () => fetchAthletes(1),
      loadMoreAthletes,
      hasMore: page < totalPages,
      searchAthletes: async (fullName: string) => {
        setLoading(true);
        try {
          const response = await apiService.listAthletes({ fullName, pageSize: 100 });
          // Mesclar com os existentes, evitando duplicatas por ID
          setAthletes(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const newItems = response.items.filter(a => !existingIds.has(a.id));
            return [...prev, ...newItems];
          });
        } catch (err) {
          console.error('Erro ao pesquisar atletas:', err);
        } finally {
          setLoading(false);
        }
      }
    }}>
      {children}
    </AthleteContext.Provider>
  );
}

export function useAthleteContext() {
  const context = useContext(AthleteContext);
  if (context === undefined) {
    throw new Error('useAthleteContext must be used within an AthleteProvider');
  }
  return context;
}
