export interface Athlete {
  id: string;
  name: string;
  photoUrl?: string;
  cropSettings?: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
    rotation: number;
  };
  sport: string;
  sportObservation?: string;
  category: string;
  competitivePhase: string;
  birthDate: string;
  gender?: string;
  race?: string;
}
