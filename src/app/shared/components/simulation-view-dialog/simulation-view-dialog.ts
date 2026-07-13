import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MapView } from '../map-view/map-view';
import { SimulationService, SimPosition } from '../../services/simulation.service';
import { MapMarker, AMBULANCE_ICON } from '../../services/map.service';
import { timer, Subscription } from 'rxjs';

@Component({
  selector: 'app-simulation-view-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MapView],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-info">
          <h2 class="header-title">Emergencia en Vivo</h2>
          <p class="header-subtitle">Monitoreando traslado en tiempo real</p>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="map-wrapper">
        <app-map-view
          [markers]="markers()"
          [route]="route()"
          routeColor="#1a1a1a"
          [center]="center()"
          [zoom]="14"
          [showControls]="false"
        />
        
        @if (status() === 'at_scene') {
          <div class="scene-overlay">
            <div class="scene-content">
              <mat-icon>check_circle</mat-icon>
              <h3>La ambulancia ya llegó a la zona</h3>
              <p>Regresando al hospital en {{ remainingSeconds() }} segundos...</p>
              <div class="scene-progress-track">
                <div class="scene-progress-fill" [style.width.%]="sceneProgress()"></div>
              </div>
            </div>
          </div>
        }
        
        @if (status() === 'completed') {
          <div class="finished-overlay">
            <div class="finished-content">
              <mat-icon>check_circle</mat-icon>
              <h3>Ruta terminada</h3>
              <p>La ambulancia llegó al hospital</p>
            </div>
          </div>
        }
      </div>
      
      <div class="flow-info">
        <div class="info-card">
          <div class="info-icon">
            <mat-icon>directions_car</mat-icon>
          </div>
          <div class="info-body">
            <span class="info-label">
              {{ status() === 'returning' ? 'Regresando al hospital' : 'Ambulancia en camino' }}
            </span>
            <span class="info-value">{{ ambulancePlate() }}</span>
            <div class="info-detail">
              <mat-icon>local_hospital</mat-icon>
              <span>{{ data.hospitalName }}</span>
            </div>
          </div>
        </div>
        
        <div class="info-progress">
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progressPercent()"></div>
          </div>
          <span class="progress-text">{{ progressPercent() }}%</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex; flex-direction: column;
      height: 680px; width: 800px; max-width: 95vw; max-height: 90vh;
      overflow: hidden; border-radius: 16px; background: white;
    }
    .dialog-header {
      padding: 16px 20px; background: white;
      border-bottom: 1px solid #eee;
      display: flex; align-items: center; justify-content: space-between;
      z-index: 10;
    }
    .header-info { display: flex; flex-direction: column; }
    .header-title { font-size: 18px; font-weight: 600; margin: 0; color: #1a1a1a; }
    .header-subtitle { font-size: 13px; color: #666; margin: 4px 0 0; }
    .close-btn { color: #999; }
    .map-wrapper { flex: 1; position: relative; min-height: 0; }
    
    .flow-info {
      padding: 20px 24px;
      background: white;
      border-top: 1px solid #e0e0e0;
      display: flex; gap: 24px; align-items: center;
      z-index: 10;
    }
    .info-card {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 20px; border-radius: 12px;
      background: #fafafa; flex: 1; min-width: 300px;
    }
    .info-icon {
      width: 48px; height: 48px; border-radius: 50%;
      background: #1a1a1a; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .info-icon mat-icon { color: white !important; font-size: 24px !important; width: 24px !important; height: 24px !important; }
    .info-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .info-label { font-size: 14px; color: #888; font-weight: 500; }
    .info-value { font-size: 20px; font-weight: 700; color: #1a1a1a; }
    .info-detail { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #555; }
    .info-detail mat-icon { font-size: 18px; width: 18px; height: 18px; color: #888; }
    
    .info-progress { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 240px; }
    .progress-track {
      flex: 1; height: 8px; border-radius: 4px;
      background: #e0e0e0; overflow: hidden;
    }
    .progress-fill {
      height: 100%; border-radius: 4px;
      background: linear-gradient(90deg, #555, #1a1a1a);
      transition: width 1s ease;
    }
    .progress-text { font-size: 18px; font-weight: 700; color: #1a1a1a; min-width: 48px; }

    .scene-overlay {
      position: absolute; inset: 0; background: rgba(255,255,255,0.8);
      display: flex; align-items: center; justify-content: center;
      z-index: 20; backdrop-filter: blur(4px);
    }
    .scene-content {
      background: white; padding: 32px; border-radius: 20px;
      text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      min-width: 320px;
    }
    .scene-content mat-icon { font-size: 60px; width: 60px; height: 60px; color: #1a1a1a; }
    .scene-content h3 { font-size: 22px; font-weight: 700; margin: 0; color: #1a1a1a; }
    .scene-content p { font-size: 15px; color: #666; margin: 0; }
    .scene-progress-track {
      width: 100%; height: 8px; border-radius: 4px;
      background: #e0e0e0; overflow: hidden; margin-top: 8px;
    }
    .scene-progress-fill {
      height: 100%; border-radius: 4px;
      background: linear-gradient(90deg, #555, #1a1a1a);
      transition: width 1s ease;
    }

    .finished-overlay {
      position: absolute; inset: 0; background: rgba(255,255,255,0.8);
      display: flex; align-items: center; justify-content: center;
      z-index: 20; backdrop-filter: blur(4px);
    }
    .finished-content {
      background: white; padding: 32px; border-radius: 20px;
      text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .finished-content mat-icon { font-size: 60px; width: 60px; height: 60px; color: #1a1a1a; }
    .finished-content h3 { font-size: 22px; font-weight: 700; margin: 0; color: #1a1a1a; }
    .finished-content p { font-size: 15px; color: #666; margin: 0; }
    .btn-close { background: #1a1a1a !important; color: white !important; border-radius: 8px; padding: 8px 24px; border: none; font-weight: 600; cursor: pointer; }
    
    @media (max-width: 600px) {
      .flow-info { flex-direction: column; align-items: stretch; gap: 16px; }
      .scene-content h2 { font-size: 24px; }
    }
  `],

})
export class SimulationViewDialog implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<SimulationViewDialog>);
  private simService = inject(SimulationService);
  data = inject(MAT_DIALOG_DATA) as { ambulanceId: string; hospitalName: string; hospitalPos: [number, number] | null };

  readonly ambulancePlate = signal('');
  readonly status = signal('');
  readonly center = signal<[number, number]>([-63.1825, -17.7833]);
  readonly markers = signal<MapMarker[]>([]);
  readonly route = signal<[number, number][]>([]);
  readonly progressPercent = signal(0);

  protected ambPos = signal<{ lat: number; lng: number } | null>(null);
  protected hospitalPos = signal<{ lat: number; lng: number } | null>(null);
  protected userPos = signal<{ lat: number; lng: number } | null>(null);
  protected sceneElapsed = signal(0);
  protected sceneProgress = signal(0);
  protected remainingSeconds = computed(() => Math.max(0, Math.ceil(15 - this.sceneElapsed())));

  private pollSub: Subscription | null = null;
  private sceneTimer: Subscription | null = null;
  private autoCloseTimer: Subscription | null = null;
  private hasCentered = false;
  private alertPos: { lat: number; lng: number } | null = null;

  ngOnInit() {
    this.startPolling();
  }

  private startSceneTimer() {
    this.sceneElapsed.set(0);
    this.sceneProgress.set(0);
    const duration = 15;
    const interval = 500; // ms
    const step = 100 / (duration * 1000 / interval);

    this.sceneTimer?.unsubscribe();
    this.sceneTimer = timer(0, interval).subscribe(() => {
      const next = this.sceneElapsed() + interval / 1000;
      if (next >= duration) {
        this.sceneElapsed.set(duration);
        this.sceneProgress.set(100);
        this.sceneTimer?.unsubscribe();
      } else {
        this.sceneElapsed.set(next);
        this.sceneProgress.set(Math.min(100, this.sceneProgress() + step));
      }
    });
  }

  private stopSceneTimer() {
    this.sceneTimer?.unsubscribe();
    this.sceneTimer = null;
  }

  private trimRoute(lat: number, lng: number) {
    const coords = this.route();
    if (coords.length < 2) return;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const dlng = coords[i][0] - lng;
      const dlat = coords[i][1] - lat;
      const d = dlng * dlng + dlat * dlat;
      if (d < minDist) { minDist = d; closest = i; }
    }
    if (closest > 0) this.route.set(coords.slice(closest));
  }

  private startPolling() {
    let prevStatus = '';

    this.pollSub = timer(0, 3000).subscribe(() => {
      this.simService.getPositions().subscribe(positions => {
        const pos = positions.find(p => p.ambulanceId === this.data.ambulanceId);
        if (pos) {
          console.log('[SimView] poll:', { status: pos.status, progress: pos.progress, lat: pos.latitude, lng: pos.longitude, routeLen: pos.route?.length });
          this.ambulancePlate.set(pos.plate);
          this.status.set(pos.status);
          this.route.set(pos.route as [number, number][]);
          
          if (pos.status === 'at_scene' && prevStatus !== 'at_scene') {
            this.startSceneTimer();
          } else if (pos.status !== 'at_scene' && prevStatus === 'at_scene') {
            this.stopSceneTimer();
          }
          if (pos.status === 'completed' && prevStatus !== 'completed') {
            this.scheduleAutoClose();
          }
          prevStatus = pos.status;
          if (!this.hasCentered) {
            this.center.set([pos.longitude, pos.latitude]);
            this.hasCentered = true;
          }
          
          this.progressPercent.set(Math.round(pos.progress * 100));

          this.ambPos.set({ lat: pos.latitude, lng: pos.longitude });
          this.trimRoute(pos.latitude, pos.longitude);

          if (!this.alertPos) {
            const firstCoord = pos.route[0];
            const lastCoord = pos.route[pos.route.length - 1];
            if (this.status() === 'returning' || this.status() === 'completed') {
              this.alertPos = { lat: firstCoord[1], lng: firstCoord[0] };
            } else {
              this.alertPos = { lat: lastCoord[1], lng: lastCoord[0] };
            }
          }

          this.userPos.set(this.alertPos);

          this.markers.set([
            {
              id: 'hospital',
              lng: this.data.hospitalPos ? this.data.hospitalPos[0] : -63.1825,
              lat: this.data.hospitalPos ? this.data.hospitalPos[1] : -17.7833,
              title: this.data.hospitalName,
              subtitle: 'Hospital',
              color: '#1a1a1a',
              text: 'H',
            },
            {
              id: 'ambulance',
              lng: pos.longitude,
              lat: pos.latitude,
              title: pos.plate,
              subtitle: this.status() === 'returning' ? 'Regresando al hospital' : 
                         this.status() === 'at_scene' ? 'Atendiendo emergencia' : 'Ambulancia en camino',
              color: '#1976d2',
              iconSvg: AMBULANCE_ICON,
              pulse: true,
            },
            {
              id: 'user',
              lng: this.alertPos.lng,
              lat: this.alertPos.lat,
              title: 'Emergencia',
              subtitle: 'Punto de destino',
              color: '#e53935',
              text: '+',
              pulse: true,
            }
          ]);
        } else {
          console.log('[SimView] ambulance NOT FOUND in positions, progressPercent:', this.progressPercent());
          if (this.progressPercent() >= 95) {
            this.status.set('completed');
            this.scheduleAutoClose();
          }
        }
      });
    });
  }

  private scheduleAutoClose() {
    console.log('[SimView] scheduling auto-close in 1.5s');
    this.autoCloseTimer?.unsubscribe();
    this.autoCloseTimer = timer(1500).subscribe(() => this.close());
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
    this.stopSceneTimer();
    this.autoCloseTimer?.unsubscribe();
  }
}
