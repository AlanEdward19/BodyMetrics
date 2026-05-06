import { useState, useEffect } from 'react';
import type { Athlete } from '../types/athlete';

const STORAGE_KEY = '@BodyMetrics:athletes';



export function useAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Set initial data if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(athletes));
  }, [athletes]);

  const addAthlete = (athleteData: Omit<Athlete, 'id'>) => {
    const newAthlete: Athlete = {
      ...athleteData,
      id: crypto.randomUUID(),
    };
    setAthletes(prev => [...prev, newAthlete]);
    return newAthlete.id;
  };

  const updateAthlete = (id: string, athleteData: Omit<Athlete, 'id'>) => {
    setAthletes(prev => prev.map(a => a.id === id ? { ...athleteData, id } : a));
  };

  const deleteAthlete = (id: string) => {
    setAthletes(prev => prev.filter(a => a.id !== id));
  };

  const getAthleteById = (id: string) => {
    return athletes.find(a => a.id === id);
  };

  return { athletes, addAthlete, updateAthlete, deleteAthlete, getAthleteById };
}
