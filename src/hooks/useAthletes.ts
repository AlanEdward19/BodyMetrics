import { useState, useEffect } from 'react';
import type { Athlete } from '../types/athlete';

const STORAGE_KEY = '@BodyMetrics:athletes';

const readFromStorage = (): Athlete[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export function useAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>(readFromStorage);

  // Sincroniza com outras insâtncias do hook (ex: ImportExcelModal e AthleteDashboard)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setAthletes(readFromStorage());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const persistAthletes = (updated: Athlete[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Dispatcha evento manual para sincronizar outras instâncias na mesma aba
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
      setAthletes(updated);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      alert('Não foi possível salvar os dados. O limite de armazenamento pode ter sido atingido (comum com fotos muito grandes).');
    }
  };

  const addAthlete = (athleteData: Omit<Athlete, 'id'>) => {
    const newAthlete: Athlete = {
      ...athleteData,
      id: crypto.randomUUID(),
    };
    const current = readFromStorage();
    persistAthletes([...current, newAthlete]);
    return newAthlete.id;
  };

  const updateAthlete = (id: string, athleteData: Omit<Athlete, 'id'>) => {
    const current = readFromStorage();
    persistAthletes(current.map(a => a.id === id ? { ...athleteData, id } : a));
  };

  const deleteAthlete = (id: string) => {
    const current = readFromStorage();
    persistAthletes(current.filter(a => a.id !== id));
  };

  const getAthleteById = (id: string) => {
    return athletes.find(a => a.id === id);
  };

  return { athletes, addAthlete, updateAthlete, deleteAthlete, getAthleteById };
}
