import { Component, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-emergency-exit-dialog',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="exit-overlay" (click)="cancelExit.emit()">
      <div class="exit-dialog" (click)="$event.stopPropagation()">
        <div class="exit-icon-wrap">
          <mat-icon class="exit-icon">warning</mat-icon>
        </div>
        <p class="exit-title">¿Estás seguro de salir?</p>
        <p class="exit-sub">El aviso se cancelará</p>
        <div class="exit-actions">
          <button class="exit-btn exit-btn-confirm" (click)="confirmExit.emit()">
            <mat-icon>check</mat-icon>
            Sí, salir
          </button>
          <button class="exit-btn exit-btn-cancel" (click)="cancelExit.emit()">
            <mat-icon>close</mat-icon>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .exit-overlay {
      position: fixed; inset: 0; z-index: 500;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      padding: 32px;
    }
    .exit-dialog {
      background: white; border-radius: 24px;
      padding: 40px 36px 32px;
      max-width: 400px; width: 100%;
      text-align: center;
    }
    .exit-icon-wrap {
      width: 72px; height: 72px; border-radius: 50%;
      background: #fafafa; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
    }
    .exit-icon { font-size: 38px !important; width: 38px !important; height: 38px !important; color: #1a1a1a; }
    .exit-title { font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px; }
    .exit-sub { font-size: 17px; color: #888; margin: 0 0 28px; }
    .exit-actions { display: flex; flex-direction: column; gap: 12px; }
    .exit-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 16px 24px; border-radius: 14px;
      font-size: 18px; font-weight: 600; cursor: pointer; border: none;
      transition: transform 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .exit-btn:active { transform: scale(0.97); }
    .exit-btn mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .exit-btn-confirm { background: #1a1a1a; color: white; }
    .exit-btn-cancel { background: #f5f5f5; color: #555; }
  `],
})
export class EmergencyExitDialog {
  readonly confirmExit = output();
  readonly cancelExit = output();
}
