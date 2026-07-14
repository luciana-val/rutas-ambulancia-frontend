import { Component, inject, signal, computed, afterNextRender, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { NgClass } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { AmbulanceService, Ambulance } from '../../../shared/services/ambulance.service';
import { HospitalService, Hospital } from '../../../shared/services/hospital.service';
import { AlertService, Alert } from '../../../shared/services/alert.service';
import { SimulationService, SimPosition } from '../../../shared/services/simulation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MapView } from '../../../shared/components/map-view/map-view';
import { MapMarker, AMBULANCE_ICON } from '../../../shared/services/map.service';
import { SimulationViewDialog } from '../../../shared/components/simulation-view-dialog/simulation-view-dialog';
import { SimulateAlertDialog } from '../../../shared/components/simulate-alert-dialog/simulate-alert-dialog';
import { AlertDetailDialog } from '../../../shared/components/alert-detail-dialog/alert-detail-dialog';
import { AmbulanceTrackDialog, AmbulanceTrackData } from '../../../shared/components/ambulance-track-dialog/ambulance-track-dialog';


const AMB_COLORS: Record<string, string> = {
  active: '#2dc937', busy: '#e7b416', inactive: '#888888',
};
const AMB_LABELS: Record<string, string> = {
  active: 'Disponible', busy: 'Ocupado', inactive: 'Inactivo',
};
const ALERT_COLORS: Record<string, string> = {
  pending: '#e53935', assigned: '#e7b416', en_route: '#1976d2',
  completed: '#2dc937', cancelled: '#888888',
};
const ALERT_LABELS: Record<string, string> = {
  pending: 'Pendiente', assigned: 'Asignada', en_route: 'En ruta',
  completed: 'Completada', cancelled: 'Cancelada',
};
const FILTER_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: '#e53935' },
  { value: 'assigned', label: 'Asignada', color: '#e7b416' },
  { value: 'en_route', label: 'En ruta', color: '#1976d2' },
  { value: 'completed', label: 'Completada', color: '#2dc937' },
  { value: 'cancelled', label: 'Cancelada', color: '#888888' },
];

@Component({
  selector: 'app-hospital-dashboard',
  imports: [RouterLink, MapView, MatCardModule, MatIconModule, MatButtonModule, MatListModule, NgClass],
  template: `
    <div class="dashboard-container">
      <div class="stats-wrapper">
        <div class="stats-row">
          <div class="stat-item">
            <mat-icon class="s-icon">directions_car</mat-icon>
            <div class="stat-info">
              <span class="s-num">{{ totalAmbulances() }}</span>
              <span class="s-lbl">Ambulancias</span>
            </div>
          </div>
          <div class="stat-item">
            <mat-icon class="s-icon" style="color:#2dc937">check_circle</mat-icon>
            <div class="stat-info">
              <span class="s-num">{{ availableCount() }}</span>
              <span class="s-lbl">Disponibles</span>
            </div>
          </div>
          <div class="stat-item">
            <mat-icon class="s-icon" style="color:#e7b416">directions_car</mat-icon>
            <div class="stat-info">
              <span class="s-num">{{ busyCount() }}</span>
              <span class="s-lbl">Ocupadas</span>
            </div>
          </div>
          <div class="stat-item">
            <mat-icon class="s-icon" style="color:#888">radio_button_unchecked</mat-icon>
            <div class="stat-info">
              <span class="s-num">{{ inactiveCount() }}</span>
              <span class="s-lbl">Inactivas</span>
            </div>
          </div>
          <div class="stat-item">
            <mat-icon class="s-icon" style="color:#e53935">notifications</mat-icon>
            <div class="stat-info">
              <span class="s-num">{{ pendingAlerts() }}</span>
              <span class="s-lbl">Alertas pend.</span>
            </div>
          </div>
          <div class="stat-item stat-curso">
            <mat-icon class="s-icon" style="color:#1976d2">stars</mat-icon>
            <div class="stat-info">
              <span class="s-num">{{ activeAlerts() }}</span>
              <span class="s-lbl">En curso</span>
            </div>
          </div>
        </div>
      </div>
      <div class="filter-title">Tipos de avisos</div>
      <div class="filter-bar">
        @for (fs of FILTER_STATUSES; track fs.value) {
          <label class="filter-chip" [class.active]="alertStatusFilter().includes(fs.value)" [style.--chip-color]="fs.color">
            <input type="checkbox" [checked]="alertStatusFilter().includes(fs.value)" (change)="toggleStatusFilter(fs.value)" />
            <span class="chip-dot" [style.background]="fs.color"></span>
            <span class="chip-label">{{ fs.label }}</span>
          </label>
        }
      </div>
    <div class="content-grid">
        <div class="map-section">
          <app-map-view
            [markers]="markers()"
            [center]="center()"
            [zoom]="13"
            [interactive]="true"
            [showControls]="true"
            (markerClick)="onMarkerClick($event)"
          />
        </div>


        <div class="side-panel">
          <div class="panel-header">
            <h3>Ambulancias</h3>
            <span class="panel-badge">{{ ambulances().length }}</span>
          </div>
          <div class="panel-legend">
            <div class="leg-item"><span class="leg-dot" style="background:#2dc937"></span>Ambulancia</div>
            <div class="leg-item"><span class="leg-dot" style="background:#e53935"></span>Alerta pendiente</div>
            <div class="leg-item"><span class="leg-dot" style="background:#1976d2"></span>Alerta activa</div>
          </div>
          <div class="amb-list">
            @for (a of ambulances(); track a.id) {
              <div class="amb-item" (click)="focusAmbulance(a)">
                <span class="amb-dot" [style.background]="AMB_COLORS[a.status]"></span>
                <div class="amb-info">
                  <span class="amb-plate">{{ a.plate }}</span>
                  <span class="amb-driver">{{ a.driver?.name || 'Sin conductor' }}</span>
                </div>
                <div class="amb-status-group">
                  <span class="amb-badge" [ngClass]="'badge-' + a.status">{{ AMB_LABELS[a.status] }}</span>
                  @if (a.status === 'busy') {
                    <button mat-icon-button class="btn-sim" (click)="$event.stopPropagation(); viewSimulation(a.id)" matTooltip="Ver simulación">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty">No hay ambulancias registradas</div>
            }
          </div>
    <div class="panel-actions">
      <button mat-stroked-button routerLink="/admin/hospital/ambulances">
        <mat-icon>add</mat-icon> Agregar ambulancia
      </button>
      @if (simulationService.status().enabled) {
        <button mat-flat-button class="btn-simulate" (click)="openSimulateAlertDialog()">
          <mat-icon>notifications_active</mat-icon> Simular Alerta
        </button>
      }
    </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 16px; height: 100%; display: flex; flex-direction: column; overflow: hidden;
      background: #fcfcfc;
    }
    .stats-wrapper {
      overflow-x: auto; padding: 0 0 12px 0;
      -webkit-overflow-scrolling: touch;
    }
    .stats-wrapper::-webkit-scrollbar { display: none; }
    .stats-row {
      display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: nowrap;
    }
    .stat-item {
      flex: 1 1 0px; min-width: 140px;
      background: white; border-radius: 12px; padding: 14px 18px;
      display: flex; align-items: center; gap: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      border: 1px solid #f0f0f0;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .s-icon { font-size: 22px; width: 22px; height: 22px; }
    .s-num { font-size: 20px; font-weight: 700; color: #1a1a1a; min-width: 24px; }
    .s-lbl { font-size: 10px; color: #999; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
    
    .filter-bar {
      display: flex; gap: 8px; padding: 0 0 12px 0; flex-wrap: wrap;
      align-items: center;
    }
    .filter-chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 20px;
      border: 1.5px solid #e0e0e0; background: white;
      cursor: pointer; transition: all 0.15s;
      font-size: 12px; font-weight: 500; color: #999;
      user-select: none;
    }
    .filter-chip:hover { border-color: #ccc; background: #f5f5f5; }
    .filter-chip.active {
      color: #1a1a1a;
      border-color: var(--chip-color, #ccc);
      background: color-mix(in srgb, var(--chip-color, #ccc) 10%, white);
    }
    .filter-chip input { display: none; }
    .chip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .filter-chip:not(.active) .chip-dot { background: #ccc !important; }
    .chip-label { white-space: nowrap; }
    .filter-title {
      font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase;
      letter-spacing: 0.8px; margin-bottom: 2px;
    }
    
    .content-grid {
      flex: 1; display: flex; gap: 16px; overflow: hidden;
    }
    .map-section {
      flex: 1; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .sim-controls {
      position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
      z-index: 9999; display: flex; align-items: center; gap: 12px;
    }
    .sim-btn {
      border: none; border-radius: 24px; padding: 12px 24px;
      display: flex; align-items: center; gap: 8px;
      font-weight: 600; cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      transition: transform 0.2s, background 0.2s;
      font-size: 14px;
    }
    .sim-btn:hover { transform: scale(1.05); }
    .toggle-btn { background: white; color: #1a1a1a; }
    .toggle-btn.active { background: #1a1a1a; color: white !important; }
    .create-btn { background: #1a1a1a; color: white; }
    .create-btn:hover { background: #333; }
    .sim-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .side-panel {
      width: 340px; background: white; border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .panel-header {
      display: flex; align-items: center; gap: 8px;
      padding: 16px 16px 8px; border-bottom: 1px solid #f0f0f0;
    }
    .panel-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #1a1a1a; }
    .panel-badge {
      background: #eee; padding: 1px 8px; border-radius: 10px;
      font-size: 12px; font-weight: 600; color: #666;
    }
    .panel-legend {
      display: flex; gap: 12px; padding: 10px 16px;
      border-bottom: 1px solid #f0f0f0; font-size: 11px; color: #888;
    }
    .leg-item { display: flex; align-items: center; gap: 5px; }
    .leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .amb-list { flex: 1; overflow-y: auto; padding: 6px; }
    .amb-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 10px; border-radius: 8px; cursor: pointer;
      transition: background 0.15s;
    }
    .amb-item:hover { background: #f8f8f8; }
    .amb-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .amb-info { flex: 1; min-width: 0; }
    .amb-plate { display: block; font-size: 14px; font-weight: 600; color: #1a1a1a; }
    .amb-driver { font-size: 12px; color: #888; }
    .amb-status-group { display: flex; align-items: center; gap: 4px; }
    .amb-badge {
      font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 10px;
    }
    .btn-sim {
      width: 32px; height: 32px; line-height: 32px;
      color: #1a1a1a !important;
    }
    .btn-sim mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .badge-active { background: #e8f5e9; color: #2e7d32; }
    .badge-busy { background: #fff3e0; color: #e65100; }
    .badge-inactive { background: #f5f5f5; color: #999; }
    .empty { text-align: center; padding: 32px; color: #999; font-size: 14px; }
    .panel-actions {
      padding: 10px 16px; border-top: 1px solid #f0f0f0;
      display: flex; flex-direction: column; gap: 8px;
    }
    .panel-actions button {
      width: 100%; border-color: #ddd !important; color: #1a1a1a !important;
      border-radius: 8px; font-size: 13px;
    }
    .panel-actions .btn-simulate {
      background: #1a1a1a !important; color: white !important;
      font-weight: 600;
    }
    @media (max-width: 900px) {
      .dashboard-container {
        padding: 12px;
        height: auto;
        overflow: visible;
      }
      .stats-wrapper {
        overflow: visible;
        padding: 0;
      }
      .stats-row {
        flex-wrap: wrap;
        gap: 8px;
      }
      .stat-item {
        flex: 1 1 calc(50% - 8px);
        min-width: 120px;
        padding: 10px 12px;
        gap: 10px;
      }
      .stat-item:last-child {
        flex: 1 1 calc(50% - 8px);
      }
      .stat-curso {
        background: #f0f6ff;
        border-color: #d0e0f0;
      }
      .s-num { font-size: 18px; }
      .s-lbl { font-size: 9px; }
      .content-grid {
        flex-direction: column;
        overflow: visible;
        height: auto;
        gap: 12px;
      }
      .map-section {
        height: 380px;
        min-height: 380px;
        flex: none;
      }
      .side-panel {
        width: 100%;
        max-height: none;
        height: auto;
        flex: none;
      }
      .amb-list {
        overflow: visible;
        max-height: none;
        height: auto;
      }
      .panel-legend {
        display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        padding: 10px 16px; border-bottom: 1px solid #f0f0f0; font-size: 10px; color: #888;
      }
      .filter-bar {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 0 0 10px 0;
      }
      .filter-chip {
        padding: 10px 14px; font-size: 13px; justify-content: center; width: 100%;
      }
      .filter-chip:nth-child(4),
      .filter-chip:nth-child(5) {
        grid-column: 1 / -1;
      }
      .filter-title {
        font-size: 12px; margin-bottom: 6px;
      }
      .panel-actions {
        flex-direction: row;
      }
      .panel-actions button {
        font-size: 12px; padding: 8px 12px; min-width: 0;
      }
    }
    .dialog-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    }
    .dialog-box {
      background: white; border-radius: 12px; padding: 24px; max-width: 90vw;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .dialog-wide { width: 700px; max-height: 90vh; overflow-y: auto; }
    .dialog-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .dialog-header h3 { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 18px; }
    .tableau-details { margin-top: 8px; }
    .tableau-details summary { cursor: pointer; font-weight: 600; color: #1565c0; font-size: 13px; }
    .tableau-iter { margin: 8px 0; }
    .tableau-iter pre { background: #1e1e1e; color: #b5cea8; padding: 12px; border-radius: 8px; font-size: 11px; overflow-x: auto; max-height: 300px; }
  `],
})
export class HospitalDashboard {
  protected readonly AMB_COLORS = AMB_COLORS;
  protected readonly AMB_LABELS = AMB_LABELS;
  protected readonly FILTER_STATUSES = FILTER_STATUSES;
  protected alertStatusFilter = signal<string[]>(['pending', 'assigned', 'en_route', 'cancelled']);

  protected auth = inject(AuthService);
  protected simulationService = inject(SimulationService);
  private ambulanceService = inject(AmbulanceService);
  private hospitalService = inject(HospitalService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);


  readonly hospital = signal<Hospital | null>(null);
  readonly ambulances = signal<Ambulance[]>([]);
  readonly alerts = signal<Alert[]>([]);
  readonly simPositions = signal<SimPosition[]>([]);

  readonly totalAmbulances = computed(() => this.ambulances().length);
  readonly availableCount = computed(() => this.ambulances().filter((a) => a.status === 'active').length);
  readonly busyCount = computed(() => this.ambulances().filter((a) => a.status === 'busy').length);
  readonly inactiveCount = computed(() => this.ambulances().filter((a) => a.status === 'inactive').length);
  readonly pendingAlerts = computed(() => this.alerts().filter((a) => a.status === 'pending').length);
  readonly activeAlerts = computed(() => this.alerts().filter((a) => a.status === 'assigned' || a.status === 'en_route' || a.status === 'at_scene' || a.status === 'returning').length);

  readonly center = computed<[number, number]>(() => {
    const h = this.hospital();
    if (h?.latitude && h?.longitude) return [h.longitude, h.latitude];
    return [-63.1825, -17.7833];
  });

  readonly markers = computed<MapMarker[]>(() => {
    const result: MapMarker[] = [];
    const sims = this.simPositions();

    const h = this.hospital();
    if (h?.latitude && h?.longitude) {
      result.push({
        id: 'hospital', lng: h.longitude, lat: h.latitude,
        title: h.name, subtitle: 'Hospital', color: '#1a1a1a', text: 'H',
      });
    }

    for (const a of this.ambulances()) {
      const simPos = sims.find(p => p.ambulanceId === a.id);
      if (!simPos) continue;
      const simLabel = simPos.status === 'en_route' ? 'En ruta' :
                       simPos.status === 'at_scene' ? 'En escena' :
                       simPos.status === 'returning' ? 'Regresando' : '';
      result.push({
        id: 'amb-' + a.id, lng: simPos.longitude, lat: simPos.latitude,
        title: a.plate,
        subtitle: simLabel || `${AMB_LABELS[a.status]} · ${a.driver?.name || 'Sin conductor'}`,
        color: AMB_COLORS[a.status] || '#888', iconSvg: AMBULANCE_ICON,
        pulse: true,
        data: { type: 'ambulance', ambulance: a },
      });
    }

    for (const al of this.alerts()) {
      result.push({
        id: 'alert-' + al.id, lng: al.longitude, lat: al.latitude,
        title: al.description, subtitle: ALERT_LABELS[al.status] || al.status,
        color: ALERT_COLORS[al.status] || '#888', text: '!',
        data: { type: 'alert', alert: al },
      });
    }

    return result;
  });

  constructor() {
    afterNextRender(() => {
      console.log('HospitalDashboard: Simulation status:', this.simulationService.status());
      const hospitalId = this.auth.hospitalId();
      if (!hospitalId) return;
      this.simulationService.checkStatus();
      this.hospitalService.getById(hospitalId).subscribe((h) => this.hospital.set(h));
      this.loadAmbulances();
      this.loadAlerts();
      this.loadSimPositions(hospitalId);
      const ambInt = setInterval(() => this.loadAmbulances(), 5000);
      const alertInt = setInterval(() => this.loadAlerts(), 5000);
      const simInt = setInterval(() => this.loadSimPositions(hospitalId), 3000);
      this.destroyRef.onDestroy(() => { clearInterval(ambInt); clearInterval(alertInt); clearInterval(simInt); });
    });
  }

  private loadSimPositions(hospitalId: string) {
    this.simulationService.getPositions(hospitalId).subscribe({
      next: (positions) => {
        const prev = this.simPositions();
        for (const pos of positions) {
          const prevPos = prev.find(p => p.ambulanceId === pos.ambulanceId);
          if (prevPos && prevPos.status !== 'completed' && pos.status === 'completed') {
            this.snackBar.open(`🚑 ${pos.plate} — Ha terminado el aviso`, '', { duration: 5000 });
          }
        }
        this.simPositions.set(positions);
      },
      error: () => {},
    });
  }

  private loadAmbulances() {
    const hospitalId = this.auth.hospitalId();
    if (!hospitalId) return;
    this.ambulanceService.getAll(hospitalId).subscribe((list) => this.ambulances.set(list));
  }

  protected toggleStatusFilter(status: string) {
    this.alertStatusFilter.update(list =>
      list.includes(status) ? list.filter(s => s !== status) : [...list, status]
    );
    this.loadAlerts();
  }

  private loadAlerts() {
    const hospitalId = this.auth.hospitalId();
    if (!hospitalId) return;
    this.alertService.getAll({
      hospitalId,
      status: this.alertStatusFilter(),
    }).subscribe((list) => this.alerts.set(list));
  }

  focusAmbulance(a: Ambulance) {
    const mv = document.querySelector('app-map-view') as any;
    if (mv?.flyTo && a.longitude && a.latitude) mv.flyTo(a.longitude, a.latitude, 15);
  }

  onMarkerClick(m: MapMarker) {
    const data = m.data;
    if (!data) return;
    if (data.type === 'ambulance') {
      const a = data.ambulance as Ambulance;
      const al = this.alerts().find(alert => alert.ambulanceId === a.id);
      if (!al) return;
      const h = this.hospital();
      this.dialog.open(AmbulanceTrackDialog, {
        data: {
          ambulance: { id: a.id, plate: a.plate, driver: a.driver, status: a.status },
          alert: { id: al.id, alertNumber: al.alertNumber, description: al.description, callerName: al.callerName, callerPhone: al.callerPhone, status: al.status, isSimulation: al.isSimulation },
          hospitalName: h?.name || '',
        } satisfies AmbulanceTrackData,
        panelClass: 'amb-track-panel',
      }).afterClosed().subscribe(result => {
        if (result?.follow) {
          this.viewSimulation(a.id);
        }
      });
    } else if (data.type === 'alert') {
      const al = data.alert as Alert;
      this.dialog.open(AlertDetailDialog, {
        data: al,
        panelClass: 'alert-detail-panel',
        backdropClass: 'alert-detail-backdrop',
      });
    }
  }

  openSimulateAlertDialog() {
    const h = this.hospital();
    if (!h) return;
    this.dialog.open(SimulateAlertDialog, {
      width: '800px',
      maxWidth: '95vw',
      data: { hospitalPos: [h.longitude, h.latitude] },
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadAlerts();
        this.loadAmbulances();
      }
    });
  }

  viewSimulation(ambulanceId: string) {
    const h = this.hospital();
    this.dialog.open(SimulationViewDialog, {
      width: '800px',
      maxWidth: '95vw',
      data: { 
        ambulanceId, 
        hospitalName: h?.name || '',
        hospitalPos: h ? [h.longitude, h.latitude] : null
      },
    });
  }

}
