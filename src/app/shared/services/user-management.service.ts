import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User } from '../../core/models/user';

export interface CreateUserDto {
  username: string;
  password: string;
  name: string;
  role: string;
  hospitalId?: string;
}

export interface UpdateUserDto {
  username?: string;
  name?: string;
  role?: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(hospitalId?: string) {
    let params = new HttpParams();
    if (hospitalId) params = params.set('hospitalId', hospitalId);
    return this.http.get<User[]>(this.apiUrl, { params });
  }

  getById(id: string) {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateUserDto) {
    return this.http.post<User>(this.apiUrl, dto);
  }

  update(id: string, dto: UpdateUserDto) {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
