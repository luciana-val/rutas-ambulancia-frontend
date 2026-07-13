import { Component, output, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-emergency-thanks',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="thanks-screen">
      <div class="thanks-body">
        <div class="heart-container">
          <mat-icon class="heart-icon">favorite</mat-icon>
          <div class="heart-ring"></div>
        </div>
        <h1 class="thanks-title">¡Gracias por confirmar!</h1>
        <p class="thanks-text">Toda acción cuenta. <br> Gracias por ayudarnos a salvar vidas.</p>
        <button mat-flat-button class="thanks-btn" (click)="goHome.emit()">
          Volver al inicio
        </button>
      </div>
    </div>
  `,
  styles: [`
    .thanks-screen {
      position: fixed; inset: 0; z-index: 400;
      background: white;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 24px; text-align: center;
      animation: fadeIn 0.6s ease-out;
    }
    .thanks-body {
      display: flex; flex-direction: column; align-items: center; gap: 24px;
      max-width: 400px;
    }
    .heart-container {
      position: relative; width: 120px; height: 120px;
      display: flex; align-items: center; justify-content: center;
    }
    .heart-icon {
      font-size: 80px !important; width: 80px !important; height: 80px !important;
      color: #1a1a1a; z-index: 2;
      animation: heartBeat 1.2s ease-in-out infinite;
    }
    .heart-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 4px solid #f0f0f0;
      animation: ringExpand 2s ease-out infinite;
    }
    .thanks-title {
      font-size: clamp(24px, 6vw, 32px);
      font-weight: 800; color: #1a1a1a; margin: 0;
    }
    .thanks-text {
      font-size: clamp(16px, 4vw, 20px);
      color: #666; line-height: 1.5; margin: 0;
    }
    .thanks-btn {
      background: #1a1a1a !important; color: white !important;
      padding: 12px 32px; border-radius: 12px;
      font-size: 16px; font-weight: 600; margin-top: 16px;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes heartBeat {
      0% { transform: scale(1); }
      15% { transform: scale(1.2); }
      30% { transform: scale(1); }
      45% { transform: scale(1.15); }
      60% { transform: scale(1); }
    }
    @keyframes ringExpand {
      0% { transform: scale(0.5); opacity: 0.8; }
      100% { transform: scale(1.5); opacity: 0; }
    }
  `],
})
export class EmergencyThanks implements OnInit {
  readonly goHome = output();

  ngOnInit() {
    setTimeout(() => {
      this.goHome.emit();
    }, 10000);
  }
}
