import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-emergency-arrival',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="arrival-screen">
      <div class="arrival-body">
        <div class="arrival-icon-wrap">
          <div class="arrival-icon-ring"></div>
          <mat-icon class="arrival-icon">check_circle</mat-icon>
        </div>
        <h1 class="arrival-title">La ambulancia ha llegado</h1>
        <p class="arrival-sub">Confirma que la ambulancia ya está en tu ubicación</p>

        <div class="arrival-details">
          <div class="arrival-detail-row">
            <mat-icon>directions_car</mat-icon>
            <span>{{ ambulancePlate() }}</span>
          </div>
          @if (driverName()) {
            <div class="arrival-detail-row">
              <mat-icon>person</mat-icon>
              <span>{{ driverName() }}</span>
            </div>
          }
          <div class="arrival-detail-row">
            <mat-icon>local_hospital</mat-icon>
            <span>{{ hospitalName() }}</span>
          </div>
        </div>

        <div class="arrival-timer">
          <svg class="arrival-timer-ring" viewBox="0 0 60 60">
            <circle class="arrival-timer-bg" cx="30" cy="30" r="26" />
            <circle class="arrival-timer-fill" cx="30" cy="30" r="26"
              [style.stroke-dashoffset.px]="timerOffset()" />
          </svg>
          <span class="arrival-timer-text">{{ confirmCountdown() }}</span>
        </div>
        <p class="arrival-timer-label">Finalizando en {{ confirmCountdown() }} segundos</p>
      </div>
    </div>
  `,
  styles: [`
    .arrival-screen {
      position: fixed; inset: 0; z-index: 300;
      background: white;
      display: flex; flex-direction: column;
    }
    .arrival-body {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: clamp(24px, 5vw, 40px) clamp(24px, 5vw, 36px);
      text-align: center;
    }
    .arrival-icon-wrap {
      position: relative; width: clamp(100px, 22vw, 130px);
      height: clamp(100px, 22vw, 130px);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .arrival-icon-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 4px solid #1a1a1a;
      animation: arrival-ring 2s ease-out infinite;
    }
    .arrival-icon {
      font-size: clamp(56px, 14vw, 72px) !important;
      width: clamp(56px, 14vw, 72px) !important;
      height: clamp(56px, 14vw, 72px) !important;
      color: #1a1a1a;
      animation: arrival-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .arrival-title {
      font-size: clamp(26px, 6vw, 34px);
      font-weight: 800; color: #1a1a1a;
      margin: 0 0 8px;
    }
    .arrival-sub {
      font-size: clamp(16px, 3.5vw, 19px);
      color: #888; margin: 0 0 24px; line-height: 1.4;
    }
    .arrival-details {
      display: flex; flex-direction: column; gap: 12px;
      background: #fafafa; border-radius: 14px;
      padding: 16px 22px; margin-bottom: 24px;
      width: 100%; max-width: 360px;
    }
    .arrival-detail-row {
      display: flex; align-items: center; gap: 10px;
      font-size: clamp(15px, 3.5vw, 18px);
      color: #1a1a1a; font-weight: 500;
    }
    .arrival-detail-row mat-icon { font-size: 22px; width: 22px; height: 22px; color: #555; }
    .arrival-timer {
      position: relative; width: 68px; height: 68px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
    }
    .arrival-timer-ring { position: absolute; inset: 0; transform: rotate(-90deg); }
    .arrival-timer-bg { fill: none; stroke: #e0e0e0; stroke-width: 4; }
    .arrival-timer-fill {
      fill: none; stroke: #1a1a1a; stroke-width: 4;
      stroke-dasharray: 163.36; transition: stroke-dashoffset 1s linear;
    }
    .arrival-timer-text {
      font-size: 24px; font-weight: 800; color: #1a1a1a;
    }
    .arrival-timer-label {
      font-size: clamp(14px, 3vw, 16px);
      color: #888;       margin: 0 0 24px;
    }
    .arrival-timer {
      position: relative; width: 68px; height: 68px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
    }
    .arrival-timer-ring { position: absolute; inset: 0; transform: rotate(-90deg); }
    .arrival-timer-bg { fill: none; stroke: #e0e0e0; stroke-width: 4; }
    .arrival-timer-fill {
      fill: none; stroke: #1a1a1a; stroke-width: 4;
      stroke-dasharray: 163.36; transition: stroke-dashoffset 1s linear;
    }
    .arrival-timer-text {
      font-size: 24px; font-weight: 800; color: #1a1a1a;
    }
    .arrival-timer-label {
      font-size: clamp(14px, 3vw, 16px);
      color: #888; margin: 0;
    }
    @keyframes arrival-ring {
      0% { transform: scale(0.85); opacity: 0.6; }
      100% { transform: scale(1.25); opacity: 0; }
    }
    @keyframes arrival-pop {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }
    @media (max-width: 600px) {
      .arrival-body { justify-content: flex-start; padding-top: clamp(32px, 8vh, 56px); }
    }
    @media (min-width: 768px) {
      .arrival-icon-wrap { width: 90px; height: 90px; }
      .arrival-icon { font-size: 50px !important; width: 50px !important; height: 50px !important; }
      .arrival-title { font-size: 26px; margin-bottom: 6px; }
      .arrival-sub { font-size: 15px; margin-bottom: 18px; }
      .arrival-details { padding: 14px 20px; gap: 10px; max-width: 320px; }
      .arrival-detail-row { font-size: 14px; }
      .arrival-detail-row mat-icon { font-size: 20px; width: 20px; height: 20px; }
      .arrival-timer { width: 56px; height: 56px; }
      .arrival-timer-text { font-size: 20px; }
      .arrival-timer-label { font-size: 13px; margin-bottom: 18px; }
    }
  `],
})
export class EmergencyArrival {
  readonly ambulancePlate = input('');
  readonly driverName = input('');
  readonly hospitalName = input('');
  readonly confirmCountdown = input(15);
  readonly timerOffset = input(0);
}
