import axios, { type AxiosInstance } from 'axios';
import { auth } from '../lib/firebase';
import * as Types from '../types/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar o token do Firebase em cada requisição
    this.api.interceptors.request.use(async (config) => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });
  }

  // --- SPORTS ENDPOINTS ---

  async listSports(params?: { 
    page?: number; 
    pageSize?: number; 
    name?: string; 
    sector?: string; 
    category?: string; 
  }): Promise<Types.PagedResponse<Types.SportResponse>> {
    const response = await this.api.get<Types.PagedResponse<Types.SportResponse>>('/api/sports', { params });
    return response.data;
  }

  async getSportById(id: string): Promise<Types.SportResponse> {
    const response = await this.api.get<Types.SportResponse>(`/api/sports/${id}`);
    return response.data;
  }

  async createSport(command: Types.CreateSportCommand): Promise<Types.SportResponse> {
    const response = await this.api.post<Types.SportResponse>('/api/sports', command);
    return response.data;
  }

  async updateSport(id: string, command: Types.UpdateSportCommand): Promise<Types.SportResponse> {
    const response = await this.api.put<Types.SportResponse>(`/api/sports/${id}`, command);
    return response.data;
  }

  async deleteSport(id: string): Promise<void> {
    await this.api.delete(`/api/sports/${id}`);
  }

  // --- ATHLETES ENDPOINTS ---

  async listAthletes(params?: {
    page?: number;
    pageSize?: number;
    fullName?: string;
    sportId?: string;
    sector?: string;
    category?: string;
    phase?: Types.Phase;
  }): Promise<Types.PagedResponse<Types.AthleteViewModel>> {
    const response = await this.api.get<Types.PagedResponse<Types.AthleteViewModel>>('/api/athletes', { params });
    return response.data;
  }

  async getAthleteById(id: string): Promise<Types.AthleteViewModel> {
    const response = await this.api.get<Types.AthleteViewModel>(`/api/athletes/${id}`);
    return response.data;
  }

  async createAthlete(command: Types.CreateAthleteCommand): Promise<Types.AthleteViewModel> {
    const response = await this.api.post<Types.AthleteViewModel>('/api/athletes', command);
    return response.data;
  }

  async updateAthlete(id: string, command: Types.UpdateAthleteCommand): Promise<Types.AthleteViewModel> {
    const response = await this.api.put<Types.AthleteViewModel>(`/api/athletes/${id}`, command);
    return response.data;
  }

  async deleteAthlete(id: string): Promise<void> {
    await this.api.delete(`/api/athletes/${id}`);
  }

  async importAthletes(sportName: string, file: File): Promise<Types.AthleteSpreadsheetImportViewModel> {
    const formData = new FormData();
    formData.append('SportName', sportName);
    formData.append('File', file);

    const response = await this.api.post<Types.AthleteSpreadsheetImportViewModel>('/api/athletes/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
