import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface SimulationStatus {
  enabled: boolean;
  startedAt: string | null;
}

export interface SimPosition {
  ambulanceId: string;
  alertId: string;
  latitude: number;
  longitude: number;
  progress: number;
  status: string;
  route: number[][];
  plate: string;
}

@Injectable({ providedIn: 'root' })
export class SimulationService {
  private readonly apiUrl = `${environment.apiUrl}/simulation`;
  readonly status = signal<SimulationStatus>({ enabled: false, startedAt: null });

  constructor(private http: HttpClient) {}

  checkStatus() {
    this.http.get<SimulationStatus>(`${this.apiUrl}/status`).subscribe({
      next: (s) => this.status.set(s),
      error: () => this.status.set({ enabled: false, startedAt: null }),
    });
  }

  toggle() {
    return this.http.patch<SimulationStatus>(`${this.apiUrl}/toggle`, {});
  }

  assign(alertId: string) {
    return this.http.post<{ ambulance: { id: string; plate: string; latitude: number; longitude: number } }>(
      `${this.apiUrl}/assign`, { alertId },
    );
  }

  createPublicAlert(lat: number, lng: number) {
    return this.http.post<{
      alert: any;
      ambulance: { id: string; plate: string; latitude: number; longitude: number; driverName: string | null };
      hospital: { id: string; name: string; latitude: number; longitude: number };
    }>(`${this.apiUrl}/public-alert`, { latitude: lat, longitude: lng });
  }

  saveRoute(alertId: string, ambulanceId: string, route: number[][], duration: number, distance: number) {
    return this.http.post(`${this.apiUrl}/routes`, { alertId, ambulanceId, route, duration, distance });
  }

  cancelAlert(alertId: string) {
    return this.http.post(`${this.apiUrl}/cancel`, { alertId });
  }

  startReturn(alertId: string) {
    return this.http.post(`${this.apiUrl}/start-return`, { alertId });
  }

  getPositions(hospitalId?: string) {
    let params = new HttpParams();
    if (hospitalId) params = params.set('hospitalId', hospitalId);
    return this.http.get<SimPosition[]>(`${this.apiUrl}/positions`, { params });
  }
}
