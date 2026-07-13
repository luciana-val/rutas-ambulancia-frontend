import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-emergency-found',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="found-screen">
      <div class="found-body">
        <div class="found-icon-wrap">
          <div class="found-pulse-ring"></div>
          <mat-icon class="found-icon">check_circle</mat-icon>
        </div>
        <p class="found-title">Ambulancia encontrada</p>
        <p class="found-sub">
          {{ ambulancePlate() }} está en camino hacia tu ubicación
        </p>
        <div class="found-details">
          <div class="found-detail-row">
            <div class="found-detail-icon">
              <mat-icon>directions_car</mat-icon>
            </div>
            <div class="found-detail-text">
              <span class="found-detail-label">Patente</span>
              <span class="found-detail-value">{{ ambulancePlate() }}</span>
            </div>
          </div>
          <div class="found-detail-row">
            <div class="found-detail-icon">
              <mat-icon>local_hospital</mat-icon>
            </div>
            <div class="found-detail-text">
              <span class="found-detail-label">Hospital</span>
              <span class="found-detail-value">{{ hospitalName() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .found-screen {
      position: fixed; inset: 0; z-index: 200;
      background: white;
      display: flex; flex-direction: column;
    }
    .found-body {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px; padding: 40px;
      text-align: center;
    }
    .found-icon-wrap {
      position: relative; width: clamp(120px, 28vw, 160px);
      height: clamp(120px, 28vw, 160px);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px;
    }
    .found-pulse-ring {
      position: absolute; width: 100%; height: 100%;
      border-radius: 50%;
      border: 4px solid #1a1a1a;
      animation: found-pulse 1.5s ease-out infinite;
    }
    .found-icon {
      font-size: clamp(72px, 16vw, 96px) !important;
      width: clamp(72px, 16vw, 96px) !important;
      height: clamp(72px, 16vw, 96px) !important;
      color: #1a1a1a;
      animation: found-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .found-title {
      font-size: clamp(28px, 6vw, 36px);
      font-weight: 700; color: #1a1a1a;
      margin: 0;
    }
    .found-sub {
      font-size: clamp(18px, 4vw, 22px);
      color: #888; margin: 0 0 16px; max-width: 400px;
    }
    .found-details {
      display: flex; flex-direction: column; gap: 14px;
      background: #fafafa; border-radius: 16px;
      padding: 20px 28px; width: 100%; max-width: 400px;
    }
    .found-detail-row {
      display: flex; align-items: flex-start; gap: 14px;
      font-size: clamp(16px, 3.5vw, 20px);
      color: #1a1a1a;
    }
    .found-detail-icon {
      width: 42px; height: 42px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: #1a1a1a; border-radius: 10px;
    }
    .found-detail-icon mat-icon { font-size: 22px !important; width: 22px !important; height: 22px !important; color: white; }
    .found-detail-text { display: flex; flex-direction: column; gap: 1px; text-align: left; }
    .found-detail-label { font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
    .found-detail-value { font-size: clamp(18px, 4vw, 22px); font-weight: 700; color: #1a1a1a; }
    @keyframes found-pulse {
      0% { transform: scale(0.85); opacity: 0.5; }
      100% { transform: scale(1.3); opacity: 0; }
    }
    @keyframes found-pop {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }
  `],
})
export class EmergencyFound {
  readonly ambulancePlate = input('');
  readonly hospitalName = input('');
}
