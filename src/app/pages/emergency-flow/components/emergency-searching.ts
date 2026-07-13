import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-emergency-searching',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="searching-screen">
      <button class="searching-back" (click)="exit.emit()">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <div class="searching-body">
        <div class="searching-icon-wrap">
          <div class="searching-pulse-ring"></div>
          <mat-icon class="searching-icon">search</mat-icon>
        </div>
        <p class="searching-title">
          @if (state() === 'requesting_location') {
            Solicitando ubicación...
          } @else {
            Buscando ambulancia disponible
          }
        </p>
        <p class="searching-sub">
          @if (state() === 'requesting_location') {
            Por favor permite el acceso a tu ubicación
          } @else {
            Localizando la ambulancia más cercana
          }
        </p>
        <div class="searching-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .searching-screen {
      position: fixed; inset: 0; z-index: 200;
      background: white;
      display: flex; flex-direction: column;
    }
    .searching-back {
      position: absolute; top: max(16px, env(safe-area-inset-top, 16px));
      left: 16px; z-index: 10;
      background: none; border: none; color: #1a1a1a; cursor: pointer;
      display: flex; align-items: center; padding: 12px;
      border-radius: 50%; transition: background 0.2s;
    }
    .searching-back:hover { background: #f0f0f0; }
    .searching-back mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .searching-body {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 24px; padding: 40px;
    }
    .searching-icon-wrap {
      position: relative; width: clamp(120px, 28vw, 160px);
      height: clamp(120px, 28vw, 160px);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px;
    }
    .searching-pulse-ring {
      position: absolute; width: 100%; height: 100%;
      border-radius: 50%;
      border: 4px solid #1a1a1a;
      animation: searching-pulse 1.5s ease-out infinite;
    }
    .searching-icon {
      font-size: clamp(72px, 16vw, 96px) !important;
      width: clamp(72px, 16vw, 96px) !important;
      height: clamp(72px, 16vw, 96px) !important;
      color: #1a1a1a;
      animation: searching-spin 1.5s linear infinite;
    }
    .searching-title {
      font-size: clamp(28px, 6vw, 36px);
      font-weight: 700; color: #1a1a1a;
      margin: 0; text-align: center;
    }
    .searching-sub {
      font-size: clamp(18px, 4vw, 22px);
      color: #888; margin: 0; text-align: center;
      max-width: 400px;
    }
    .searching-dots { display: flex; gap: 12px; margin-top: 12px; }
    .searching-dots .dot {
      width: 16px; height: 16px; border-radius: 50%;
      background: #1a1a1a;
      animation: dot-bounce 1.4s infinite ease-in-out both;
    }
    .searching-dots .dot:nth-child(1) { animation-delay: -0.32s; }
    .searching-dots .dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes searching-pulse {
      0% { transform: scale(0.85); opacity: 0.5; }
      100% { transform: scale(1.3); opacity: 0; }
    }
    @keyframes searching-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes dot-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `],
})
export class EmergencySearching {
  readonly state = input.required<string>();
  readonly exit = output();
}
