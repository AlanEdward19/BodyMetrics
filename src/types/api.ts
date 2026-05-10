export const Phase = {
  Competitive: 0,
  PreSeason: 1,
  WeightLoss: 2,
  WeightGain: 3,
  Maintenance: 4
} as const;
export type Phase = (typeof Phase)[keyof typeof Phase];

export const Sex = {
  Male: 0,
  Female: 1,
  Other: 2
} as const;
export type Sex = (typeof Sex)[keyof typeof Sex];

export const Ethnicity = {
  Caucasian: 1,
  African: 2,
  Asian: 3
} as const;
export type Ethnicity = (typeof Ethnicity)[keyof typeof Ethnicity];

export interface CreateSportCommand {
  name: string;
  sectors: string[];
  categories: string[];
}

export interface UpdateSportCommand {
  id: string;
  name: string;
  sectors: string[];
  categories: string[];
}

export interface SportResponse {
  id: string;
  name: string;
  sectors: string[];
  categories: string[];
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GeneralMeasurements {
  weightKg: number;
  heightCm: number;
  sittingHeightCm: number;
}

export interface Skinfolds {
  rightTricepsMm: number;
  leftTricepsMm: number;
  subscapularMm: number;
  thoraxMm: number;
  subaxillaryMm: number;
  suprailiacMm: number;
  abdominalMm: number;
  rightThighMm: number;
  leftThighMm: number;
  rightCalfMm: number;
  leftCalfMm: number;
}

export interface Circumferences {
  shoulderCm: number;
  chestCm: number;
  rightArmCm: number;
  leftArmCm: number;
  waistCm: number;
  hipCm: number;
  rightMidThighCm: number;
  leftMidThighCm: number;
  rightCalfCm: number;
  leftCalfCm: number;
  rightWristCm: number;
  rightKneeCm: number;
  rightAnkleCm: number;
}

export interface PhysicalAssessment {
  assessmentDate: string; // ISO date
  generalMeasurements: GeneralMeasurements;
  skinfolds: Skinfolds | null;
  circumferences: Circumferences | null;
}

export interface ProfilePhotoUpload {
  fileName: string;
  contentType: string;
  base64Content: string;
}

export interface ProfilePhoto {
  blobPath: string;
  fileName: string;
  contentType: string;
  uploadedAtUtc: string;
  accessUrl: string | null;
}

export interface CreateAthleteCommand {
  fullName: string;
  sportId: string;
  sector: string;
  phase: Phase;
  category: string;
  sex: Sex;
  ethnicity: Ethnicity;
  birthDate: string; // ISO date
  physicalAssessments: PhysicalAssessment[];
  profilePhoto: ProfilePhotoUpload | null;
}

export interface UpdateAthleteCommand extends CreateAthleteCommand {
  id: string;
}

export interface AthleteViewModel {
  id: string;
  fullName: string;
  sportId: string;
  sportName: string;
  sector: string;
  phase: Phase;
  category: string;
  sex: Sex;
  ethnicity: Ethnicity;
  birthDate: string;
  profilePhoto: ProfilePhoto | null;
  physicalAssessments: PhysicalAssessment[];
}
