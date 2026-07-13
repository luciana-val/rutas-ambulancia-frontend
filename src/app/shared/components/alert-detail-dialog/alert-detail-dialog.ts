import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Alert } from '../../services/alert.service';
import { MapView } from '../map-view/map-view';
import { MapMarker } from '../../services/map.service';

const ALERT_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  assigned: 'Asignada',
  en_route: 'En ruta',
  at_scene: 'En el lugar',
  returning: 'Regresando',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const ALERT_COLORS: Record<string, string> = {
  pending: '#f57f17',
  assigned: '#1565c0',
  en_route: '#1976d2',
  at_scene: '#e53935',
  returning: '#ef6c00',
  completed: '#2dc937',
  cancelled: '#999',
};

@Component({
  selector: 'app-alert-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MapView],
  template: `
    <div class="dialog-container">
      <div class="top-accent" [style.background]="statusColor"></div>
      <div class="dialog-header">
        <div class="header-left">
          <div class="alert-badge" [style.background]="statusColor">
            <mat-icon>notification_important</mat-icon>
          </div>
          <div class="header-info">
            <h2 class="header-title">Alerta #{{ data.alertNumber }}</h2>
            <span class="header-subtitle">{{ data.description }}</span>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-body">
        <div class="status-bar" [style.borderLeftColor]="statusColor">
          <span class="status-dot" [style.background]="statusColor"></span>
          <span class="status-label">{{ statusLabel }}</span>
          <span class="sim-badge" [class.real]="!data.isSimulation">
            <mat-icon>{{ data.isSimulation ? 'science' : 'emergency' }}</mat-icon>
            {{ data.isSimulation ? 'Simulación' : 'Real' }}
          </span>
        </div>

        <div class="detail-grid">
          <div class="detail-card">
            <div class="detail-icon"><mat-icon>person</mat-icon></div>
            <div class="detail-body">
              <span class="detail-label">Nombre del Solicitante</span>
              <span class="detail-value">{{ data.callerName || '—' }}</span>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-icon"><mat-icon>phone</mat-icon></div>
            <div class="detail-body">
              <span class="detail-label">Teléfono</span>
              <span class="detail-value">{{ data.callerPhone || '—' }}</span>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-icon"><mat-icon>local_hospital</mat-icon></div>
            <div class="detail-body">
              <span class="detail-label">Hospital Asignado</span>
              <span class="detail-value">{{ data.hospital?.name || '—' }}</span>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-icon"><mat-icon>local_shipping</mat-icon></div>
            <div class="detail-body">
              <span class="detail-label">Ambulancia</span>
              <span class="detail-value">{{ data.ambulance?.plate || 'Sin asignar' }}</span>
            </div>
          </div>
        </div>

        <div class="timestamps">
          <div class="ts-item">
            <mat-icon>schedule</mat-icon>
            <div>
              <span class="ts-label">Creada</span>
              <span class="ts-value">{{ createdAt }}</span>
            </div>
          </div>
          <div class="ts-divider"></div>
          <div class="ts-item">
            <mat-icon>update</mat-icon>
            <div>
              <span class="ts-label">Última actualización</span>
              <span class="ts-value">{{ updatedAt }}</span>
            </div>
          </div>
        </div>

        <div class="coords-row">
          <mat-icon>location_on</mat-icon>
          <span>{{ data.latitude.toFixed(6) }}, {{ data.longitude.toFixed(6) }}</span>
        </div>

        <div class="map-section">
          <app-map-view
            [markers]="markers"
            [center]="[data.longitude, data.latitude]"
            [zoom]="15"
            [showControls]="false"
          />
        </div>
      </div>

      <div class="dialog-footer">
        <button mat-flat-button class="btn-close" (click)="close()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex; flex-direction: column;
      width: 520px; max-width: 95vw; max-height: 90vh;
      overflow: hidden; border-radius: 20px; background: white;
    }
    .top-accent { height: 4px; flex-shrink: 0; }
    .dialog-header {
      padding: 20px 24px; background: white;
      border-bottom: 1px solid #f0f0f0;
      display: flex; align-items: center; justify-content: space-between;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .alert-badge {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .alert-badge mat-icon { color: white; font-size: 22px; width: 22px; height: 22px; }
    .header-info { display: flex; flex-direction: column; }
    .header-title { font-size: 20px; font-weight: 700; margin: 0; color: #1a1a1a; }
    .header-subtitle { font-size: 14px; color: #888; margin: 2px 0 0; }
    .close-btn { color: #bbb; }

    .dialog-body {
      padding: 20px 24px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 20px;
    }

    .status-bar {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-radius: 12px;
      background: #fafafa; border-left: 4px solid #1a1a1a;
    }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .status-label { font-size: 15px; font-weight: 600; color: #1a1a1a; flex: 1; }
    .sim-badge {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 600; padding: 4px 10px;
      border-radius: 20px; background: #f0f0f0; color: #555;
    }
    .sim-badge.real { background: #ffebee; color: #c62828; }
    .sim-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .detail-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    }
    .detail-card {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; border-radius: 12px;
      background: #fafafa; min-width: 0;
    }
    .detail-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: #1a1a1a; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .detail-icon mat-icon { color: white; font-size: 18px; width: 18px; height: 18px; }
    .detail-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .detail-label { font-size: 11px; color: #999; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }
    .detail-value { font-size: 15px; font-weight: 600; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .timestamps {
      display: flex; align-items: center; gap: 16px;
      padding: 12px 16px; border-radius: 12px;
      background: #fafafa;
    }
    .ts-item { display: flex; align-items: center; gap: 10px; flex: 1; }
    .ts-item mat-icon { font-size: 18px; width: 18px; height: 18px; color: #888; }
    .ts-item div { display: flex; flex-direction: column; }
    .ts-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.3px; }
    .ts-value { font-size: 13px; color: #1a1a1a; font-weight: 500; }
    .ts-divider { width: 1px; height: 32px; background: #e0e0e0; }

    .coords-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #666; padding: 4px 0;
    }
    .coords-row mat-icon { font-size: 16px; width: 16px; height: 16px; color: #888; }

    .map-section {
      height: 240px; border-radius: 12px; overflow: hidden;
      border: 1px solid #eee; flex-shrink: 0;
    }

    .dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #f0f0f0;
      display: flex; justify-content: flex-end;
    }
    .btn-close {
      background: #1a1a1a !important; color: white !important;
      border-radius: 10px; padding: 8px 28px; font-weight: 600;
    }
  `],
})
export class AlertDetailDialog {
  private dialogRef = inject(MatDialogRef<AlertDetailDialog>);
  data = inject(MAT_DIALOG_DATA) as Alert;

  readonly ALERT_LABELS = ALERT_LABELS;

  markers: MapMarker[] = [{
    id: this.data.id,
    lng: this.data.longitude,
    lat: this.data.latitude,
    title: `Alerta #${this.data.alertNumber}`,
    subtitle: this.data.description,
    color: '#c62828',
    text: '!',
    pulse: true,
  }];

  get statusColor() { return ALERT_COLORS[this.data.status] || '#888'; }

  get statusLabel() { return ALERT_LABELS[this.data.status] || this.data.status; }

  get createdAt() {
    return new Date(this.data.createdAt).toLocaleString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  get updatedAt() {
    return new Date(this.data.updatedAt).toLocaleString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  close() {
    this.dialogRef.close();
  }
}
