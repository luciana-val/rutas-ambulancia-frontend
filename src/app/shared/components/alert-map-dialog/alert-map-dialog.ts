import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MapView } from '../map-view/map-view';
import { MapMarker } from '../../services/map.service';
import { Alert } from '../../services/alert.service';

@Component({
  selector: 'app-alert-map-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MapView],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-info">
          <h2 class="header-title">Ubicación de Alerta</h2>
          <p class="header-subtitle">#{{ data.alertNumber }} - {{ data.description }}</p>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="map-wrapper">
        <app-map-view
          [markers]="markers"
          [center]="[data.longitude, data.latitude]"
          [zoom]="15"
          [showControls]="false"
        />
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      height: 500px;
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      overflow: hidden;
      border-radius: 16px;
    }
    .dialog-header {
      padding: 16px 20px;
      background: white;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }
    .header-info {
      display: flex;
      flex-direction: column;
    }
    .header-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      color: #1a1a1a;
    }
    .header-subtitle {
      font-size: 13px;
      color: #666;
      margin: 4px 0 0;
    }
    .close-btn {
      color: #999;
    }
    .map-wrapper {
      flex: 1;
      position: relative;
    }
  `],
})
export class AlertMapDialog {
  private dialogRef = inject(MatDialogRef<AlertMapDialog>);
  data = inject(MAT_DIALOG_DATA) as Alert;
  
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

  close() {
    this.dialogRef.close();
  }
}
