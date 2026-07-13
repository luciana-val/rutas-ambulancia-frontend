import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService, Alert } from '../../shared/services/alert.service';
import { injectConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { AlertMapDialog } from '../../shared/components/alert-map-dialog/alert-map-dialog';

@Component({
  selector: 'app-alert-list',
  imports: [
    FormsModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, DatePipe,
    MatDialogModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-row">
        <div>
          <h1 class="page-title">Alertas</h1>
          <p class="page-subtitle">Seguimiento de emergencias registradas</p>
        </div>
        <button mat-mini-fab class="refresh-btn" (click)="loadAlerts()" matTooltip="Actualizar">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <div class="filter-bar">
        <mat-form-field appearance="outline" class="filter-search">
          <mat-label>Buscar por # o descripción</mat-label>
          <input matInput [(ngModel)]="searchTerm" (keyup.enter)="loadAlerts()" placeholder="#123 o texto">
          @if (searchTerm) {
            <button matSuffix mat-icon-button (click)="searchTerm=''; loadAlerts()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-status">
          <mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="loadAlerts()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="pending">Pendiente</mat-option>
            <mat-option value="assigned">Asignada</mat-option>
            <mat-option value="en_route">En ruta</mat-option>
            <mat-option value="completed">Completada</mat-option>
            <mat-option value="cancelled">Cancelada</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-date">
          <mat-label>Desde</mat-label>
          <input matInput [matDatepicker]="fromPicker" [(ngModel)]="dateFrom" (dateChange)="loadAlerts()">
          <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
          <mat-datepicker #fromPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-date">
          <mat-label>Hasta</mat-label>
          <input matInput [matDatepicker]="toPicker" [(ngModel)]="dateTo" (dateChange)="loadAlerts()">
          <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
          <mat-datepicker #toPicker></mat-datepicker>
        </mat-form-field>

        @if (hasActiveFilters) {
          <button mat-stroked-button class="clear-btn" (click)="clearFilters()">
            <mat-icon>clear</mat-icon> Limpiar
          </button>
        }
      </div>

      @if (alerts().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">notification_important</mat-icon>
          <p class="empty-text">No hay alertas registradas</p>
        </div>
      }

      <div class="alert-grid">
        @for (a of alerts(); track a.id) {
          <div class="alert-card" [class.sim-card]="a.isSimulation">
            <div class="card-status-strip" [class]="'strip-' + a.status"></div>
            <div class="card-body">
              <div class="card-top">
                <div class="card-status-row">
                  <span class="alert-number">#{{ a.alertNumber }}</span>
                  <span class="status-badge" [class]="'status-' + a.status">
                    <mat-icon class="status-icon">{{ statusIcon(a.status) }}</mat-icon>
                    {{ statusLabel(a.status) }}
                  </span>
                  @if (a.isSimulation) {
                    <span class="sim-tag">SIM</span>
                  }
                </div>
                <span class="card-time">{{ a.createdAt | date:'dd MMM HH:mm' }}</span>
              </div>

              <p class="card-desc">{{ a.description }}</p>

               <div class="card-meta">
                 <div class="meta-item">
                   <mat-icon class="meta-icon">person</mat-icon>
                   <span>{{ a.callerName || 'Anónimo' }}</span>
                 </div>
                 <div class="meta-item">
                   <mat-icon class="meta-icon">location_on</mat-icon>
                   <span>{{ a.latitude.toFixed(4) }}, {{ a.longitude.toFixed(4) }}</span>
                 </div>
                 @if (a.hospital?.name) {
                   <div class="meta-item">
                     <mat-icon class="meta-icon">local_hospital</mat-icon>
                     <span>{{ a.hospital!.name }}</span>
                   </div>
                 }
                 @if (a.ambulance?.plate) {
                   <div class="meta-item">
                     <mat-icon class="meta-icon">local_hospital</mat-icon>
                     <span>{{ a.ambulance!.plate }}</span>
                   </div>
                 }
               </div>

            </div>

            <div class="card-actions">
              @if (auth.isSuperAdmin()) {
                <button mat-icon-button class="btn-delete" (click)="deleteAlert(a)" matTooltip="Eliminar">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              }
              <button mat-icon-button class="btn-map" (click)="openAlertMap(a)" matTooltip="Ver en mapa">
                <mat-icon>map</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .refresh-btn { background: #1a1a1a !important; color: white !important; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    .refresh-btn:hover { transform: scale(1.08); }

    .filter-bar {
      display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
      margin-bottom: 24px; padding: 20px; background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .filter-search { flex: 1; min-width: 220px; }
    .filter-status { width: 170px; }
    .filter-date { width: 190px; }
    .clear-btn { height: 52px; color: #1a1a1a; border-color: #ccc !important; }

    ::ng-deep .filter-bar .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .filter-bar .mdc-text-field--outlined {
      background: #f7f7f7 !important;
    }
    ::ng-deep .filter-bar .mdc-text-field--outlined .mdc-notched-outline__leading,
    ::ng-deep .filter-bar .mdc-text-field--outlined .mdc-notched-outline__notch,
    ::ng-deep .filter-bar .mdc-text-field--outlined .mdc-notched-outline__trailing {
      border-color: #e0e0e0 !important;
    }
    ::ng-deep .filter-bar .mat-mdc-form-field-input-wrapper { padding-left: 12px !important; }
    ::ng-deep .filter-bar input.mat-mdc-input-element { padding-left: 6px !important; }
    ::ng-deep .filter-bar .mat-mdc-select-trigger { padding-left: 6px !important; }
    ::ng-deep .filter-bar .mat-datepicker-toggle { color: #666 !important; }
    ::ng-deep .filter-bar .mat-mdc-select-arrow { color: #666 !important; }
    ::ng-deep .filter-bar input::placeholder { color: #aaa !important; }
    ::ng-deep .filter-bar .mat-mdc-form-field-focus-overlay { background: transparent !important; }
    ::ng-deep .filter-bar .mat-mdc-select-panel { background: white !important; }

    .alert-grid { display: flex; flex-direction: column; gap: 16px; }

    .alert-card {
      display: flex; border-radius: 16px; overflow: hidden;
      background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .alert-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
    }
    .sim-card { border-left: 3px solid #1a1a1a; }

    .card-status-strip { width: 5px; flex-shrink: 0; }
    .strip-pending { background: #1565c0; }
    .strip-assigned { background: #e65100; }
    .strip-en_route { background: #f57f17; }
    .strip-completed { background: #2e7d32; }
    .strip-cancelled { background: #c62828; }

    .card-body { flex: 1; padding: 18px 20px; }
    .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .card-status-row { display: flex; align-items: center; gap: 8px; }
    .card-time { font-size: 12px; color: #999; white-space: nowrap; }

    .alert-number {
      font-size: 13px; font-weight: 700; color: #1a1a1a;
      background: #f0f0f0; padding: 2px 10px; border-radius: 20px;
      letter-spacing: 0.3px;
    }

    .status-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .status-icon { font-size: 14px; width: 14px; height: 14px; }
    .status-pending { background: #e3f2fd; color: #1565c0; }
    .status-assigned { background: #fff3e0; color: #e65100; }
    .status-en_route { background: #fff8e1; color: #f57f17; }
    .status-completed { background: #e8f5e9; color: #2e7d32; }
    .status-cancelled { background: #ffebee; color: #c62828; }

    .sim-tag {
      background: #1a1a1a; color: white; font-size: 10px; font-weight: 700;
      padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px;
    }

    .card-desc {
      font-size: 15px; font-weight: 500; color: #1a1a1a;
      margin: 0 0 12px; line-height: 1.4;
    }

    .card-meta { display: flex; flex-wrap: wrap; gap: 14px; }
    .meta-item { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #666; }
    .meta-icon { font-size: 15px; width: 15px; height: 15px; color: #999; }

    .card-actions {
      display: flex; flex-direction: column; align-items: center; padding: 8px 10px; gap: 6px;
    }

    .btn-delete {
      color: #1a1a1a !important; opacity: 0.35;
      transition: opacity 0.15s, transform 0.15s;
    }
    .btn-delete:hover { opacity: 0.8; transform: scale(1.1); }
    .btn-map {
      color: #1a1a1a !important; opacity: 0.35;
      transition: opacity 0.15s, transform 0.15s;
    }
    .btn-map:hover { opacity: 0.8; transform: scale(1.1); }

    .empty-state {
      text-align: center; padding: 64px 24px;
      background: white; border-radius: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .empty-icon { font-size: 56px; width: 56px; height: 56px; color: #ccc; margin-bottom: 12px; }
    .empty-text { color: #999; font-size: 16px; margin: 0; }

    @media (max-width: 768px) {
      .filter-bar { flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; }
      .filter-search, .filter-status, .filter-date { width: 100%; min-width: unset; }
    }
    @media (max-width: 600px) {
      .card-meta { flex-direction: column; gap: 8px; }
      .card-top { flex-wrap: wrap; gap: 6px; }
    }
  `],
})
export class AlertList {
  protected auth = inject(AuthService);
  private alertService = inject(AlertService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly alerts = signal<Alert[]>([]);

  searchTerm = '';
  statusFilter = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  private readonly confirm = injectConfirmDialog();

  constructor() {
    this.loadAlerts();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm || !!this.statusFilter || !!this.dateFrom || !!this.dateTo;
  }

  loadAlerts() {
    const hospitalId = this.auth.isSuperAdmin() ? undefined : this.auth.hospitalId() ?? undefined;
    const filters: any = {};
    if (hospitalId) filters.hospitalId = hospitalId;
    if (this.statusFilter) filters.status = this.statusFilter;
    if (this.dateFrom) filters.dateFrom = this.dateFrom.toISOString();
    if (this.dateTo) {
      const end = new Date(this.dateTo);
      end.setHours(23, 59, 59, 999);
      filters.dateTo = end.toISOString();
    }
    if (this.searchTerm.trim()) filters.search = this.searchTerm.trim();

    this.alertService.getAll(filters).subscribe({
      next: (data) => this.alerts.set(data),
      error: () => this.snackBar.open('Error al cargar alertas', 'Cerrar', { duration: 3000 }),
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.loadAlerts();
  }

  async deleteAlert(a: Alert) {
    const ok = await this.confirm({
      title: 'Eliminar alerta',
      message: `¿Eliminar la alerta #${a.alertNumber} "${a.description}"?\nEsta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      confirmColor: 'warn',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    this.alertService.delete(a.id).subscribe({
      next: () => {
        this.snackBar.open('Alerta eliminada', 'Cerrar', { duration: 3000 });
        this.loadAlerts();
      },
      error: () => this.snackBar.open('Error al eliminar alerta', 'Cerrar', { duration: 3000 }),
    });
  }

  openAlertMap(a: Alert) {
    this.dialog.open(AlertMapDialog, {
      width: '600px',
      maxWidth: '90vw',
      data: a,
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      assigned: 'Asignada',
      en_route: 'En ruta',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  }

  statusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: 'schedule',
      assigned: 'person_pin',
      en_route: 'directions_car',
      completed: 'check_circle',
      cancelled: 'cancel',
    };
    return icons[status] || 'info';
  }
}
