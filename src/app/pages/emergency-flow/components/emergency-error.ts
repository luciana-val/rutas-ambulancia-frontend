import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-emergency-error',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="error-screen">
      <button class="error-back" (click)="goHome.emit()">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <div class="error-body">
        <div class="error-icon-wrap">
          <div class="error-pulse-ring"></div>
          <mat-icon class="error-icon">error_outline</mat-icon>
        </div>
        <p class="error-title">
          @if (state() === 'no_ambulance') {
            No hay ambulancias disponibles
          } @else {
            Error al buscar ambulancia
          }
        </p>
        <p class="error-sub">
          @if (state() === 'no_ambulance') {
            En este momento no hay ambulancias disponibles en {{ hospitalName() }}.
          } @else {
            {{ errorMsg() }}
          }
        </p>
        <p class="error-hint">Puedes intentar de nuevo o volver más tarde</p>
        <button class="error-btn" (click)="retry.emit()">
          <mat-icon>refresh</mat-icon> Intentar de nuevo
        </button>
      </div>
    </div>
  `,
  styles: [`
    .error-screen {
      position: fixed; inset: 0; z-index: 200;
      background: white;
      display: flex; flex-direction: column;
    }
    .error-back {
      position: absolute; top: max(16px, env(safe-area-inset-top, 16px));
      left: 16px; z-index: 10;
      background: none; border: none; color: #1a1a1a; cursor: pointer;
      display: flex; align-items: center; padding: 12px;
      border-radius: 50%; transition: background 0.2s;
    }
    .error-back:hover { background: #f0f0f0; }
    .error-back mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .error-body {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px; padding: 40px;
      text-align: center;
    }
    .error-icon-wrap {
      position: relative; width: clamp(120px, 28vw, 160px);
      height: clamp(120px, 28vw, 160px);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px;
    }
    .error-pulse-ring {
      position: absolute; width: 100%; height: 100%;
      border-radius: 50%;
      border: 4px solid #1a1a1a;
      animation: error-pulse 1.5s ease-out infinite;
    }
    .error-icon {
      font-size: clamp(72px, 16vw, 96px) !important;
      width: clamp(72px, 16vw, 96px) !important;
      height: clamp(72px, 16vw, 96px) !important;
      color: #1a1a1a;
    }
    .error-title {
      font-size: clamp(28px, 6vw, 36px);
      font-weight: 700; color: #1a1a1a;
      margin: 0;
    }
    .error-sub {
      font-size: clamp(18px, 4vw, 22px);
      color: #888; margin: 0; max-width: 400px;
    }
    .error-hint {
      font-size: clamp(16px, 3.5vw, 20px);
      color: #bbb; margin: 8px 0 24px;
    }
    .error-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 18px 40px; border-radius: 16px;
      font-size: clamp(18px, 4vw, 22px);
      font-weight: 600; cursor: pointer; border: none;
      background: #1a1a1a; color: white;
      transition: transform 0.15s, box-shadow 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .error-btn:active { transform: scale(0.97); }
    .error-btn mat-icon { font-size: 26px; width: 26px; height: 26px; }
    @keyframes error-pulse {
      0% { transform: scale(0.85); opacity: 0.5; }
      100% { transform: scale(1.3); opacity: 0; }
    }
  `],
})
export class EmergencyError {
  readonly state = input.required<string>();
  readonly hospitalName = input('');
  readonly errorMsg = input('');
  readonly goHome = output();
  readonly retry = output();
}
