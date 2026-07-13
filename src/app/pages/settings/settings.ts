import { Component, inject, afterNextRender } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SimulationService } from '../../shared/services/simulation.service';

@Component({
  selector: 'app-settings',
  imports: [MatCardModule, MatIconModule, MatSlideToggleModule, MatSnackBarModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Configuración</h1>
      <p class="page-subtitle">Ajustes globales del sistema</p>

      <div class="sim-card">
        <div class="card-header">
          <div class="card-icon">
            <mat-icon>science</mat-icon>
          </div>
          <div>
            <h2>Modo simulación</h2>
            <p class="header-desc">
              Al activar este modo, los despachadores pueden crear alertas simuladas
              para probar el flujo de respuesta sin afectar operaciones reales.
            </p>
          </div>
        </div>

        <ul class="feature-list">
          <li><mat-icon>location_on</mat-icon> Alertas simuladas en el mapa</li>
          <li><mat-icon>directions_car</mat-icon> Asignación automática de ambulancia</li>
          <li><mat-icon>speed</mat-icon> Movimiento 10× con tráfico real</li>
          <li><mat-icon>school</mat-icon> Ideal para entrenamiento y demostraciones</li>
        </ul>

        <div class="toggle-block">
          <span class="toggle-label">Activar modo simulación</span>
          <mat-slide-toggle
            [checked]="simulation.status().enabled"
            (toggleChange)="toggleSimulation()"
            class="sim-toggle"
          />
        </div>
      </div>

      @if (simulation.status().enabled) {
        <div class="hint">
          <mat-icon>info</mat-icon>
          Los despachadores ya pueden crear alertas simuladas desde su panel.
        </div>
      }
    </div>
  `,
  styles: [`
    .sim-card {
      max-width: 680px; margin-top: 8px;
      background: white; border-radius: 12px;
      border: 1px solid #e0e0e0;
    }
    .card-header {
      display: flex; gap: 16px; padding: 24px 24px 0;
    }
    .card-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: #1a1a1a; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
    }
    .card-icon mat-icon { color: white; font-size: 24px; width: 24px; height: 24px; }
    .card-header h2 {
      margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #1a1a1a;
    }
    .header-desc {
      margin: 0; font-size: 14px; line-height: 1.6; color: #666;
    }

    .feature-list {
      list-style: none; margin: 20px 24px 0; padding: 0;
      display: flex; flex-direction: column; gap: 10px;
    }
    .feature-list li {
      display: flex; align-items: center; gap: 10px;
      font-size: 14px; color: #444;
    }
    .feature-list li mat-icon {
      font-size: 20px; width: 20px; height: 20px; color: #1a1a1a;
    }

    .toggle-block {
      margin: 24px; padding: 16px 20px; border-radius: 10px;
      background: #f5f5f5; border: 1px solid #e8e8e8;
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }
    .toggle-label {
      font-size: 14px; font-weight: 600; color: #1a1a1a;
    }

    .sim-toggle {
      flex-shrink: 0;
    }

    :host ::ng-deep .sim-toggle {
      --mdc-switch-track-height: 28px;
      --mdc-switch-track-width: 50px;
      --mdc-switch-thumb-size: 22px;
      --mdc-switch-track-shape: 14px;
      --mdc-switch-thumb-shape: 50%;
    }
    :host ::ng-deep .sim-toggle .mdc-switch__track {
      border: 2px solid #ccc;
    }
    :host ::ng-deep .sim-toggle.mdc-switch--selected .mdc-switch__track {
      background: #1a1a1a !important;
      border-color: #1a1a1a;
    }
    :host ::ng-deep .sim-toggle:not(.mdc-switch--selected) .mdc-switch__track {
      background: #e0e0e0 !important;
    }
    :host ::ng-deep .sim-toggle .mdc-switch__handle {
      background: white !important;
    }
    :host ::ng-deep .sim-toggle.mdc-switch--selected .mdc-switch__handle {
      background: white !important;
    }

    .hint {
      max-width: 680px; margin-top: 16px; padding: 14px 18px;
      border-radius: 10px; display: flex; align-items: center; gap: 10px;
      font-size: 14px; color: #1a1a1a; background: #f5f5f5;
      border: 1px solid #e0e0e0;
    }
    .hint mat-icon { font-size: 20px; width: 20px; height: 20px; }

    @media (max-width: 600px) {
      .card-header { flex-direction: column; }
      .toggle-block { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class Settings {
  protected simulation = inject(SimulationService);
  private snackBar = inject(MatSnackBar);

  constructor() {
    afterNextRender(() => this.simulation.checkStatus());
  }

  toggleSimulation() {
    const prev = this.simulation.status();
    const next = { enabled: !prev.enabled, startedAt: prev.enabled ? null : new Date().toISOString() };
    this.simulation.status.set(next);

    this.simulation.toggle().subscribe({
      next: (s) => {
        this.simulation.status.set(s);
        this.snackBar.open(
          s.enabled ? 'Modo simulación activado' : 'Modo simulación desactivado',
          'Cerrar', { duration: 3000 },
        );
      },
      error: () => {
        this.simulation.status.set(prev);
        this.snackBar.open('Error al cambiar modo simulación', 'Cerrar', { duration: 3000 });
      },
    });
  }
}
