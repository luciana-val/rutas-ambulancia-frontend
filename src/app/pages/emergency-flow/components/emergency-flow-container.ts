import { Component, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MapView } from '../../../shared/components/map-view/map-view';
import { MapMarker } from '../../../shared/services/map.service';

@Component({
  selector: 'app-emergency-flow-container',
  standalone: true,
  imports: [MatIconModule, MapView, MatButtonModule, MatTooltipModule],
  template: `
    <div class="flow-container">
      <button class="flow-back-btn" (click)="exit.emit()">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <div class="flow-map">
        <button class="traffic-toggle" 
                [class.active]="showTraffic()" 
                (click)="showTraffic.set(!showTraffic())"
                matTooltip="Capas de tráfico">
          <mat-icon>traffic</mat-icon>
        </button>
        <app-map-view
          [markers]="markers()"
          [route]="route()"
          routeColor="#1a1a1a"
          [center]="[-63.1825, -17.7833]"
          [zoom]="12"
          [interactive]="false"
          [showControls]="false"
          [showTraffic]="showTraffic()"
          (markerClick)="markerClick.emit($event)"
          style="width:100%;height:100%;"
        />
      </div>

      <div class="flow-info">
        @if (state() === 'found' || state() === 'fetching_route') {
          <div class="info-card">
            <div class="info-icon info-icon-found">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="info-body">
              <span class="info-label">Ambulancia asignada</span>
              <span class="info-value">{{ ambulancePlate() }}</span>
              <div class="info-detail">
                <mat-icon>local_hospital</mat-icon>
                <span>{{ hospitalName() }}</span>
              </div>
              @if (driverName()) {
                <div class="info-detail">
                  <mat-icon>person</mat-icon>
                  <span>{{ driverName() }}</span>
                </div>
              }
            </div>
          </div>
          @if (state() === 'fetching_route') {
            <div class="info-route">
              <mat-icon class="spin">route</mat-icon>
              <span>Calculando ruta óptima...</span>
            </div>
          }
        }

        @if (state() === 'simulating') {
          <div class="info-card">
            <div class="info-icon info-icon-enroute">
              <mat-icon>directions_car</mat-icon>
            </div>
            <div class="info-body">
              <span class="info-label">En camino</span>
              <span class="info-value">{{ ambulancePlate() }}</span>
              <div class="info-detail">
                <mat-icon>local_hospital</mat-icon>
                <span>{{ hospitalName() }}</span>
              </div>
              @if (etaFormatted()) {
                <div class="info-detail">
                  <mat-icon>schedule</mat-icon>
                  <span>Tiempo estimado: <strong>{{ etaFormatted() }}</strong></span>
                </div>
              }
            </div>
          </div>
          <div class="info-progress">
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="progress()"></div>
            </div>
            <span class="progress-text">{{ progress() }}%</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .flow-container {
      position: fixed; inset: 0; z-index: 50;
      display: flex; flex-direction: column;
      background: #fff;
    }
    .flow-back-btn {
      position: absolute; top: max(16px, env(safe-area-inset-top, 16px));
      left: 16px; z-index: 60;
      background: white; border: none; color: #1a1a1a; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      width: 52px; height: 52px; border-radius: 50%;
      box-shadow: 0 3px 12px rgba(0,0,0,0.15);
      transition: background 0.2s;
    }
    .flow-back-btn:hover { background: #f0f0f0; }
    .flow-back-btn mat-icon { font-size: 30px; width: 30px; height: 30px; }
    .flow-map { flex: 1; min-height: 0; position: relative; }
    .traffic-toggle {
      position: absolute; bottom: 24px;
      right: 16px; z-index: 60;
      background: white; border: none; color: #1a1a1a; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      width: 52px; height: 52px; border-radius: 50%;
      box-shadow: 0 3px 12px rgba(0,0,0,0.15);
      transition: background 0.2s;
    }
    .traffic-toggle:hover { background: #f0f0f0; }
    .traffic-toggle.active { background: #1a1a1a; color: white !important; }
    .traffic-toggle mat-icon { font-size: 30px; width: 30px; height: 30px; }
    .flow-info {
      padding: clamp(20px, 4vw, 28px) clamp(24px, 5vw, 32px) clamp(24px, 5vw, 32px);
      background: white;
      border-top: 1px solid #e0e0e0;
      display: flex; flex-direction: column; gap: 16px;
    }
    .info-card {
      display: flex; align-items: center; gap: 20px;
      padding: 22px 24px; border-radius: 16px;
      background: #fafafa;
    }
    .info-icon {
      width: 60px; height: 60px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .info-icon-found { background: #1a1a1a; }
    .info-icon-enroute { background: #333; }
    .info-icon mat-icon { color: white !important; font-size: 32px !important; width: 32px !important; height: 32px !important; }
    .info-body { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .info-label { font-size: clamp(15px, 3.5vw, 18px); color: #888; font-weight: 500; }
    .info-value { font-size: clamp(20px, 4.5vw, 26px); font-weight: 700; color: #1a1a1a; }
    .info-detail { display: flex; align-items: center; gap: 8px; font-size: clamp(15px, 3.5vw, 18px); color: #555; }
    .info-detail mat-icon { font-size: 20px; width: 20px; height: 20px; color: #888; }
    .info-route {
      display: flex; align-items: center; gap: 12px;
      font-size: clamp(16px, 3.5vw, 20px); color: #888; padding: 8px 0;
    }
    .info-route mat-icon { font-size: 26px; width: 26px; height: 26px; }
    .info-progress { display: flex; align-items: center; gap: 14px; }
    .progress-track {
      flex: 1; height: 10px; border-radius: 5px;
      background: #e0e0e0; overflow: hidden;
    }
    .progress-fill {
      height: 100%; border-radius: 5px;
      background: linear-gradient(90deg, #555, #1a1a1a);
      transition: width 1s ease;
    }
    .progress-text { font-size: clamp(18px, 4vw, 22px); font-weight: 700; color: #1a1a1a; min-width: 56px; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
    @media (max-width: 600px) {
      .flow-info { padding-bottom: max(24px, env(safe-area-inset-bottom, 24px)); }
    }
    @media (max-width: 380px) {
      .info-card { padding: 16px; gap: 14px; }
      .info-icon { width: 50px; height: 50px; }
      .info-icon mat-icon { font-size: 26px !important; width: 26px !important; height: 26px !important; }
    }
    @media (min-width: 768px) {
      .flow-info {
        flex-direction: row; flex-wrap: wrap; align-items: center;
      }
      .info-card { flex: 1; min-width: 360px; }
      .info-progress { flex: 1; min-width: 280px; }
    }
  `],
})
export class EmergencyFlowContainer {
  readonly markers = input.required<MapMarker[]>();
  readonly route = input.required<[number, number][]>();
  readonly state = input.required<string>();
  readonly ambulancePlate = input('');
  readonly driverName = input('');
  readonly hospitalName = input('');
  readonly etaFormatted = input('');
  readonly progress = input(0);
  readonly exit = output();
  readonly markerClick = output<MapMarker>();

  readonly showTraffic = signal(false);
}
