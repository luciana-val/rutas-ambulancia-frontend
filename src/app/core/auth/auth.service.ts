import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly role = computed(() => this.user()?.role ?? null);
  readonly hospitalId = computed(() => this.user()?.hospitalId ?? null);
  readonly isSuperAdmin = computed(() => this.role() === UserRole.ADMIN && this.hospitalId() === null);
  readonly isHospitalAdmin = computed(() => this.role() === UserRole.ADMIN && this.hospitalId() !== null);

  private readonly roleRedirects: Record<string, string> = {
    [UserRole.ADMIN]: '/admin',
    [UserRole.DISPATCHER]: '/dispatcher',
    [UserRole.DRIVER]: '/driver',
  };

  private _profilePromise: Promise<void> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  /** Called once by APP_INITIALIZER before any route resolves */
  init(): Promise<void> {
    if (!this._profilePromise) {
      this._profilePromise = this.tryLoadProfile();
    }
    return this._profilePromise;
  }

  login(dto: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, dto, { withCredentials: true });
  }

  refresh() {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true });
  }

  logout() {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true });
  }

  handleLoginResponse(res: LoginResponse) {
    this.user.set(res.user);
    const redirect = this.resolveDashboard(res.user);
    this.router.navigate([redirect]);
  }

  private resolveDashboard(user: User): string {
    if (user.role === UserRole.ADMIN) {
      return user.hospitalId ? '/admin/hospital' : '/admin/dashboard';
    }
    return this.roleRedirects[user.role] || '/';
  }

  handleLogout() {
    this.logout().subscribe({
      error: () => {},
      complete: () => {
        this.user.set(null);
        this.router.navigate(['/']);
      },
    });
  }

  private async tryLoadProfile(): Promise<void> {
    try {
      const user = await lastValueFrom(
        this.http.get<User | null>(`${this.apiUrl}/auth/profile`, { withCredentials: true }),
      );
      if (!user) throw new Error('no session');
      this.user.set(user);
      this.tryRedirectHome(user);
    } catch {
      try {
        const res = await lastValueFrom(
          this.http.post<LoginResponse>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true }),
        );
        this.user.set(res.user);
        this.tryRedirectHome(res.user);
      } catch {
        // not authenticated — guard will redirect
      }
    }
  }

  private tryRedirectHome(user: User) {
    const currentUrl = this.router.url;
    if (currentUrl === '/' || currentUrl === '/login') {
      const redirect = this.resolveDashboard(user);
      this.router.navigate([redirect]);
    }
  }
}
