import { Component, inject, viewChild, afterNextRender, DestroyRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { UserRole } from '../../../core/models/user';
import { SimulationService } from '../../services/simulation.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  show: () => boolean;
}

@Component({
  selector: 'app-dashboard-layout',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
  ],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout {
  protected auth = inject(AuthService);
  protected simulation = inject(SimulationService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);
  protected drawer = viewChild.required<MatDrawer>('drawer');

  constructor() {
    afterNextRender(() => {
      this.simulation.checkStatus();
      const interval = setInterval(() => this.simulation.checkStatus(), 10000);
      this.destroyRef.onDestroy(() => clearInterval(interval));
    });
  }

  protected isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait]).pipe(
      map((result) => result.matches),
    ),
    { initialValue: false },
  );

  protected navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: 'dashboard',
      show: () => this.auth.isSuperAdmin(),
    },
    {
      label: 'Hospitales',
      route: '/admin/hospitals',
      icon: 'local_hospital',
      show: () => this.auth.isSuperAdmin(),
    },
    {
      label: 'Alertas',
      route: '/admin/alerts',
      icon: 'notification_important',
      show: () => this.auth.isSuperAdmin(),
    },
    {
      label: 'Configuración',
      route: '/admin/settings',
      icon: 'settings',
      show: () => this.auth.isSuperAdmin(),
    },
    {
      label: 'Dashboard',
      route: '/admin/hospital',
      icon: 'dashboard',
      show: () => this.auth.isHospitalAdmin(),
    },
    {
      label: 'Ambulancias',
      route: '/admin/hospital/ambulances',
      icon: 'directions_car',
      show: () => this.auth.isHospitalAdmin(),
    },
    {
      label: 'Usuarios',
      route: '/admin/hospital/users',
      icon: 'people',
      show: () => this.auth.isHospitalAdmin(),
    },
    {
      label: 'Alertas',
      route: '/admin/hospital/alerts',
      icon: 'notification_important',
      show: () => this.auth.isHospitalAdmin(),
    },
    {
      label: 'Despacho',
      route: '/dispatcher',
      icon: 'radio',
      show: () => this.auth.role() === UserRole.DISPATCHER,
    },
    {
      label: 'Alertas',
      route: '/dispatcher/alerts',
      icon: 'notification_important',
      show: () => this.auth.role() === UserRole.DISPATCHER,
    },
    {
      label: 'Mi Ruta',
      route: '/driver',
      icon: 'route',
      show: () => this.auth.role() === UserRole.DRIVER,
    },
  ];

  protected get filteredNavItems() {
    return this.navItems.filter((item) => item.show());
  }

  protected get navSectionLabel() {
    const role = this.auth.role();
    if (this.auth.isSuperAdmin()) return 'Super Admin';
    if (this.auth.isHospitalAdmin()) return 'Administración';
    switch (role) {
      case UserRole.DISPATCHER: return 'Despacho';
      case UserRole.DRIVER: return 'Conductor';
      default: return 'Dashboard';
    }
  }

  protected onLogout() {
    this.auth.handleLogout();
  }
}
