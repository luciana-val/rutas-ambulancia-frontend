import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MapView } from '../map-view/map-view';
import { MapMarker } from '../../services/map.service';
import { SimulationService } from '../../services/simulation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-simulate-alert-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MapView],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-info">
          <h2 class="header-title">Crear Alerta Simulada</h2>
          <p class="header-subtitle">Selecciona un punto en el mapa para generar la emergencia</p>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="map-wrapper">
        <app-map-view
          [markers]="markers()"
          [center]="center"
          [zoom]="13"
          [interactive]="true"
          [showControls]="false"
          (mapClick)="onMapClick($event)"
        />
      </div>

      <div class="dialog-footer">
        <button mat-button (click)="close()">Cancelar</button>
        <button mat-flat-button 
                class="btn-confirm" 
                [disabled]="!selectedPos()" 
                (click)="confirmAlert()">
          <mat-icon>notifications_active</mat-icon>
          Confirmar y Crear Alerta
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex; flex-direction: column;
      height: 600px; width: 800px; max-width: 95vw; max-height: 90vh;
      overflow: hidden; border-radius: 16px; background: white;
    }
    .dialog-header {
      padding: 16px 20px; background: white;
      border-bottom: 1px solid #eee;
      display: flex; align-items: center; justify-content: space-between;
    }
    .header-info { display: flex; flex-direction: column; }
    .header-title { font-size: 18px; font-weight: 600; margin: 0; color: #1a1a1a; }
    .header-subtitle { font-size: 13px; color: #666; margin: 4px 0 0; }
    .close-btn { color: #999; }
    .map-wrapper { flex: 1; position: relative; }
    .dialog-footer {
      padding: 16px 24px;
      border-top: 1px solid #eee;
      display: flex; align-items: center; justify-content: flex-end; gap: 12px;
    }
    .btn-confirm {
      background: #1a1a1a !important; color: white !important;
      padding: 8px 24px; border-radius: 8px; font-weight: 600;
      display: flex; align-items: center; gap: 8px;
    }
    .btn-confirm:disabled { background: #ccc !important; color: #888 !important; }
  `],
})
export class SimulateAlertDialog {
  private dialogRef = inject(MatDialogRef<SimulateAlertDialog>);
  private simService = inject(SimulationService);
  private snackBar = inject(MatSnackBar);
  data = inject(MAT_DIALOG_DATA) as { hospitalPos: [number, number] };

  readonly center = this.data.hospitalPos;
  readonly selectedPos = signal<{ lat: number; lng: number } | null>(null);

  readonly markers = signal<MapMarker[]>([
    {
      id: 'hospital',
      lng: this.data.hospitalPos[0],
      lat: this.data.hospitalPos[1],
      title: 'Hospital',
      subtitle: 'Origen',
      color: '#1a1a1a',
      text: 'H',
    },
  ]);

  onMapClick(e: { lng: number; lat: number }) {
    this.selectedPos.set(e);
    this.markers.set([
      {
        id: 'hospital',
        lng: this.data.hospitalPos[0],
        lat: this.data.hospitalPos[1],
        title: 'Hospital',
        subtitle: 'Origen',
        color: '#1a1a1a',
        text: 'H',
      },
      {
        id: 'selected-point',
        lng: e.lng,
        lat: e.lat,
        title: 'Ubicación de Emergencia',
        color: '#f57f17',
        text: '!',
        pulse: true,
      },
    ]);
  }

  async confirmAlert() {
    const pos = this.selectedPos();
    if (!pos) return;

    this.simService.createPublicAlert(pos.lat, pos.lng).subscribe({
      next: async (res) => {
        try {
          const origin = `${res.ambulance.longitude},${res.ambulance.latitude}`;
          const dest = `${pos.lng},${pos.lat}`;
          const departAt = new Date().toISOString().slice(0, 19) + 'Z';
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin};${dest}?geometries=geojson&overview=full&depart_at=${departAt}&access_token=${environment.mapboxToken}`;
          const resp = await fetch(url);
          const data = await resp.json();

          if (!data.routes?.length) {
            this.snackBar.open('Alerta creada, pero no se pudo calcular la ruta de simulación', 'Cerrar', { duration: 4000 });
            this.dialogRef.close(true);
            return;
          }

          const routeData = data.routes[0];
          const coords: [number, number][] = routeData.geometry.coordinates;
          const duration = routeData.duration;
          const distance = routeData.distance;

          this.simService.saveRoute(res.alert.id, res.ambulance.id, coords, duration, distance).subscribe({
            next: () => {
              this.snackBar.open('Alerta simulada creada y ruta iniciada con éxito', 'Cerrar', { duration: 3000 });
              this.dialogRef.close(true);
            },
            error: () => {
              this.snackBar.open('Alerta creada, pero hubo un error al iniciar la ruta de simulación', 'Cerrar', { duration: 4000 });
              this.dialogRef.close(true);
            }
          });
        } catch (e) {
          console.error(e);
          this.snackBar.open('Alerta creada, pero falló la comunicación con el servicio de rutas', 'Cerrar', { duration: 4000 });
          this.dialogRef.close(true);
        }
      },
      error: () => this.snackBar.open('Error al crear la alerta', 'Cerrar', { duration: 3000 }),
    });
  }

  close() {
    this.dialogRef.close();
  }
}
