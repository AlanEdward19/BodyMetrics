import { useState, useEffect } from 'react';
import type { Assessment } from '../types/assessment';

const STORAGE_KEY = '@BodyMetrics:assessments';

const readFromStorage = (): Assessment[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export function useAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>(readFromStorage);

  // Sincroniza com outras instâncias do hook na mesma aba
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setAssessments(readFromStorage());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const persistAssessments = (updated: Assessment[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispara evento para sincronizar outras instâncias na mesma aba
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    setAssessments(updated);
  };

  const addAssessment = (assessmentData: Omit<Assessment, 'id'>) => {
    const newAssessment: Assessment = {
      ...assessmentData,
      id: crypto.randomUUID(),
    };
    const current = readFromStorage();
    persistAssessments([...current, newAssessment]);
  };

  const updateAssessment = (id: string, data: Partial<Assessment>) => {
    const current = readFromStorage();
    persistAssessments(current.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteAssessment = (id: string) => {
    const current = readFromStorage();
    persistAssessments(current.filter(a => a.id !== id));
  };

  const getAssessmentsByAthleteId = (athleteId: string) => {
    return assessments
      .filter(a => a.athleteId === athleteId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getAssessmentById = (id: string) => {
    return assessments.find(a => a.id === id);
  };

  return { 
    assessments, 
    addAssessment, 
    updateAssessment, 
    deleteAssessment,
    getAssessmentsByAthleteId,
    getAssessmentById
  };
}
