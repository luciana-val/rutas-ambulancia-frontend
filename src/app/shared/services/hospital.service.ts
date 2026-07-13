import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHospitalDto {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
}

export interface UpdateHospitalDto {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private readonly apiUrl = `${environment.apiUrl}/hospitals`;

  constructor(private http: HttpClient) {}

  getAll(search?: string) {
    const params = search ? { search } : undefined;
    return this.http.get<Hospital[]>(this.apiUrl, { params });
  }

  getById(id: string) {
    return this.http.get<Hospital>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateHospitalDto) {
    return this.http.post<Hospital>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateHospitalDto) {
    return this.http.patch<Hospital>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
