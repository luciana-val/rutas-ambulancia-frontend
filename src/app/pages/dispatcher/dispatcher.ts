import { Component, inject, signal, computed, afterNextRender, DestroyRef } from '@angular/core';
import { timer, Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { AmbulanceService, Ambulance } from '../../shared/services/ambulance.service';
import { AlertService, Alert, CreateAlertDto } from '../../shared/services/alert.service';
import { SimulationService, SimPosition } from '../../shared/services/simulation.service';
import { MapView } from '../../shared/components/map-view/map-view';
import { MapMarker, AMBULANCE_ICON } from '../../shared/services/map.service';
import { environment } from '../../../environments/environment';

const STATUS_COLORS: Record<string, string> = {
  active: '#2dc937', busy: '#e7b416', inactive: '#888888',
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', busy: 'Ocupado', inactive: 'Inactivo',
};
const ALERT_COLORS: Record<string, string> = {
  pending: '#e53935', assigned: '#e7b416', en_route: '#1976d2',
  completed: '#2dc937', cancelled: '#888888',
};
const ALERT_LABELS: Record<string, string> = {
  pending: 'Pendiente', assigned: 'Asignada', en_route: 'En ruta',
  completed: 'Completada', cancelled: 'Cancelada',
};

@Component({
  selector: 'app-dispatcher',
  imports: [
    MapView, MatCardModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatSnackBarModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, FormsModule, NgClass,
  ],
  template: `
    <div class="page-container">
      <h1 class="page-title">Panel de Despacho</h1>
      <p class="page-subtitle">Asignación y seguimiento de ambulancias</p>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon class="stat-icon stat-green">check_circle</mat-icon>
            <div class="stat-value">{{ activeCount() }}</div>
            <div class="stat-label">Activas</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon class="stat-icon stat-orange">directions_car</mat-icon>
            <div class="stat-value">{{ busyCount() }}</div>
            <div class="stat-label">Ocupadas</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon class="stat-icon stat-gray">pending_actions</mat-icon>
            <div class="stat-value">{{ inactiveCount() }}</div>
            <div class="stat-label">Inactivas</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <mat-icon class="stat-icon">notification_important</mat-icon>
            <div class="stat-value">{{ pendingAlerts() }}</div>
            <div class="stat-label">Alertas pendientes</div>
          </mat-card-content>
        </mat-card>
      </div>

      @if (simulation.status().enabled) {
        <div class="sim-toolbar">
          <span class="sim-toolbar-label">🧪 Simulación activa</span>
          <button mat-flat-button class="btn-new-alert" (click)="startNewAlert()">
            <mat-icon>add_location</mat-icon>
            Nueva alerta simulada
          </button>
          @if (creatingAlert) {
            <span class="creating-hint">Haz clic en el mapa para colocar la alerta...</span>
          }
        </div>
      }

      <div class="content-grid">
        <mat-card class="map-card">
          <mat-card-content>
            <app-map-view
              [markers]="markers()"
              [route]="routeCoords()"
              routeColor="#1565c0"
              [center]="center()"
              [zoom]="12"
              [showControls]="true"
              [showTraffic]="true"
              [interactive]="true"
              (markerClick)="onMarkerClick($event)"
              (mapClick)="onMapClick($event)"
            />
          </mat-card-content>
        </mat-card>

        <mat-card class="list-card">
          <div class="list-header">
            <h3>Ambulancias</h3>
            <span class="list-count">{{ ambulances().length }}</span>
          </div>
          <div class="ambulance-list">
            @for (a of ambulances(); track a.id) {
              <div class="ambulance-item" [class.selected]="selectedId() === a.id" (click)="selectAmbulance(a)">
                <div class="amb-status-dot" [style.background]="STATUS_COLORS[a.status]"></div>
                <div class="amb-info">
                  <div class="amb-plate">{{ a.plate }}</div>
                  <div class="amb-driver">{{ a.driver?.name || 'Sin conductor' }}</div>
                </div>
                <span class="status-badge" [ngClass]="'status-' + a.status">{{ STATUS_LABELS[a.status] }}</span>
              </div>
            }
            @if (ambulances().length === 0) {
              <div class="empty">No hay ambulancias</div>
            }
          </div>
        </mat-card>
      </div>

      @if (selectedAmbulance(); as sel) {
        <mat-card class="action-card">
          <div class="action-row">
            <span class="action-label">{{ sel.plate }} — Cambiar estado:</span>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-select [(ngModel)]="selectedStatus" (selectionChange)="changeStatus(sel)">
                @for (s of statuses; track s) {
                  <mat-option [value]="s.value">{{ s.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card>
      }
    </div>

    @if (showAlertDialog) {
      <div class="dialog-overlay" (click)="cancelAlert()">
        <div class="dialog-box" (click)="$event.stopPropagation()">
          <h3>Nueva alerta simulada</h3>
          <p class="dialog-coords">Ubicación: {{ alertLat.toFixed(4) }}, {{ alertLng.toFixed(4) }}</p>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripción</mat-label>
            <input matInput [(ngModel)]="alertDescription" placeholder="Ej: Accidente en Av. Principal" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre del solicitante</mat-label>
            <input matInput [(ngModel)]="alertCaller" placeholder="Juan Pérez" />
          </mat-form-field>
          <div class="dialog-actions">
            <button mat-button (click)="cancelAlert()">Cancelar</button>
            <button mat-flat-button color="primary" [disabled]="!alertDescription" (click)="createSimAlert()">Crear alerta</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .stat-card { text-align: center; padding: 20px; border-radius: 12px !important; }
    .stat-icon { font-size: 36px; width: 36px; height: 36px; color: #1976d2; margin-bottom: 8px; }
    .stat-green { color: #2dc937; }
    .stat-orange { color: #e7b416; }
    .stat-gray { color: #888; }
    .stat-value { font-size: 32px; font-weight: 700; color: #333; }
    .stat-label { color: #666; font-size: 13px; margin-top: 2px; }
    .sim-toolbar {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      background: #f4f0ff; border: 1px solid #d0c4ff; border-radius: 12px; margin-bottom: 16px;
    }
    .sim-toolbar-label { font-weight: 600; font-size: 14px; color: #7c4dff; }
    .btn-new-alert { background: #7c4dff !important; color: white !important; border-radius: 8px !important; }
    .creating-hint { font-size: 13px; color: #999; font-style: italic; }
    .content-grid { display: grid; grid-template-columns: 1fr 360px; gap: 16px; }
    @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } }
    .map-card { border-radius: 12px !important; overflow: hidden; }
    .map-card app-map-view { height: 500px; display: block; }
    .list-card { border-radius: 12px !important; padding: 0; }
    .list-header { display: flex; align-items: center; gap: 8px; padding: 16px 16px 0; }
    .list-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
    .list-count { background: #e8e8e8; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }
    .ambulance-list { padding: 8px; }
    .ambulance-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 8px; border-radius: 8px;
      cursor: pointer; transition: background 0.15s;
    }
    .ambulance-item:hover { background: #f5f5f5; }
    .ambulance-item.selected { background: #e3f2fd; }
    .amb-status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .amb-info { flex: 1; min-width: 0; }
    .amb-plate { font-weight: 600; font-size: 14px; }
    .amb-driver { font-size: 12px; color: #888; }
    .status-badge { padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-busy { background: #fff3e0; color: #e65100; }
    .status-inactive { background: #f5f5f5; color: #999; }
    .empty { text-align: center; padding: 32px; color: #999; font-size: 14px; }
    .action-card { margin-top: 16px; border-radius: 12px !important; }
    .action-row { display: flex; align-items: center; gap: 16px; padding: 4px 0; }
    .action-label { font-weight: 500; font-size: 14px; white-space: nowrap; }
    .dialog-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    }
    .dialog-box {
      background: white; border-radius: 12px; padding: 24px; width: 400px; max-width: 90vw;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .dialog-box h3 { margin: 0 0 8px; font-size: 18px; font-weight: 600; }
    .dialog-coords { color: #999; font-size: 13px; margin: 0 0 16px; }
    .full-width { width: 100%; margin-bottom: 12px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
  `],
})
export class Dispatcher {
  protected readonly STATUS_COLORS = STATUS_COLORS;
  protected readonly STATUS_LABELS = STATUS_LABELS;

  private auth = inject(AuthService);
  private ambulanceService = inject(AmbulanceService);
  private alertService = inject(AlertService);
  protected simulation = inject(SimulationService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  readonly ambulances = signal<Ambulance[]>([]);
  readonly alerts = signal<Alert[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly selectedStatus = signal<string>('');
  readonly pendingAlerts = signal(0);
  readonly simPositions = signal<SimPosition[]>([]);

  private subs: Subscription[] = [];
  readonly routeCoords = signal<[number, number][]>([]);
  readonly routeAlertId = signal<string | null>(null);

  protected creatingAlert = false;
  protected showAlertDialog = false;
  protected alertLat = 0;
  protected alertLng = 0;
  protected alertDescription = '';
  protected alertCaller = '';

  protected readonly center = computed(() => {
    const a = this.ambulances();
    if (a.length === 0) return [-63.1825, -17.7833] as [number, number];
    const avgLng = a.reduce((s, v) => s + (v.longitude ?? 0), 0) / a.length;
    const avgLat = a.reduce((s, v) => s + (v.latitude ?? 0), 0) / a.length;
    return [avgLng || -63.1825, avgLat || -17.7833] as [number, number];
  });

  protected readonly markers = computed<MapMarker[]>(() => {
    const sim = this.simPositions();
    const hasSim = sim.length > 0;
    const amb = this.ambulances();
    const alerts = this.alerts();
    const result: MapMarker[] = [];

    // alert markers
    for (const al of alerts) {
      if (al.status === 'completed' || al.status === 'cancelled') continue;
      result.push({
        id: 'alert-' + al.id,
        lng: al.longitude, lat: al.latitude,
        title: al.description,
        subtitle: ALERT_LABELS[al.status] || al.status,
        color: ALERT_COLORS[al.status] || '#888',
        text: '!',
        data: { type: 'alert', alert: al },
      });
    }

    // ambulance markers
    if (hasSim) {
      const simMap = new Map(sim.map((s) => [s.ambulanceId, s]));
      for (const a of amb) {
        const sp = simMap.get(a.id);
        if (sp) {
          result.push({
            id: a.id,
            lng: sp.longitude, lat: sp.latitude,
            title: a.plate,
            subtitle: `${(sp.progress * 100).toFixed(0)}% — ${STATUS_LABELS[sp.status === 'completed' ? 'active' : 'busy']}`,
            color: sp.status === 'completed' ? '#2dc937' : '#e7b416',
            iconSvg: AMBULANCE_ICON,
            data: { type: 'ambulance', ambulance: a },
          });
        } else if (a.latitude && a.longitude) {
          result.push({
            id: a.id, lng: a.longitude, lat: a.latitude,
            title: a.plate, subtitle: a.driver?.name || 'Sin conductor',
            color: STATUS_COLORS[a.status] || '#888', iconSvg: AMBULANCE_ICON,
            data: { type: 'ambulance', ambulance: a },
          });
        }
      }
    } else {
      for (const a of amb) {
        if (!a.latitude || !a.longitude) continue;
        result.push({
          id: a.id, lng: a.longitude, lat: a.latitude,
          title: a.plate, subtitle: a.driver?.name || 'Sin conductor',
          color: STATUS_COLORS[a.status] || '#888', iconSvg: AMBULANCE_ICON,
          data: { type: 'ambulance', ambulance: a },
        });
      }
    }

    return result;
  });

  protected readonly activeCount = computed(() => this.ambulances().filter((a) => a.status === 'active').length);
  protected readonly busyCount = computed(() => this.ambulances().filter((a) => a.status === 'busy').length);
  protected readonly inactiveCount = computed(() => this.ambulances().filter((a) => a.status === 'inactive').length);

  protected readonly selectedAmbulance = computed(() =>
    this.ambulances().find((a) => a.id === this.selectedId()),
  );

  protected readonly statuses = [
    { value: 'active', label: 'Activo' },
    { value: 'busy', label: 'Ocupado' },
    { value: 'inactive', label: 'Inactivo' },
  ];

  constructor() {
    afterNextRender(() => {
      this.loadData();
      const ambInterval = setInterval(() => this.loadAmbulances(), 5000);
      const alertInterval = setInterval(() => this.loadAlerts(), 5000);
      const simInterval = setInterval(() => this.loadSimPositions(), 3000);
      this.destroyRef.onDestroy(() => {
        clearInterval(ambInterval);
        clearInterval(alertInterval);
        clearInterval(simInterval);
        this.subs.forEach((s) => s.unsubscribe());
      });
    });
  }

  private loadData() {
    this.loadAmbulances();
    this.loadPendingAlerts();
    this.loadAlerts();
    this.loadSimPositions();
  }

  private loadAlerts() {
    const hospitalId = this.auth.hospitalId();
    if (!hospitalId) return;
    this.alertService.getAll({ hospitalId }).subscribe((list) => this.alerts.set(list));
  }

  private loadAmbulances() {
    const hospitalId = this.auth.hospitalId();
    if (!hospitalId) return;
    this.ambulanceService.getAll(hospitalId).subscribe((list) => this.ambulances.set(list));
  }

  private loadPendingAlerts() {
    const hospitalId = this.auth.hospitalId();
    if (!hospitalId) return;
    this.alertService.getAll({ hospitalId }).subscribe((list) =>
      this.pendingAlerts.set(list.filter((a) => a.status === 'pending' || a.status === 'assigned').length),
    );
  }

  private loadSimPositions() {
    if (!this.simulation.status().enabled) return;
    const hospitalId = this.auth.hospitalId();
    if (!hospitalId) return;
    this.simulation.getPositions(hospitalId).subscribe({
      next: (poses) => {
        this.simPositions.set(poses);
        const rid = this.routeAlertId();
        if (!rid) return;
        const completed = poses.find((p) => p.alertId === rid);
        if (completed?.status === 'completed') {
          this.routeCoords.set([]);
          this.routeAlertId.set(null);
        } else if (completed) {
          const coords = this.routeCoords();
          if (coords.length > 1) {
            let closest = 0;
            let minDist = Infinity;
            for (let i = 0; i < coords.length; i++) {
              const dlng = coords[i][0] - completed.longitude;
              const dlat = coords[i][1] - completed.latitude;
              const d = dlng * dlng + dlat * dlat;
              if (d < minDist) { minDist = d; closest = i; }
            }
            if (closest > 0) this.routeCoords.set(coords.slice(closest));
          }
        }
      },
    });
  }

  selectAmbulance(a: Ambulance) {
    this.selectedId.set(a.id);
    this.selectedStatus.set(a.status);
  }

  changeStatus(a: Ambulance) {
    if (this.selectedStatus() === a.status) return;
    const fd = new FormData();
    fd.append('status', this.selectedStatus());
    this.ambulanceService.update(a.id, fd).subscribe({
      next: () => {
        this.snackBar.open(`Ambulancia ${a.plate} → ${STATUS_LABELS[this.selectedStatus()]}`, 'Cerrar', { duration: 3000 });
        this.loadAmbulances();
      },
      error: () => this.snackBar.open('Error al cambiar estado', 'Cerrar', { duration: 3000 }),
    });
  }

  onMarkerClick(marker: MapMarker) {
    const a = marker.data as Ambulance;
    if (a) this.selectAmbulance(a);
  }

  startNewAlert() {
    this.creatingAlert = true;
    this.snackBar.open('Haz clic en el mapa para colocar la alerta', 'OK', { duration: 5000 });
  }

  onMapClick(e: { lng: number; lat: number }) {
    if (!this.creatingAlert) return;
    this.creatingAlert = false;
    this.alertLat = e.lat;
    this.alertLng = e.lng;
    this.alertDescription = '';
    this.alertCaller = '';
    this.showAlertDialog = true;
  }

  cancelAlert() {
    this.showAlertDialog = false;
    this.alertDescription = '';
    this.alertCaller = '';
  }

  createSimAlert() {
    const hospitalId = this.auth.hospitalId();
    if (!hospitalId || !this.alertDescription) return;

    this.showAlertDialog = false;
    const dto: CreateAlertDto = {
      hospitalId, latitude: this.alertLat, longitude: this.alertLng,
      description: this.alertDescription, callerName: this.alertCaller || undefined,
    };

    this.alertService.create(dto).subscribe({
      next: (alert) => {
        this.snackBar.open(`Alerta creada, asignando ambulancia...`, 'Cerrar', { duration: 3000 });
        this.loadPendingAlerts();
        this.assignAmbulance(alert.id);
      },
    });
  }

  private assignAmbulance(alertId: string) {
    this.simulation.assign(alertId).subscribe({
      next: (res) => {
        this.snackBar.open(`Ambulancia ${res.ambulance.plate} asignada, calculando ruta...`, 'Cerrar', { duration: 3000 });
        this.loadAmbulances();
        this.loadPendingAlerts();
        this.calculateRoute(alertId, res.ambulance);
      },
      error: (err) => {
        this.snackBar.open('Error al asignar ambulancia: ' + (err.error?.message || err.message), 'Cerrar', { duration: 5000 });
      },
    });
  }

  private async calculateRoute(alertId: string, ambulance: { id: string; plate: string; latitude: number; longitude: number }) {
    const alert = await this.alertService.getById(alertId).toPromise();
    if (!alert) return;

    const origin = `${ambulance.longitude},${ambulance.latitude}`;
    const dest = `${alert.longitude},${alert.latitude}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin};${dest}?geometries=geojson&overview=full&access_token=${environment.mapboxToken}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.routes?.length) throw new Error('No route found');

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates as number[][];
      const duration = route.duration as number;
      const distance = route.distance as number;

      this.routeCoords.set(coordinates as [number, number][]);
      this.routeAlertId.set(alertId);

      this.simulation.saveRoute(alertId, ambulance.id, coordinates, duration, distance).subscribe({
        next: () => {
          this.snackBar.open(`${ambulance.plate} en ruta — ${(duration / 60).toFixed(1)} min (simulado ×10)`, 'Cerrar', { duration: 4000 });
          this.loadSimPositions();
        },
      });
    } catch {
      this.snackBar.open('Error al calcular ruta', 'Cerrar', { duration: 4000 });
    }
  }
}
