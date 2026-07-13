import { Component, inject, signal, computed, viewChild, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HospitalService, Hospital } from '../../../shared/services/hospital.service';
import { MapMarker } from '../../../shared/services/map.service';

import { MapView } from '../../../shared/components/map-view/map-view';
import { HospitalFormDialog } from '../hospitals/hospital-list';
import { injectConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-super-admin-dashboard',
  imports: [
    RouterLink, MatCardModule, MatIconModule, MatButtonModule,
    MatListModule, MatTooltipModule, FormsModule, MapView,
  ],
  template: `
    <div class="dashboard-container">
      <div class="map-section">
        <app-map-view
          [markers]="markers()"
          [showTraffic]="true"
          [showControls]="true"
          [center]="[-64.5, -16.5]"
          [zoom]="6"
          (markerClick)="onMarkerClick($event)"
        />
      </div>

      <div class="side-panel">
        <div class="panel-header">
          <h2 class="panel-title">Hospitales</h2>
          <span class="panel-count">{{ filteredHospitals().length }} centros</span>
        </div>

        <div class="search-bar">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            class="search-input"
            placeholder="Buscar hospital..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
          @if (searchQuery()) {
            <button class="clear-btn" (click)="searchQuery.set('')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-num">{{ hospitals().length }}</span>
            <span class="stat-lbl">Hospitales</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ totalAmbulances() }}</span>
            <span class="stat-lbl">Ambulancias</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ availableAmbulances() }}</span>
            <span class="stat-lbl">Disponibles</span>
          </div>
        </div>

        <div class="hospital-list">
          @for (h of filteredHospitals(); track h.id) {
            <div class="hospital-item" (click)="focusHospital(h)">
              <div class="hosp-dot"></div>
              <div class="hosp-info">
                <span class="hosp-name">{{ h.name }}</span>
                <span class="hosp-addr">{{ h.address }}</span>
              </div>
              <mat-icon class="hosp-arrow">chevron_right</mat-icon>
            </div>
          } @empty {
            <div class="empty-state">
              <mat-icon>local_hospital</mat-icon>
              @if (searchQuery() && hospitals().length) {
                <p>Sin resultados para "{{ searchQuery() }}"</p>
              } @else {
                <p>No hay hospitales registrados</p>
                <a mat-stroked-button routerLink="/admin/hospitals">Crear hospital</a>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      height: 100%;
      overflow: hidden;
    }
    .map-section {
      flex: 1;
      position: relative;
    }
    .side-panel {
      width: 380px;
      background: white;
      border-left: 1px solid #e8e8e8;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .panel-header {
      padding: 20px 24px 12px;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .panel-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      color: #1a1a1a;
    }
    .panel-count {
      font-size: 13px;
      color: #999;
    }
    .search-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 0 12px;
      margin: 8px 8px 4px;
      transition: border-color 0.15s;
    }
    .search-bar:focus-within {
      border-color: #1a1a1a;
    }
    .search-icon {
      color: #999;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 13px;
      padding: 10px 0;
      background: transparent;
    }
    .clear-btn {
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      color: #999;
      padding: 4px;
    }
    .clear-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .stats-row {
      display: flex;
      padding: 16px 24px;
      gap: 8px;
      border-bottom: 1px solid #eee;
    }
    .stat-item {
      flex: 1;
      text-align: center;
    }
    .stat-num {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .stat-lbl {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .hospital-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .hospital-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .hospital-item:hover { background: #f5f5f5; }
    .hosp-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #1a1a1a;
      flex-shrink: 0;
    }
    .hosp-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .hosp-name {
      font-size: 14px;
      font-weight: 500;
      color: #1a1a1a;
    }
    .hosp-addr {
      font-size: 12px;
      color: #999;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .hosp-arrow { color: #ccc; font-size: 18px; width: 18px; height: 18px; }
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #999;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .empty-state p { margin: 0 0 16px; }
    @media (max-width: 1024px) {
      .side-panel { width: 320px; }
    }
    @media (max-width: 768px) {
      .dashboard-container { flex-direction: column; }
      .side-panel { width: 100%; max-height: 40vh; border-left: none; border-top: 1px solid #e8e8e8; }
    }
  `],
})
export class SuperAdminDashboard {
  private hospitalService = inject(HospitalService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private confirm = injectConfirmDialog();
  readonly mapView = viewChild(MapView);

  readonly hospitals = signal<Hospital[]>([]);
  readonly markers = signal<MapMarker[]>([]);
  readonly searchQuery = signal('');
  readonly filteredHospitals = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.hospitals();
    return this.hospitals().filter((h) => h.name.toLowerCase().includes(q));
  });
  readonly totalAmbulances = signal(0);
  readonly availableAmbulances = signal(0);

  constructor() {
    afterNextRender(() => {
      this.loadHospitals();
      this.setupGlobalHandlers();
    });
  }

  private loadHospitals() {
    this.hospitalService.getAll().subscribe((hospitals) => {
      this.hospitals.set(hospitals);
      this.markers.set(
        hospitals.map((h) => ({
          id: h.id,
          lng: h.longitude,
          lat: h.latitude,
          title: h.name,
          subtitle: h.address,
          color: '#1a1a1a',
          data: h,
        }) as MapMarker),
      );
    });
  }

  focusHospital(h: Hospital) {
    this.mapView()?.flyTo(h.longitude, h.latitude, 14);
  }

  onMarkerClick(m: MapMarker) {
    const h = m.data as Hospital;
    if (!h) return;
    const mv = this.mapView();
    if (!mv) return;
    mv.flyTo(h.longitude, h.latitude, 14);
    const html = `
      <div style="font-family: Roboto, sans-serif; min-width: 220px;">
        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #1a1a1a;">${h.name}</h3>
        <p style="margin: 0 0 4px; font-size: 13px; color: #666;">${h.address}</p>
        ${h.phone ? `<p style="margin: 0 0 12px; font-size: 13px; color: #666;"><span style="font-size:16px;">📞</span> ${h.phone}</p>` : ''}
        <div style="display: flex; gap: 8px; border-top: 1px solid #eee; padding-top: 10px;">
          <button onclick="window.__editHospital('${h.id}')" style="flex:1; display:inline-flex; align-items:center; justify-content:center; gap:4px; padding: 7px; border: 1px solid #1a1a1a; border-radius: 6px; background: white; color: #1a1a1a; cursor: pointer; font-weight: 500; font-size: 13px;"><span class="mat-icon notranslate material-icons" style="font-size:18px;width:18px;height:18px;">edit</span> Editar</button>
          <button onclick="window.__deleteHospital('${h.id}')" style="flex:1; display:inline-flex; align-items:center; justify-content:center; gap:4px; padding: 7px; border: 1px solid #1a1a1a; border-radius: 6px; background: #1a1a1a; color: white; cursor: pointer; font-weight: 500; font-size: 13px;"><span class="mat-icon notranslate material-icons" style="font-size:18px;width:18px;height:18px;">delete</span> Eliminar</button>
        </div>
      </div>
    `;
    mv.showPopup(h.longitude, h.latitude, html);
  }

  private setupGlobalHandlers() {
    (window as any).__editHospital = (id: string) => {
      const h = this.hospitals().find(x => x.id === id);
      if (!h) return;
      this.dialog.open(HospitalFormDialog, {
        width: '960px',
        maxWidth: '96vw',
        data: { mode: 'edit', hospital: h },
      }).afterClosed().subscribe((result) => {
        if (result) {
          this.hospitalService.update(h.id, result).subscribe(() => {
            this.snackBar.open('Hospital actualizado', 'Cerrar', { duration: 3000 });
            this.loadHospitals();
          });
        } else {
          this.loadHospitals();
        }
      });
    };
    (window as any).__deleteHospital = (id: string) => {
      this.mapView()?.removePopup();
      const h = this.hospitals().find(x => x.id === id);
      if (!h) return;
      this.confirm({
        title: 'Eliminar hospital',
        message: `¿Estás seguro de eliminar "${h.name}"?\nSe eliminarán también sus usuarios y ambulancias asociados.`,
        confirmText: 'Eliminar',
        confirmColor: 'warn',
      }).then((ok) => {
        if (ok) {
          this.hospitalService.delete(id).subscribe(() => {
            this.snackBar.open('Hospital eliminado', 'Cerrar', { duration: 3000 });
            this.loadHospitals();
          });
        } else {
          this.loadHospitals();
        }
      });
    };
  }
}
