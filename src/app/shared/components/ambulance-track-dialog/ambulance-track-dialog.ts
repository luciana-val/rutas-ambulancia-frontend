import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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

export interface AmbulanceTrackData {
  ambulance: { id: string; plate: string; driver: { name: string } | null; status: string };
  alert: { id: string; alertNumber: number; description: string; callerName: string; callerPhone: string; status: string; isSimulation: boolean };
  hospitalName: string;
}

@Component({
  selector: 'app-ambulance-track-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <div class="top-accent" [style.background]="ambColor"></div>
      <div class="dialog-header">
        <div class="header-left">
          <div class="amb-badge" [style.background]="ambColor">
            <mat-icon>local_shipping</mat-icon>
          </div>
          <div class="header-info">
            <h2 class="header-title">{{ data.ambulance.plate }}</h2>
            <span class="header-subtitle">{{ data.ambulance.driver?.name || 'Sin conductor' }}</span>
          </div>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-body">
        <div class="status-bar" [style.borderLeftColor]="ambColor">
          <span class="status-dot" [style.background]="ambColor"></span>
          <span class="status-label">{{ AMB_LABELS[data.ambulance.status] || data.ambulance.status }}</span>
          <span class="sim-badge">
            <mat-icon>science</mat-icon>
            Simulación
          </span>
        </div>

        <div class="section-title">
          <mat-icon>notification_important</mat-icon>
          <span>Alerta #{{ data.alert.alertNumber }}</span>
        </div>
        <p class="alert-desc">{{ data.alert.description }}</p>

        <div class="detail-grid">
          <div class="detail-card">
            <div class="detail-icon"><mat-icon>person</mat-icon></div>
            <div class="detail-body">
              <span class="detail-label">Solicitante</span>
              <span class="detail-value">{{ data.alert.callerName || '—' }}</span>
            </div>
          </div>
          <div class="detail-card">
            <div class="detail-icon"><mat-icon>phone</mat-icon></div>
            <div class="detail-body">
              <span class="detail-label">Teléfono</span>
              <span class="detail-value">{{ data.alert.callerPhone || '—' }}</span>
            </div>
          </div>
        </div>

        <div class="alert-status-row">
          <span class="alert-dot" [style.background]="alertColor"></span>
          <span>{{ ALERT_LABELS[data.alert.status] || data.alert.status }}</span>
        </div>

        <div class="hospital-row">
          <mat-icon>local_hospital</mat-icon>
          <span>{{ data.hospitalName }}</span>
        </div>
      </div>

      <div class="dialog-footer">
        <button mat-button class="btn-cancel" (click)="close()">Cerrar</button>
        <button mat-flat-button class="btn-track" (click)="followRoute()">
          <mat-icon>navigation</mat-icon>
          Seguir Rastro
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex; flex-direction: column;
      width: 420px; max-width: 95vw; max-height: 90vh;
      overflow: hidden; border-radius: 20px; background: white;
    }
    .top-accent { height: 4px; flex-shrink: 0; }
    .dialog-header {
      padding: 16px 20px; background: white;
      border-bottom: 1px solid #f0f0f0;
      display: flex; align-items: center; justify-content: space-between;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .amb-badge {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .amb-badge mat-icon { color: white; font-size: 20px; width: 20px; height: 20px; }
    .header-info { display: flex; flex-direction: column; }
    .header-title { font-size: 18px; font-weight: 700; margin: 0; color: #1a1a1a; }
    .header-subtitle { font-size: 13px; color: #888; margin: 2px 0 0; }
    .close-btn { color: #bbb; }

    .dialog-body {
      padding: 16px 20px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 14px;
    }

    .status-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; border-radius: 10px;
      background: #fafafa; border-left: 4px solid #1a1a1a;
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .status-label { font-size: 14px; font-weight: 600; color: #1a1a1a; flex: 1; }
    .sim-badge {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; font-weight: 600; padding: 3px 8px;
      border-radius: 20px; background: #f0f0f0; color: #555;
    }
    .sim-badge mat-icon { font-size: 13px; width: 13px; height: 13px; }

    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 600; color: #1a1a1a;
    }
    .section-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: #e53935; }
    .alert-desc {
      font-size: 14px; color: #555; margin: -8px 0 0; line-height: 1.4;
    }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .detail-card {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      background: #fafafa; min-width: 0;
    }
    .detail-icon {
      width: 32px; height: 32px; border-radius: 8px;
      background: #1a1a1a; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .detail-icon mat-icon { color: white; font-size: 16px; width: 16px; height: 16px; }
    .detail-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .detail-label { font-size: 10px; color: #999; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }
    .detail-value { font-size: 14px; font-weight: 600; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .alert-status-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #666;
    }
    .alert-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

    .hospital-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #666; padding: 2px 0;
    }
    .hospital-row mat-icon { font-size: 16px; width: 16px; height: 16px; color: #888; }

    .dialog-footer {
      padding: 14px 20px;
      border-top: 1px solid #f0f0f0;
      display: flex; justify-content: flex-end; gap: 10px;
    }
    .btn-cancel { color: #888; border-radius: 8px; font-weight: 500; }
    .btn-track {
      background: #1a1a1a !important; color: white !important;
      border-radius: 10px; padding: 8px 20px; font-weight: 600;
      display: flex; align-items: center; gap: 6px;
    }
  `],
})
export class AmbulanceTrackDialog {
  private dialogRef = inject(MatDialogRef<AmbulanceTrackDialog, { follow: boolean }>);
  data = inject(MAT_DIALOG_DATA) as AmbulanceTrackData;

  readonly AMB_LABELS = AMB_LABELS;
  readonly ALERT_LABELS = ALERT_LABELS;

  get ambColor() { return AMB_COLORS[this.data.ambulance.status] || '#888'; }
  get alertColor() { return ALERT_COLORS[this.data.alert.status] || '#888'; }

  followRoute() {
    this.dialogRef.close({ follow: true });
  }

  close() {
    this.dialogRef.close();
  }
}
