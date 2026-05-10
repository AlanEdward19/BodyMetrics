import { useAthleteContext } from '../contexts/AthleteContext';

export function useAthletes() {
  return useAthleteContext();
}
