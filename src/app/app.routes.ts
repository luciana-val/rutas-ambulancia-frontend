import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { UserRole } from './core/models/user';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'emergencia',
    loadComponent: () => import('./pages/emergency-flow/emergency-flow').then((m) => m.EmergencyFlow),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layouts/dashboard-layout/dashboard-layout').then((m) => m.DashboardLayout),
    children: [
      {
        path: 'admin/dashboard',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./pages/super-admin/dashboard/super-admin-dashboard').then((m) => m.SuperAdminDashboard),
      },
      {
        path: 'admin/hospitals',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./pages/super-admin/hospitals/hospital-list').then((m) => m.HospitalList),
      },
      {
        path: 'admin/hospital',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./pages/hospital-admin/dashboard/hospital-dashboard').then((m) => m.HospitalDashboard),
      },
      {
        path: 'admin/hospital/ambulances',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./pages/hospital-admin/ambulances/ambulance-list').then((m) => m.AmbulanceList),
      },
      {
        path: 'admin/hospital/users',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./pages/hospital-admin/users/user-list').then((m) => m.UserList),
      },
      {
        path: 'admin/hospital/alerts',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./pages/alerts/alert-list').then((m) => m.AlertList),
      },
      {
        path: 'admin/settings',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./pages/settings/settings').then((m) => m.Settings),
      },
      {
        path: 'admin/alerts',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./pages/alerts/alert-list').then((m) => m.AlertList),
      },
      {
        path: 'admin',
        pathMatch: 'full',
        canActivate: [roleGuard],
        data: { roles: [UserRole.ADMIN] },
        loadComponent: () =>
          import('./pages/super-admin/dashboard/super-admin-dashboard').then((m) => m.SuperAdminDashboard),
      },
      {
        path: 'dispatcher',
        canActivate: [roleGuard],
        data: { roles: [UserRole.DISPATCHER] },
        loadComponent: () => import('./pages/dispatcher/dispatcher').then((m) => m.Dispatcher),
      },
      {
        path: 'dispatcher/alerts',
        canActivate: [roleGuard],
        data: { roles: [UserRole.DISPATCHER] },
        loadComponent: () => import('./pages/alerts/alert-list').then((m) => m.AlertList),
      },
      {
        path: 'driver',
        canActivate: [roleGuard],
        data: { roles: [UserRole.DRIVER] },
        loadComponent: () => import('./pages/driver/driver').then((m) => m.Driver),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
