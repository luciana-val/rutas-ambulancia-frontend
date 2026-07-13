import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Alert {
  id: string;
  alertNumber: number;
  hospitalId: string;
  hospital: { id: string; name: string } | null;
  latitude: number;
  longitude: number;
  description: string;
  callerName: string;
  callerPhone: string;
  status: string;
  ambulanceId: string | null;
  ambulance: { id: string; plate: string } | null;
  isSimulation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertDto {
  hospitalId: string;
  latitude: number;
  longitude: number;
  description: string;
  callerName?: string;
  callerPhone?: string;
}

export interface UpdateAlertDto {
  description?: string;
  status?: string;
  ambulanceId?: string;
  isSimulation?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly apiUrl = `${environment.apiUrl}/alerts`;

  constructor(private http: HttpClient) {}

  getAll(filters?: { hospitalId?: string; status?: string[]; dateFrom?: string; dateTo?: string; search?: string }) {
    let params = new HttpParams();
    if (filters?.hospitalId) params = params.set('hospitalId', filters.hospitalId);
    if (filters?.status?.length) {
      filters.status.forEach(s => params = params.append('status', s));
    }
    if (filters?.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params = params.set('dateTo', filters.dateTo);
    if (filters?.search?.trim()) params = params.set('search', filters.search.trim());
    return this.http.get<Alert[]>(this.apiUrl, { params });
  }

  getById(id: string) {
    return this.http.get<Alert>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateAlertDto) {
    return this.http.post<Alert>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateAlertDto) {
    return this.http.patch<Alert>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
