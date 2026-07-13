import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Ambulance {
  id: string;
  plate: string;
  model: string;
  platePhoto: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
  hospitalId: string;
  driverId: string | null;
  driver: { id: string; name: string } | null;
  lastLocationUpdate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAmbulanceDto {
  plate: string;
  hospitalId: string;
  model?: string;
}

export interface UpdateAmbulanceDto {
  plate?: string;
  model?: string;
  status?: string;
  driverId?: string;
}

const baseUrl = (typeof window !== 'undefined' && window.location.port === '4200')
  ? 'http://localhost:3000'
  : '';

export function getPlatePhotoUrl(platePhoto: string | null): string | null {
  return platePhoto ? `${baseUrl}/uploads/ambulance-plates/${platePhoto}` : null;
}

@Injectable({ providedIn: 'root' })
export class AmbulanceService {
  private readonly apiUrl = `${environment.apiUrl}/ambulances`;

  constructor(private http: HttpClient) {}

  getAll(hospitalId?: string) {
    let params = new HttpParams();
    if (hospitalId) params = params.set('hospitalId', hospitalId);
    return this.http.get<Ambulance[]>(this.apiUrl, { params });
  }

  getById(id: string) {
    return this.http.get<Ambulance>(`${this.apiUrl}/${id}`);
  }

  create(formData: FormData) {
    return this.http.post<Ambulance>(this.apiUrl, formData);
  }

  update(id: string, formData: FormData) {
    return this.http.patch<Ambulance>(`${this.apiUrl}/${id}`, formData);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
