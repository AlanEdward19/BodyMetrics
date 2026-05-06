import { useState, useEffect } from 'react';
import type { Assessment } from '../types/assessment';

const STORAGE_KEY = '@BodyMetrics:assessments';

export function useAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments));
  }, [assessments]);

  const addAssessment = (assessmentData: Omit<Assessment, 'id'>) => {
    const newAssessment: Assessment = {
      ...assessmentData,
      id: crypto.randomUUID(),
    };
    setAssessments(prev => [...prev, newAssessment]);
  };

  const getAssessmentsByAthleteId = (athleteId: string) => {
    return assessments
      .filter(a => a.athleteId === athleteId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return { assessments, addAssessment, getAssessmentsByAthleteId };
}
